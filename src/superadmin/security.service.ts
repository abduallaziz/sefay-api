import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SecurityService {
  constructor(@Inject('SUPABASE_CLIENT') private supabase: SupabaseClient) {}

  async getApiLogs(limit = 100, method?: string, status?: number, path?: string) {
    let query = this.supabase
      .from('api_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (method) query = query.eq('method', method);
    if (status) query = query.eq('status_code', status);
    if (path)   query = query.ilike('path', `%${path}%`);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getApiStats() {
    const { data, error } = await this.supabase
      .from('api_logs')
      .select('method, status_code, duration_ms')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const total = data.length;
    const errors = data.filter(r => r.status_code >= 400).length;
    const avgDuration = total > 0
      ? Math.round(data.reduce((s, r) => s + (r.duration_ms || 0), 0) / total)
      : 0;

    return {
      total,
      errors,
      avgDuration,
      successRate: total > 0 ? Math.round(((total - errors) / total) * 100) : 100,
    };
  }

  async getBlockedIps() {
    const { data, error } = await this.supabase
      .from('blocked_ips')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async blockIp(ip: string, reason: string, blocked_by: string) {
    const { data, error } = await this.supabase
      .from('blocked_ips')
      .insert({ ip, reason, blocked_by })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async unblockIp(id: string) {
    const { error } = await this.supabase
      .from('blocked_ips')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  }

  async getWebhooks() {
    const { data, error } = await this.supabase
      .from('webhooks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async createWebhook(url: string, events: string[], tenant_id?: string) {
    const { data, error } = await this.supabase
      .from('webhooks')
      .insert({ url, events, tenant_id, is_active: true })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async toggleWebhook(id: string, is_active: boolean) {
    const { data, error } = await this.supabase
      .from('webhooks')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteWebhook(id: string) {
    const { error } = await this.supabase
      .from('webhooks')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  }

  async getTables() {
    const tables = [
      'tenants', 'users', 'subscriptions', 'payments',
      'plans', 'api_logs', 'blocked_ips', 'webhooks', 'audit_logs',
    ];
    const counts: Record<string, number> = {};
    for (const t of tables) {
      const { count } = await this.supabase
        .from(t)
        .select('*', { count: 'exact', head: true });
      counts[t] = count || 0;
    }
    return counts;
  }

  async getTableData(table: string, limit = 50, page = 1) {
    const allowed = [
      'tenants', 'users', 'subscriptions', 'payments',
      'plans', 'api_logs', 'blocked_ips', 'webhooks', 'audit_logs',
    ];
    if (!allowed.includes(table)) throw new Error('Table not allowed');

    const from = (page - 1) * limit;
    const { data, error, count } = await this.supabase
      .from(table)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;
    return { data, total: count, page, limit };
  }
}