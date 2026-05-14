import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  // ─── OVERVIEW ───────────────────────────────────────────────
  async getOverview() {
    const { count: totalTenants } = await this.supabase
      .from('tenants').select('*', { count: 'exact', head: true });

    const { count: activeTenants } = await this.supabase
      .from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'active');

    const { count: trialTenants } = await this.supabase
      .from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'trial');

    const { data: revenueData } = await this.supabase
      .from('subscriptions').select('price').eq('status', 'active');

    const totalRevenue = revenueData?.reduce((sum, s) => sum + (s.price || 0), 0) ?? 0;

    const months: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const from = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      const to   = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();
      const { count } = await this.supabase
        .from('tenants').select('*', { count: 'exact', head: true })
        .gte('created_at', from).lte('created_at', to);
      months.push({ month: d.toLocaleString('ar-SA', { month: 'short' }), count: count ?? 0 });
    }

    return { totalTenants, activeTenants, trialTenants, totalRevenue, monthlyGrowth: months };
  }

  // ─── TENANTS ─────────────────────────────────────────────────
  async getTenants(search?: string, status?: string, plan?: string) {
    let query = this.supabase
      .from('tenants')
      .select(`id, name, slug, plan, status, phone, email,
               city, business_type, onboarded,
               created_at, trial_ends_at, sub_start, sub_end`)
      .order('created_at', { ascending: false });

    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    if (status) query = query.eq('status', status);
    if (plan)   query = query.eq('plan', plan);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getTenantById(id: string) {
    const { data: tenant, error } = await this.supabase
      .from('tenants').select('*').eq('id', id).single();

    if (error || !tenant) throw new NotFoundException('Tenant not found');

    const { data: subscription } = await this.supabase
      .from('subscriptions').select('*').eq('tenant_id', id)
      .order('started_at', { ascending: false }).limit(1).single();

    const { count: usersCount } = await this.supabase
      .from('users').select('*', { count: 'exact', head: true }).eq('tenant_id', id);

    const { count: branchesCount } = await this.supabase
      .from('branches').select('*', { count: 'exact', head: true }).eq('tenant_id', id);

    return { ...tenant, subscription, usersCount, branchesCount };
  }

  async updateTenant(id: string, dto: Record<string, any>) {
    const allowed = ['name', 'phone', 'email', 'city', 'district',
                     'street', 'address', 'vat_number', 'tax_number',
                     'website', 'plan', 'business_type', 'timezone'];
    const payload: Record<string, any> = {};
    for (const key of allowed) {
      if (dto[key] !== undefined) payload[key] = dto[key];
    }
    const { data, error } = await this.supabase
      .from('tenants').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async toggleTenantStatus(id: string, status: 'active' | 'inactive' | 'suspended') {
    const { data, error } = await this.supabase
      .from('tenants').update({ status }).eq('id', id)
      .select('id, name, status').single();
    if (error) throw error;
    return data;
  }

  async softDeleteTenant(id: string) {
    const { data, error } = await this.supabase
      .from('tenants').update({ status: 'deleted' }).eq('id', id)
      .select('id, name, status').single();
    if (error) throw error;
    return data;
  }

  async extendTrial(id: string, days: number) {
    const { data: tenant, error: fetchError } = await this.supabase
      .from('tenants').select('trial_ends_at').eq('id', id).single();
    if (fetchError || !tenant) throw new NotFoundException('Tenant not found');

    const base = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : new Date();
    base.setDate(base.getDate() + days);

    const { data, error } = await this.supabase
      .from('tenants').update({ trial_ends_at: base.toISOString() })
      .eq('id', id).select('id, name, trial_ends_at').single();
    if (error) throw error;
    return data;
  }

  // ─── SUBSCRIPTIONS ───────────────────────────────────────────
  async getSubscriptions(tenantId?: string, status?: string) {
    let query = this.supabase
      .from('subscriptions')
      .select(`*, tenants(id, name, email)`)
      .order('started_at', { ascending: false });

    if (tenantId) query = query.eq('tenant_id', tenantId);
    if (status)   query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async createSubscription(dto: {
    tenant_id: string;
    plan: string;
    price: number;
    billing_cycle: 'monthly' | 'yearly';
    started_at: string;
    expires_at: string;
    max_users?: number;
    max_branches?: number;
    payment_ref?: string;
    auto_renew?: boolean;
  }) {
    await this.supabase
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('tenant_id', dto.tenant_id)
      .eq('status', 'active');

    const { data, error } = await this.supabase
      .from('subscriptions')
      .insert({ ...dto, status: 'active' })
      .select()
      .single();

    if (error) throw error;

    await this.supabase
      .from('tenants')
      .update({
        plan: dto.plan,
        status: 'active',
        sub_start: dto.started_at,
        sub_end: dto.expires_at,
      })
      .eq('id', dto.tenant_id);

    return data;
  }

  async cancelSubscription(id: string) {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateSubscriptionExpiry(id: string, expires_at: string) {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .update({ expires_at })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addManualPayment(dto: {
    subscription_id: string;
    tenant_id: string;
    amount: number;
    payment_ref: string;
    note?: string;
  }) {
    const { data, error } = await this.supabase
      .from('payments')
      .insert({
        subscription_id: dto.subscription_id,
        tenant_id: dto.tenant_id,
        amount: dto.amount,
        payment_ref: dto.payment_ref,
        note: dto.note ?? null,
        paid_at: new Date().toISOString(),
        method: 'manual',
        status: 'paid',
      })
      .select()
      .single();

    if (error) throw error;

    await this.supabase
      .from('subscriptions')
      .update({ payment_ref: dto.payment_ref })
      .eq('id', dto.subscription_id);

    return data;
  }

  // ─── PLANS ───────────────────────────────────────────────────
  async getPlans() {
    const { data, error } = await this.supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });
    if (error) throw error;
    return data;
  }

  async updatePlan(id: string, dto: Partial<{
    name: string;
    price: number;
    currency: string;
    max_branches: number;
    max_users: number;
    features: Record<string, any>;
    is_active: boolean;
  }>) {
    const { data, error } = await this.supabase
      .from('plans')
      .update(dto)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ─── PER-TENANT OVERRIDE ─────────────────────────────────────
  async updateCapabilities(tenantId: string, dto: {
    max_users?: number;
    max_branches?: number;
    capabilities?: Record<string, boolean>;
  }) {
    const payload: Record<string, any> = {};
    if (dto.max_users    !== undefined) payload.max_users    = dto.max_users;
    if (dto.max_branches !== undefined) payload.max_branches = dto.max_branches;
    if (dto.capabilities !== undefined) payload.capabilities = dto.capabilities;

    const { data, error } = await this.supabase
      .from('tenants')
      .update(payload)
      .eq('id', tenantId)
      .select('id, name, max_users, max_branches, capabilities')
      .single();
    if (error) throw error;
    return data;
  }

  // ─── AUTH CONTROL ─────────────────────────────────────────────
  async getTenantUsers(tenantId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, name, email, phone, role, is_active, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async addUserToTenant(tenantId: string, dto: {
  name: string;
  email: string;
  phone?: string;
  role: string;
  password: string;
}) {
  const hashed = await bcrypt.hash(dto.password, 10);
  const { data, error } = await this.supabase
    .from('users')
    .insert({
      tenant_id:     tenantId,
      name:          dto.name,
      email:         dto.email,
      phone:         dto.phone ?? null,
      role:          dto.role,
      password_hash: hashed,
      is_active:     true,
      created_at:    new Date().toISOString(),
    })
    .select('id, name, email, role')
    .single();
  if (error) throw error;
  return data;
}

  async removeUser(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)
      .select('id, name, is_active')
      .single();
    if (error) throw error;
    return data;
  }

  async changeUserRole(userId: string, role: string) {
    const { data, error } = await this.supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select('id, name, role')
      .single();
    if (error) throw error;
    return data;
  }

  async getReports() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const in7Days  = new Date(Date.now() + 7  * 24 * 60 * 60 * 1000).toISOString();
  const ago90    = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // MRR: مجموع الاشتراكات الشهرية النشطة
  const { data: activeSubs } = await this.supabase
    .from('subscriptions')
    .select('price, billing_cycle')
    .eq('status', 'active');

  const mrr = (activeSubs || []).reduce((sum, s) => {
    if (s.billing_cycle === 'monthly') return sum + Number(s.price);
    if (s.billing_cycle === 'yearly')  return sum + Number(s.price) / 12;
    return sum;
  }, 0);

  const arr = mrr * 12;

  // إيرادات الشهر الحالي
  const { data: monthPayments } = await this.supabase
    .from('payments')
    .select('amount')
    .gte('created_at', startOfMonth);

  const monthRevenue = (monthPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);

  // Churn: اشتراكات أُلغيت هذا الشهر
  const { data: churned } = await this.supabase
    .from('subscriptions')
    .select('id, tenant_id, cancelled_at, tenants(name)')
    .eq('status', 'cancelled')
    .gte('cancelled_at', startOfMonth);

  // على وشك الانتهاء (خلال 30 يوم)
  const { data: expiringSoon } = await this.supabase
    .from('subscriptions')
    .select('id, tenant_id, expires_at, plan, tenants(name, email)')
    .eq('status', 'active')
    .lte('expires_at', in30Days)
    .gte('expires_at', now.toISOString())
    .order('expires_at', { ascending: true });

  // على وشك الانتهاء خلال 7 أيام فقط
  const expiringCritical = (expiringSoon || []).filter(
    s => new Date(s.expires_at) <= new Date(in7Days),
  );

  // Tenants غير نشطين (لم يسجلوا دخول آخر 90 يوم)
  const { data: inactiveRaw } = await this.supabase
    .from('tenants')
    .select('id, name, email, last_login_at, status')
    .eq('status', 'active')
    .or(`last_login_at.lte.${ago90},last_login_at.is.null`);

  // أكثر business types
  const { data: bizTypes } = await this.supabase
    .from('tenants')
    .select('business_type')
    .not('business_type', 'is', null);

  const typeCounts: Record<string, number> = {};
  (bizTypes || []).forEach(t => {
    if (t.business_type) typeCounts[t.business_type] = (typeCounts[t.business_type] || 0) + 1;
  });
  const topBusinessTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([type, count]) => ({ type, count }));

  return {
    mrr:              Math.round(mrr),
    arr:              Math.round(arr),
    monthRevenue:     Math.round(monthRevenue),
    churnCount:       (churned || []).length,
    churned:          churned || [],
    expiringSoon:     expiringSoon || [],
    expiringCritical: expiringCritical.length,
    inactive:         inactiveRaw || [],
    topBusinessTypes,
  };
}

  async resetUserPassword(userId: string, newPassword: string) {
    const hashed = await bcrypt.hash(newPassword, 10);
    const { data, error } = await this.supabase
      .from('users')
      .update({ password_hash: hashed })
      .eq('id', userId)
      .select('id, name')
      .single();
    if (error) throw error;
    return { ...data, message: 'Password updated' };
  }

  async revokeTenantSessions(tenantId: string) {
    // نحدث refresh_token لكل users الـ tenant = null
    const { error } = await this.supabase
      .from('users')
      .update({ refresh_token: null })
      .eq('tenant_id', tenantId);
    if (error) throw error;
    return { message: `All sessions revoked for tenant ${tenantId}` };
  }
}