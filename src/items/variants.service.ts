import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class VariantsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async getVariantGroups(user: any, itemId: string) {
    const { data, error } = await this.supabase
      .from('item_variant_groups')
      .select('*, item_variant_options(*)')
      .eq('item_id', itemId)
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async createVariantGroup(user: any, itemId: string, body: {
    name: string;
    type?: string;
    required?: boolean;
    multi_select?: boolean;
    min_select?: number;
    max_select?: number;
  }) {
    const { data, error } = await this.supabase
      .from('item_variant_groups')
      .insert({
        tenant_id:    user.tenant_id,
        item_id:      itemId,
        name:         body.name,
        type:         body.type         ?? 'VARIANT',
        required:     body.required     ?? false,
        multi_select: body.multi_select ?? false,
        min_select:   body.min_select   ?? 1,
        max_select:   body.max_select   ?? 1,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateVariantGroup(user: any, groupId: string, body: {
    name?: string;
    type?: string;
    required?: boolean;
    multi_select?: boolean;
    min_select?: number;
    max_select?: number;
  }) {
    const { data, error } = await this.supabase
      .from('item_variant_groups')
      .update(body)
      .eq('id', groupId)
      .eq('tenant_id', user.tenant_id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deleteVariantGroup(user: any, groupId: string) {
    const { error } = await this.supabase
      .from('item_variant_groups')
      .delete()
      .eq('id', groupId)
      .eq('tenant_id', user.tenant_id);

    if (error) throw new BadRequestException(error.message);
    return { message: 'تم الحذف' };
  }

  async createVariantOption(user: any, groupId: string, body: {
    name: string;
    price_adjustment?: number;
    sku?: string;
    stock_quantity?: number;
    item_id: string;
  }) {
    const { data, error } = await this.supabase
      .from('item_variant_options')
      .insert({
        tenant_id:        user.tenant_id,
        group_id:         groupId,
        item_id:          body.item_id,
        name:             body.name,
        price_adjustment: body.price_adjustment ?? 0,
        sku:              body.sku              ?? null,
        stock_quantity:   body.stock_quantity   ?? 0,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateVariantOption(user: any, optionId: string, body: {
    name?: string;
    price_adjustment?: number;
    sku?: string;
    stock_quantity?: number;
  }) {
    const { data, error } = await this.supabase
      .from('item_variant_options')
      .update(body)
      .eq('id', optionId)
      .eq('tenant_id', user.tenant_id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deleteVariantOption(user: any, optionId: string) {
    const { error } = await this.supabase
      .from('item_variant_options')
      .delete()
      .eq('id', optionId)
      .eq('tenant_id', user.tenant_id);

    if (error) throw new BadRequestException(error.message);
    return { message: 'تم الحذف' };
  }

  async adjustStock(user: any, optionId: string, body: {
    type: 'MANUAL' | 'RECEIVE';
    quantity_change: number;
    notes?: string;
    item_id: string;
  }) {
    const { data: option, error: fetchErr } = await this.supabase
      .from('item_variant_options')
      .select('stock_quantity')
      .eq('id', optionId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (fetchErr || !option) throw new BadRequestException('الخيار غير موجود');

    const before = Number(option.stock_quantity) || 0;
    const after  = before + body.quantity_change;

    if (after < 0) throw new BadRequestException('المخزون لا يمكن أن يكون سالباً');

    await this.supabase
      .from('item_variant_options')
      .update({ stock_quantity: after })
      .eq('id', optionId);

    await this.supabase.from('inventory_logs').insert({
      tenant_id:         user.tenant_id,
      item_id:           body.item_id,
      variant_option_id: optionId,
      type:              body.type,
      quantity_change:   body.quantity_change,
      quantity_before:   before,
      quantity_after:    after,
      notes:             body.notes ?? null,
      created_by:        user.id,
    });

    return { before, after, change: body.quantity_change };
  }

  async getInventoryLogs(user: any, itemId: string) {
    const { data, error } = await this.supabase
      .from('inventory_logs')
      .select('*')
      .eq('item_id', itemId)
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getLowStockItems(user: any) {
    const { data: items, error } = await this.supabase
      .from('items')
      .select('id, name, low_stock_threshold')
      .eq('tenant_id', user.tenant_id)
      .eq('track_inventory', true);

    if (error) throw new BadRequestException(error.message);

    const results: any[] = [];

    for (const item of items as any[]) {
      const { data: options } = await this.supabase
        .from('item_variant_options')
        .select('id, name, stock_quantity')
        .eq('item_id', item.id)
        .lt('stock_quantity', item.low_stock_threshold || 5);

      if (options && options.length > 0) {
        results.push({ ...item, low_options: options });
      }
    }

    return results;
  }
}