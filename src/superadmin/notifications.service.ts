// C:\wc\sefay-api\src\superadmin\notifications.service.ts
import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Inject } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  constructor(@Inject('SUPABASE_CLIENT') private supabase: SupabaseClient) {}

  async getAll(page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await this.supabase
      .from('notifications')
      .select('*, tenants(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, total: count, page, limit };
  }

  async create(dto: {
    tenant_id?: string;
    title: string;
    message: string;
    type: string;
    scheduled_at?: string;
    created_by?: string;
  }) {
    const isBroadcast = !dto.tenant_id;
    const isScheduled = !!dto.scheduled_at;

    // إذا مو مجدول، أرسله فوراً
    const sent_at = isScheduled ? null : new Date().toISOString();

    if (isBroadcast) {
      // إشعار جماعي — نجيب كل tenants ونسوي record لكل واحد
      const { data: tenants, error: tenantsError } = await this.supabase
        .from('tenants')
        .select('id')
        .eq('is_active', true);

      if (tenantsError) throw tenantsError;

      const records = tenants.map((t) => ({
        tenant_id: t.id,
        title: dto.title,
        message: dto.message,
        type: dto.type,
        scheduled_at: dto.scheduled_at ?? null,
        sent_at,
        created_by: dto.created_by ?? null,
      }));

      const { data, error } = await this.supabase
        .from('notifications')
        .insert(records)
        .select();

      if (error) throw error;
      return { sent: records.length, data };
    }

    // إشعار لـ tenant معين
    const { data, error } = await this.supabase
      .from('notifications')
      .insert({
        tenant_id: dto.tenant_id,
        title: dto.title,
        message: dto.message,
        type: dto.type,
        scheduled_at: dto.scheduled_at ?? null,
        sent_at,
        created_by: dto.created_by ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }

  // يُستدعى من cron أو scheduler لاحقاً
  async sendScheduled() {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('notifications')
      .update({ sent_at: now })
      .lte('scheduled_at', now)
      .is('sent_at', null)
      .select();

    if (error) throw error;
    return { sent: data?.length ?? 0 };
  }

  // للـ tenant dashboard — يجيب إشعاراته
  async getForTenant(tenantId: string) {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('tenant_id', tenantId)
      .not('sent_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  }

  async markRead(id: string) {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}