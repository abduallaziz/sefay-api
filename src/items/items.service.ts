import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ItemsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async getItems(user: any) {
    const { data, error } = await this.supabase
      .from('items')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .eq('active', true)
      .order('category', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getAllItems(user: any) {
    const { data, error } = await this.supabase
      .from('items')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('category', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async createItem(user: any, body: {
    name: string;
    price: number;
    category?: string;
    icon?: string;
    color?: string;
    type?: string;
    bundle_items?: any[];
    image_url?: string;
    cashier_price?: boolean;
  }) {
    const { data, error } = await this.supabase
      .from('items')
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
        image_url: body.image_url || null,
        cashier_price: body.cashier_price ?? false,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateItem(user: any, id: string, body: {
    name?: string;
    price?: number;
    category?: string;
    icon?: string;
    color?: string;
    active?: boolean;
    type?: string;
    bundle_items?: any[];
    image_url?: string;
    cashier_price?: boolean;
  }) {
    const updateData: any = {};

    if (body.name !== undefined)          updateData.name = body.name;
    if (body.price !== undefined)         updateData.price = body.price;
    if (body.category !== undefined)      updateData.category = body.category;
    if (body.icon !== undefined)          updateData.icon = body.icon;
    if (body.color !== undefined)         updateData.color = body.color;
    if (body.active !== undefined)        updateData.active = body.active;
    if (body.type !== undefined)          updateData.type = body.type;
    if (body.bundle_items !== undefined)  updateData.bundle_items = body.bundle_items;
    if (body.image_url !== undefined)     updateData.image_url = body.image_url;
    if (body.cashier_price !== undefined) updateData.cashier_price = body.cashier_price;

    const { data, error } = await this.supabase
      .from('items')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.supabase.from('audit_logs').insert({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'update_item',
      entity: 'items',
      entity_id: id,
      details: updateData,
    });

    return data;
  }

  async deleteItem(user: any, id: string) {
    const { error } = await this.supabase
      .from('items')
      .update({ active: false })
      .eq('id', id)
      .eq('tenant_id', user.tenant_id);

    if (error) throw new BadRequestException(error.message);
    return { message: 'تم تعطيل الخدمة' };
  }

  async hardDeleteItem(user: any, id: string) {
    await this.supabase
      .from('order_items')
      .update({ item_id: null })
      .eq('item_id', id);

    const { error } = await this.supabase
      .from('items')
      .delete()
      .eq('id', id)
      .eq('tenant_id', user.tenant_id);

    if (error) throw new BadRequestException(error.message);
    return { message: 'تم الحذف النهائي' };
  }
}