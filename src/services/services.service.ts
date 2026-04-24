import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ServicesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  // جلب الخدمات المفعّلة فقط (للـ POS)
  async getServices(user: any) {
    const { data, error } = await this.supabase
      .from('services')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .eq('active', true)
      .order('category', { ascending: true })

    if (error) throw new BadRequestException(error.message)
    return data
  }

  // جلب كل الخدمات (للإدارة)
  async getAllServices(user: any) {
    const { data, error } = await this.supabase
      .from('services')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('category', { ascending: true })

    if (error) throw new BadRequestException(error.message)
    return data
  }

  async createService(user: any, body: {
  name: string;
  price: number;
  category?: string;
  icon?: string;
  color?: string;
  type?: string;
  bundle_items?: any[];
}) {
  const { data, error } = await this.supabase
    .from('services')
    .insert({
      tenant_id: user.tenant_id,
      name: body.name,
      price: body.price,
      category: body.category || null,
      icon: body.icon || null,
      color: body.color || null,
      active: true,
      type: body.type || 'single',
      bundle_items: body.bundle_items || [],
    })
    .select()
    .single()

  if (error) throw new BadRequestException(error.message)
  return data
}

  async updateService(user: any, id: string, body: {
    name?: string;
    price?: number;
    category?: string;
    icon?: string;
    color?: string;
    active?: boolean;
  }) {
    const { data, error } = await this.supabase
      .from('services')
      .update(body)
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)

    await this.supabase.from('audit_logs').insert({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'update_service',
      entity: 'services',
      entity_id: id,
      details: body,
    })

    return data
  }

  async deleteService(user: any, id: string) {
    const { error } = await this.supabase
      .from('services')
      .update({ active: false })
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)

    if (error) throw new BadRequestException(error.message)
    return { message: 'تم تعطيل الخدمة' }
  }

  async hardDeleteService(user: any, id: string) {
  // أولاً نحذف service_id من order_items
  await this.supabase
    .from('order_items')
    .update({ service_id: null })
    .eq('service_id', id)

  // ثم نحذف الخدمة
  const { error } = await this.supabase
    .from('services')
    .delete()
    .eq('id', id)
    .eq('tenant_id', user.tenant_id)

  if (error) throw new BadRequestException(error.message)
  return { message: 'تم الحذف النهائي' }
}
}