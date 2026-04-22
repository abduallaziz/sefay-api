import { Injectable, Inject } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class CouponsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async getAll(tenant_id: string) {
    const { data } = await this.supabase
      .from('coupons')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('active', true)
    return data || []
  }

  async validate(code: string, tenant_id: string, subtotal: number) {
    const { data } = await this.supabase
      .from('coupons')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .maybeSingle()

    if (!data) return { valid: false, message: '❌ الكوبون غير صحيح أو منتهي' }
    if (data.expires_at && new Date(data.expires_at) < new Date())
      return { valid: false, message: '❌ انتهت صلاحية الكوبون' }
    if (data.max_uses !== null && data.used_count >= data.max_uses)
      return { valid: false, message: '❌ تم استنفاد الكوبون' }
    if (subtotal < data.min_order)
      return { valid: false, message: `❌ الحد الأدنى للطلب ${data.min_order} ر.س` }

    return { valid: true, coupon: data }
  }
}