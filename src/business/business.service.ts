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

}