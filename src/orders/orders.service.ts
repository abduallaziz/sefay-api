import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async createOrder(user: any, body: {
    customer_id?: string;
    vehicle_id?: string;
    payment_method: string;
    discount?: number;
    coupon_code?: string;
    notes?: string;
    items: { service_id: string; service_name: string; price: number; qty: number }[];
  }) {
    if (!body.items || body.items.length === 0) {
      throw new BadRequestException('لا توجد خدمات في الطلب');
    }

    const subtotal = body.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = body.discount || 0;
    const tax = (subtotal - discount) * 0.15;
    const total = subtotal - discount + tax;

    const { data: order, error } = await this.supabase
      .from('orders')
      .insert({
        tenant_id: user.tenant_id,
        branch_id: user.branch_id,
        cashier_id: user.id,
        customer_id: body.customer_id || null,
        vehicle_id: body.vehicle_id || null,
        payment_method: body.payment_method,
        discount: discount,
        coupon_code: body.coupon_code || null,
        notes: body.notes || null,
        subtotal,
        tax,
        total,
        status: 'completed',
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    const items = body.items.map(item => ({
      order_id: order.id,
      service_id: item.service_id,
      service_name: item.service_name,
      price: item.price,
      qty: item.qty,
    }));

    await this.supabase.from('order_items').insert(items);

    await this.supabase.from('audit_logs').insert({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'create_order',
      entity: 'orders',
      entity_id: order.id,
      details: { total, items_count: items.length },
    });

    return { ...order, items };
  }

  async getOrders(user: any, date?: string) {
    let query = this.supabase
      .from('orders')
      .select('*, order_items(*), customers(name, phone)')
      .eq('tenant_id', user.tenant_id)
      .eq('branch_id', user.branch_id)
      .order('created_at', { ascending: false });

    if (date) {
      query = query.gte('created_at', `${date}T00:00:00`)
                   .lte('created_at', `${date}T23:59:59`);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getDailySummary(user: any, date: string) {
    const { data: orders, error } = await this.supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .eq('branch_id', user.branch_id)
      .eq('status', 'completed')
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`);

    if (error) throw new BadRequestException(error.message);

    const summary = {
      date,
      total_orders: orders.length,
      total_sales: orders.reduce((s, o) => s + Number(o.total), 0),
      total_tax: orders.reduce((s, o) => s + Number(o.tax), 0),
      total_discount: orders.reduce((s, o) => s + Number(o.discount), 0),
      cash: orders.filter(o => o.payment_method === 'cash').reduce((s, o) => s + Number(o.total), 0),
      card: orders.filter(o => o.payment_method === 'card').reduce((s, o) => s + Number(o.total), 0),
    };

    return summary;
  }
}