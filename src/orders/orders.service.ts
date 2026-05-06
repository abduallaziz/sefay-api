import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

const FULL_ACCESS_ROLES = ['superadmin', 'owner', 'manager']

function canSeeAll(user: any): boolean {
  return FULL_ACCESS_ROLES.includes(user.role)
}

function groupByDay(orders: any[]) {
  const map: Record<string, number> = {}
  orders.forEach(o => {
    const day = new Date(o.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' })
    map[day] = (map[day] || 0) + Number(o.total)
  })
  return Object.entries(map).map(([date, total]) => ({ date, total }))
}

@Injectable()
export class OrdersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async createOrder(user: any, body: {
    customer_id?: string;
    payment_method: string;
    cash_amount?: number;
    card_amount?: number;
    discount?: number;
    coupon_code?: string;
    notes?: string;
    items: { item_id: string; item_name: string; price: number; qty: number }[];

  }) {
    if (!body.items || body.items.length === 0) {
      throw new BadRequestException('لا توجد خدمات في الطلب');
    }

    const subtotal = body.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = body.discount || 0;
    const taxRate  = (body as any).tax_rate ?? 15;
    const tax      = (subtotal - discount) * (taxRate / 100);
    const total    = subtotal - discount + tax;

    let cashAmount = 0;
    let cardAmount = 0;

    if (body.payment_method === 'mixed') {
      cashAmount = body.cash_amount ?? 0;
      cardAmount = body.card_amount ?? 0;
      if (Math.abs(cashAmount + cardAmount - total) > 0.01) {
        throw new BadRequestException('cash_amount + card_amount يجب أن يساوي الإجمالي');
      }
    } else if (body.payment_method === 'cash') {
      cashAmount = total;
    } else {
      cardAmount = total;
    }

    const { data: order, error } = await this.supabase
      .from('orders')
      .insert({
        tenant_id:       user.tenant_id,
        branch_id:       user.branch_id,
        cashier_id:      user.id,
        customer_id:     body.customer_id || null,
        payment_method:  body.payment_method,
        discount,
        coupon_code:     body.coupon_code || null,
        notes:           body.notes       || null,
        subtotal,
        tax,
        total,
        cash_amount:     cashAmount,
        card_amount:     cardAmount,
        refunded_amount: 0,
        status:          'completed',
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    const items = body.items.map(item => ({
      order_id:  order.id,
      item_id:   item.item_id,
      item_name: item.item_name,
      price:     item.price,
      qty:       item.qty,
    }));

    await this.supabase.from('order_items').insert(items);

    await this.supabase.from('audit_logs').insert({
      tenant_id: user.tenant_id,
      user_id:   user.id,
      action:    'create_order',
      entity:    'orders',
      entity_id: order.id,
      details:   { total, items_count: items.length },
    });

    return { ...order, items };
  }

  async refundOrder(user: any, orderId: string, body: {
    mode: 'full' | 'partial';
    refund_amount?: number;
    items?: { service_name: string; price: number; qty: number }[];
  }) {
    const { data: order, error: fetchErr } = await this.supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (fetchErr || !order) throw new BadRequestException('الطلب غير موجود');

    if (!['completed', 'partially_refunded'].includes(order.status)) {
      throw new BadRequestException('لا يمكن استرجاع هذا الطلب');
    }

    const alreadyRefunded = Number(order.refunded_amount) || 0;
    const maxRefundable   = Number(order.total) - alreadyRefunded;

    let refundAmount: number;

    if (body.mode === 'full') {
      refundAmount = maxRefundable;
    } else {
      refundAmount = body.refund_amount ?? 0;
      if (refundAmount <= 0 || refundAmount > maxRefundable) {
        throw new BadRequestException(`المبلغ يجب أن يكون بين 0.01 و ${maxRefundable.toFixed(2)}`);
      }
    }

    const newRefunded  = alreadyRefunded + refundAmount;
    const isFullRefund = newRefunded >= Number(order.total) - 0.01;

    // تحديث الطلب
    const { error: updateErr } = await this.supabase
      .from('orders')
      .update({
        status:          isFullRefund ? 'refunded' : 'partially_refunded',
        refunded_amount: newRefunded,
        refunded_at:     new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateErr) throw new BadRequestException(updateErr.message);

    // حفظ تفاصيل الاسترجاع
    await this.supabase.from('order_refunds').insert({
      order_id:      orderId,
      tenant_id:     user.tenant_id,
      refund_amount: refundAmount,
      mode:          body.mode,
      items:         body.items || null,
    });

    await this.supabase.from('audit_logs').insert({
      tenant_id: user.tenant_id,
      user_id:   user.id,
      action:    'refund_order',
      entity:    'orders',
      entity_id: orderId,
      details:   { refund_amount: refundAmount, mode: body.mode, items: body.items },
    });

    return {
      success:         true,
      refunded_amount: refundAmount,
      total_refunded:  newRefunded,
      status:          isFullRefund ? 'refunded' : 'partially_refunded',
    };
  }

  async getOrders(user: any, date?: string) {
    let query = this.supabase
      .from('orders')
      .select('*, order_items(*), customers(name, phone), order_refunds(*)')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false });

    if (!canSeeAll(user)) {
      query = query.eq('branch_id', user.branch_id)
    }

    if (date) {
      query = query
        .gte('created_at', `${date}T00:00:00+03:00`)
        .lte('created_at', `${date}T23:59:59+03:00`)
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getOrdersByRange(user: any, from: string, to: string) {
    let query = this.supabase
      .from('orders')
      .select('*, order_items(*), customers(name, phone), vehicles(plate, type), order_refunds(*)')
      .eq('tenant_id', user.tenant_id)
      .gte('created_at', `${from}T00:00:00+03:00`)
      .lte('created_at', `${to}T23:59:59+03:00`)
      .order('created_at', { ascending: false })

    if (!canSeeAll(user)) {
      query = query.eq('branch_id', user.branch_id)
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getSummaryByRange(user: any, from: string, to: string) {
    let query = this.supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .in('status', ['completed', 'partially_refunded'])
      .gte('created_at', `${from}T00:00:00+03:00`)
      .lte('created_at', `${to}T23:59:59+03:00`)

    if (!canSeeAll(user)) {
      query = query.eq('branch_id', user.branch_id)
    }

    const { data: orders, error } = await query;
    if (error) throw new BadRequestException(error.message);

    const netTotal = (o: any) => Number(o.total) - (Number(o.refunded_amount) || 0);

    return {
      total_orders:   orders.length,
      total_sales:    orders.reduce((s, o) => s + netTotal(o), 0),
      total_tax:      orders.reduce((s, o) => s + Number(o.tax), 0),
      total_discount: orders.reduce((s, o) => s + Number(o.discount), 0),
      cash:           orders.reduce((s, o) => s + Number(o.cash_amount || 0), 0),
      card:           orders.reduce((s, o) => s + Number(o.card_amount || 0), 0),
      orders_by_day:  groupByDay(orders),
    }
  }

  async getDailySummary(user: any, date: string) {
    let query = this.supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .in('status', ['completed', 'partially_refunded'])
      .gte('created_at', `${date}T00:00:00+03:00`)
      .lte('created_at', `${date}T23:59:59+03:00`)

    if (!canSeeAll(user)) {
      query = query.eq('branch_id', user.branch_id)
    }

    const { data: orders, error } = await query;
    if (error) throw new BadRequestException(error.message);

    const netTotal = (o: any) => Number(o.total) - (Number(o.refunded_amount) || 0);

    return {
      date,
      total_orders:   orders.length,
      total_sales:    orders.reduce((s, o) => s + netTotal(o), 0),
      total_tax:      orders.reduce((s, o) => s + Number(o.tax), 0),
      total_discount: orders.reduce((s, o) => s + Number(o.discount), 0),
      cash:           orders.reduce((s, o) => s + Number(o.cash_amount || 0), 0),
      card:           orders.reduce((s, o) => s + Number(o.card_amount || 0), 0),
    };
  }
}