// C:\wc\sefay-api\src\superadmin\audit.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AuditService {
  constructor(@Inject('SUPABASE_CLIENT') private supabase: SupabaseClient) {}

  async getLogs({
    page = 1,
    limit = 30,
    tenant_id,
    action,
    from_date,
    to_date,
  }: {
    page?: number;
    limit?: number;
    tenant_id?: string;
    action?: string;
    from_date?: string;
    to_date?: string;
  }) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from('audit_logs')
      .select('*, tenants(name), users(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (tenant_id) query = query.eq('tenant_id', tenant_id);
    if (action) query = query.ilike('action', `%${action}%`);
    if (from_date) query = query.gte('created_at', from_date);
    if (to_date) query = query.lte('created_at', to_date);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, total: count, page, limit };
  }

  async log({
    tenant_id,
    user_id,
    action,
    entity,
    entity_id,
    details,
  }: {
    tenant_id?: string;
    user_id?: string;
    action: string;
    entity?: string;
    entity_id?: string;
    details?: object;
  }) {
    const { error } = await this.supabase.from('audit_logs').insert({
      tenant_id,
      user_id,
      action,
      entity,
      entity_id,
      details,
    });

    if (error) console.error('Audit log error:', error);
  }
}