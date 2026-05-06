import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { Capability } from '../common/enums';

@Injectable()
export class BusinessService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async getConfig(businessId: string) {
    const { data, error } = await this.supabase
      .from('business_config')
      .select('*')
      .eq('business_id', businessId)
      .single();

    if (error || !data) {
      return { capabilities: [] };
    }

    return data;
  }

  async updateConfig(businessId: string, capabilities: Capability[]) {
    const { data, error } = await this.supabase
      .from('business_config')
      .upsert({ business_id: businessId, capabilities })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTrial(businessId: string) {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('plan, trial_ends_at')
      .eq('id', businessId)
      .single();

    if (error || !data) return { plan: 'trial', daysLeft: 0 };

    const trialEnd = new Date(data.trial_ends_at);
    const now = new Date();
    const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      plan: data.plan,
      trial_ends_at: data.trial_ends_at,
      daysLeft,
      isExpired: daysLeft === 0,
    };
  }

  async getPlans() {
    const { data, error } = await this.supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price');

    if (error) throw error;
    return data;
  }

  async upgradePlan(businessId: string, planId: string) {
    const { data: plan, error: planError } = await this.supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) throw new Error('الخطة غير موجودة');

    const { data, error } = await this.supabase
      .from('tenants')
      .update({ plan: planId })
      .eq('id', businessId)
      .select('id, name, plan, trial_ends_at')
      .single();

    if (error) throw error;
    return data;
  }

  async getCurrentPlan(businessId: string) {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('plan, trial_ends_at')
      .eq('id', businessId)
      .single();

    if (error || !data) return null;

    const { data: plan } = await this.supabase
      .from('plans')
      .select('*')
      .eq('id', data.plan)
      .single();

    return { ...data, planDetails: plan };
  }



  async getPosConfig(businessId: string) {
  const { data } = await this.supabase
    .from('business_config')
    .select('pos_customer_fields')
    .eq('business_id', businessId)
    .single()

  // القيم الافتراضية
  return data?.pos_customer_fields || {
    name:  'optional',
    phone: 'optional',
    plate: 'optional',
  }
}

async updatePosConfig(businessId: string, fields: {
  name?:  'required' | 'optional' | 'hidden'
  phone?: 'required' | 'optional' | 'hidden'
  plate?: 'required' | 'optional' | 'hidden'
}) {
  const { data, error } = await this.supabase
    .from('business_config')
    .upsert({
      business_id:         businessId,
      pos_customer_fields: fields,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
}