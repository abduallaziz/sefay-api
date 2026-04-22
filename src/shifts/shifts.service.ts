import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ShiftsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async openShift(user: any, opening_cash: number) {
    const { data: existing } = await this.supabase
      .from('shifts')
      .select('id')
      .eq('tenant_id', user.tenant_id)
      .eq('branch_id', user.branch_id)
      .is('closed_at', null)
      .single();

    if (existing) {
      throw new BadRequestException('يوجد وردية مفتوحة بالفعل');
    }

    const { data, error } = await this.supabase
      .from('shifts')
      .insert({
        tenant_id: user.tenant_id,
        branch_id: user.branch_id,
        user_id: user.id,
        opening_cash,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.supabase.from('audit_logs').insert({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'open_shift',
      entity: 'shifts',
      entity_id: data.id,
      details: { opening_cash },
    });

    return data;
  }

  async closeShift(user: any, closing_cash: number) {
    const { data: shift } = await this.supabase
      .from('shifts')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .eq('branch_id', user.branch_id)
      .is('closed_at', null)
      .single();

    if (!shift) {
      throw new BadRequestException('لا توجد وردية مفتوحة');
    }

    const { data: orders } = await this.supabase
      .from('orders')
      .select('total, payment_method')
      .eq('tenant_id', user.tenant_id)
      .eq('branch_id', user.branch_id)
      .eq('status', 'completed')
      .gte('created_at', shift.opened_at);

    const total_sales = orders?.reduce((s, o) => s + Number(o.total), 0) || 0;
    const total_cash = orders?.filter(o => o.payment_method === 'cash').reduce((s, o) => s + Number(o.total), 0) || 0;
    const total_card = orders?.filter(o => o.payment_method === 'card').reduce((s, o) => s + Number(o.total), 0) || 0;
    const expected_cash = Number(shift.opening_cash) + total_cash;
    const difference = closing_cash - expected_cash;

    const { data, error } = await this.supabase
      .from('shifts')
      .update({ closing_cash, closed_at: new Date().toISOString() })
      .eq('id', shift.id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.supabase.from('audit_logs').insert({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'close_shift',
      entity: 'shifts',
      entity_id: shift.id,
      details: { closing_cash, total_sales, difference },
    });

    return {
      shift: data,
      summary: {
        opening_cash: shift.opening_cash,
        closing_cash,
        total_orders: orders?.length || 0,
        total_sales,
        total_cash,
        total_card,
        expected_cash,
        difference,
      },
    };
  }

  async getCurrentShift(user: any) {
    const { data, error } = await this.supabase
      .from('shifts')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .eq('branch_id', user.branch_id)
      .is('closed_at', null)
      .single();

    if (error) return null;
    return data;
  }
}