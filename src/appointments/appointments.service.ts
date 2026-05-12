import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  // ─── Availability ───────────────────────────────

  async setAvailability(user: any, body: {
    worker_id: string;
    slots: { day_of_week: number; start_time: string; end_time: string }[];
  }) {
    // احذف القديم وأضف الجديد
    await this.supabase
      .from('availability')
      .delete()
      .eq('tenant_id', user.tenant_id)
      .eq('worker_id', body.worker_id);

    if (body.slots.length === 0) return { success: true };

    const rows = body.slots.map(s => ({
      tenant_id:   user.tenant_id,
      worker_id:   body.worker_id,
      day_of_week: s.day_of_week,
      start_time:  s.start_time,
      end_time:    s.end_time,
    }));

    const { error } = await this.supabase.from('availability').insert(rows);
    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }

  async getAvailability(user: any, worker_id?: string) {
    let query = this.supabase
      .from('availability')
      .select('*, workers(id, name)')
      .eq('tenant_id', user.tenant_id)
      .order('day_of_week');

    if (worker_id) query = query.eq('worker_id', worker_id);

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ─── Slots ──────────────────────────────────────

  async getAvailableSlots(user: any, worker_id: string, date: string) {
    // يوم الأسبوع (0=أحد)
    const d = new Date(date);
    const dayOfWeek = d.getDay();

    // جيب دوام الموظف لهذا اليوم
    const { data: avail } = await this.supabase
      .from('availability')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .eq('worker_id', worker_id)
      .eq('day_of_week', dayOfWeek)
      .single();

    if (!avail) return { slots: [] };

    // جيب الحجوزات الموجودة لهذا اليوم
    const { data: existing } = await this.supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('tenant_id', user.tenant_id)
      .eq('worker_id', worker_id)
      .gte('start_time', `${date}T00:00:00+03:00`)
      .lte('start_time', `${date}T23:59:59+03:00`)
      .not('status', 'eq', 'cancelled');

    // ولّد slots كل 30 دقيقة
    const slots: string[] = [];
    const [startH, startM] = avail.start_time.split(':').map(Number);
    const [endH, endM]     = avail.end_time.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins   = endH * 60 + endM;
    const adjustedEnd = endMins === 0 ? 24 * 60 : endMins;

    for (let m = startMins; m + 30 <= adjustedEnd; m += 30) {
      const hh   = String(Math.floor(m / 60)).padStart(2, '0');
      const mm   = String(m % 60).padStart(2, '0');
      const slot = `${date}T${hh}:${mm}:00+03:00`;

      // تحقق إذا الـ slot محجوز
      const isTaken = (existing || []).some(appt => {
        const apptStart = new Date(appt.start_time).getTime();
        const slotTime  = new Date(slot).getTime();
        return Math.abs(apptStart - slotTime) < 29 * 60 * 1000;
      });

      if (!isTaken) slots.push(`${hh}:${mm}`);
    }

    return { slots, availability: avail };
  }

  // ─── Appointments CRUD ──────────────────────────

  async createAppointment(user: any, body: {
    worker_id: string;
    item_id?: string;
    customer_id?: string;
    branch_id?: string;
    date: string;       // YYYY-MM-DD
    start_time: string; // HH:mm
    notes?: string;
  }) {
    const start = new Date(`${body.date}T${body.start_time}:00+03:00`);
    const end   = new Date(start.getTime() + 30 * 60 * 1000); // +30 دقيقة

    // تحقق ما في تعارض
    const { data: conflict } = await this.supabase
      .from('appointments')
      .select('id')
      .eq('tenant_id', user.tenant_id)
      .eq('worker_id', body.worker_id)
      .not('status', 'eq', 'cancelled')
      .lt('start_time', end.toISOString())
      .gt('end_time', start.toISOString());

    if (conflict && conflict.length > 0) {
      throw new BadRequestException('الموعد محجوز مسبقاً');
    }

    const { data, error } = await this.supabase
      .from('appointments')
      .insert({
        tenant_id:   user.tenant_id,
        branch_id:   body.branch_id || user.branch_id,
        worker_id:   body.worker_id,
        item_id:     body.item_id     || null,
        customer_id: body.customer_id || null,
        start_time:  start.toISOString(),
        end_time:    end.toISOString(),
        notes:       body.notes || null,
        created_by:  user.id,
        status:      'pending',
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getAppointments(user: any, date?: string) {
    let query = this.supabase
      .from('appointments')
      .select('*, workers(id, name), customers(id, name, phone), items(id, name)')
      .eq('tenant_id', user.tenant_id)
      .order('start_time');

    if (date) {
      query = query
        .gte('start_time', `${date}T00:00:00+03:00`)
        .lte('start_time', `${date}T23:59:59+03:00`);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateAppointment(user: any, id: string, body: {
    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    notes?: string;
    start_time?: string;
    end_time?: string;
  }) {
    const { data, error } = await this.supabase
      .from('appointments')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deleteAppointment(user: any, id: string) {
    const { error } = await this.supabase
      .from('appointments')
      .delete()
      .eq('id', id)
      .eq('tenant_id', user.tenant_id);

    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }
}