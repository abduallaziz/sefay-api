import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuditService } from './audit.service';

@Injectable()
export class SupportService {
  constructor(
    @Inject('SUPABASE_CLIENT') private supabase: SupabaseClient,
    private auditService: AuditService,
  ) {}

  async getTickets(status?: string) {
    let query = this.supabase
      .from('support_tickets')
      .select(`*, tenants(name, business_type)`)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async createTicket(dto: {
    tenant_id: string;
    subject: string;
    message: string;
    priority: string;
  }) {
    const { data, error } = await this.supabase
      .from('support_tickets')
      .insert({
        ...dto,
        status: 'open',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTicket(ticketId: string, dto: { status?: string; reply?: string }) {
    const updateData: any = { updated_at: new Date().toISOString() };
    if (dto.status) updateData.status = dto.status;
    if (dto.reply) updateData.admin_reply = dto.reply;

    const { data, error } = await this.supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;

    await this.auditService.log({
      action: 'UPDATE_SUPPORT_TICKET',
      entity: 'support_ticket',
      entity_id: ticketId,
      details: dto,
    });

    return data;
  }

  async getSystemSettings() {
    const { data, error } = await this.supabase
      .from('system_settings')
      .select('*');

    if (error) throw error;
    return data;
  }

  async updateSystemSetting(key: string, value: any) {
    const { data, error } = await this.supabase
      .from('system_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;

    await this.auditService.log({
      action: 'UPDATE_SYSTEM_SETTING',
      entity: 'system_setting',
      entity_id: key,
      details: { key, value },
    });

    return data;
  }
}