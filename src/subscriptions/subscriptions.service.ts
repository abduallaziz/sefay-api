import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';

@Injectable()
export class SubscriptionsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  // جيب الاشتراك الحالي للـ business
  async getCurrent(businessId: string) {
  const { data, error } = await this.supabase
    .from('subscriptions')
    .select('*')
    .eq('tenant_id', businessId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('getCurrent error:', error);
    return null;
  }
  return data;
}

  // جيب كل الاشتراكات (تاريخ)
  async getHistory(businessId: string) {
  const { data, error } = await this.supabase
    .from('subscriptions')
    .select('*')
    .eq('tenant_id', businessId)
    .order('started_at', { ascending: false });

  if (error) {
    console.error('getHistory error:', error);
    return [];
  }
  return data || [];
}

  // أنشئ اشتراك جديد (superadmin فقط)
  async create(businessId: string, dto: {
    plan: string;
    billing_cycle: 'monthly' | 'yearly';
    payment_ref?: string;
  }) {
    // جيب بيانات الخطة
    const { data: plan, error: planError } = await this.supabase
      .from('plans')
      .select('*')
      .eq('id', dto.plan)
      .single();

    if (planError || !plan) throw new Error('الخطة غير موجودة');

    // احسب تاريخ الانتهاء
    const startedAt = new Date();
    const expiresAt = new Date(startedAt);
    if (dto.billing_cycle === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // ألغِ الاشتراك القديم
    await this.supabase
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('tenant_id', businessId)
      .eq('status', 'active');

    // أنشئ الاشتراك الجديد
    const { data, error } = await this.supabase
      .from('subscriptions')
      .insert({
        tenant_id: businessId,
        plan: dto.plan,
        status: 'active',
        started_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        price: plan.price,
        billing_cycle: dto.billing_cycle,
        features: plan.features,
        max_users: plan.max_users,
        max_branches: plan.max_branches,
        payment_ref: dto.payment_ref || null,
        auto_renew: false,
      })
      .select()
      .single();

    if (error) throw error;

    // حدّث tenant plan
    await this.supabase
      .from('tenants')
      .update({ plan: dto.plan })
      .eq('id', businessId);

    return data;
  }

  // إلغاء اشتراك (superadmin فقط)
  async cancel(businessId: string) {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        auto_renew: false,
      })
      .eq('tenant_id', businessId)
      .eq('status', 'active')
      .select()
      .single();

    if (error) throw error;

    // رجّع tenant لـ trial
    await this.supabase
      .from('tenants')
      .update({ plan: 'trial' })
      .eq('id', businessId);

    return data;
  }

  // جيب كل الاشتراكات (superadmin — كل الـ businesses)
  async getAll() {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select(`
        *,
        tenants (id, name, email)
      `)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}