import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';

@Injectable()
export class SuperAdminService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async getTenants(search?: string, status?: string, plan?: string) {
    let query = this.supabase
      .from('tenants')
      .select(`
        id, name, slug, plan, status, phone, email,
        city, business_type, onboarded,
        created_at, trial_ends_at, sub_start, sub_end
      `)
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
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !tenant) throw new NotFoundException('Tenant not found');

    const { data: subscription } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', id)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    const { count: usersCount } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id);

    const { count: branchesCount } = await this.supabase
      .from('branches')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id);

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
      .from('tenants')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async toggleTenantStatus(id: string, status: 'active' | 'inactive' | 'suspended') {
    const { data, error } = await this.supabase
      .from('tenants')
      .update({ status })
      .eq('id', id)
      .select('id, name, status')
      .single();

    if (error) throw error;
    return data;
  }

  async softDeleteTenant(id: string) {
    const { data, error } = await this.supabase
      .from('tenants')
      .update({ status: 'deleted' })
      .eq('id', id)
      .select('id, name, status')
      .single();

    if (error) throw error;
    return data;
  }

  async extendTrial(id: string, days: number) {
    const { data: tenant, error: fetchError } = await this.supabase
      .from('tenants')
      .select('trial_ends_at')
      .eq('id', id)
      .single();

    if (fetchError || !tenant) throw new NotFoundException('Tenant not found');

    const base = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : new Date();
    base.setDate(base.getDate() + days);

    const { data, error } = await this.supabase
      .from('tenants')
      .update({ trial_ends_at: base.toISOString() })
      .eq('id', id)
      .select('id, name, trial_ends_at')
      .single();

    if (error) throw error;
    return data;
  }
}