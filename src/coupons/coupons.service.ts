import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class CouponsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async getAll(tenant_id: string) {
    const { data, error } = await this.supabase
      .from('coupons')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
    if (error) throw new BadRequestException(error.message)
    return data || []
  }

  async create(tenant_id: string, body: {
    code: string
    type: 'percent' | 'fixed'
    value: number
    min_order?: number
    max_uses?: number | null
    expires_at?: string | null
    active?: boolean
  }) {
    const { data, error } = await this.supabase
      .from('coupons')
      .insert({
        tenant_id,
        code: body.code.toUpperCase(),
        type: body.type,
        value: body.value,
        min_order: body.min_order || 0,
        max_uses: body.max_uses || null,
        expires_at: body.expires_at || null,
        active: body.active ?? true,
        used_count: 0,
      })
      .select()
      .single()
    if (error) throw new BadRequestException(error.message)
    return data
  }

  async update(id: string, tenant_id: string, body: any) {
    const updateData: any = {}
    if (body.code !== undefined)      updateData.code = body.code.toUpperCase()
    if (body.type !== undefined)      updateData.type = body.type
    if (body.value !== undefined)     updateData.value = body.value
    if (body.min_order !== undefined) updateData.min_order = body.min_order
    if (body.max_uses !== undefined)  updateData.max_uses = body.max_uses
    if (body.expires_at !== undefined) updateData.expires_at = body.expires_at
    if (body.active !== undefined)    updateData.active = body.active

    const { data, error } = await this.supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .select()
      .single()
    if (error) throw new BadRequestException(error.message)
    return data
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