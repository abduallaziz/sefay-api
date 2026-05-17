import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuditService } from './audit.service';

@Injectable()
export class BackupService {
  constructor(
    @Inject('SUPABASE_CLIENT') private supabase: SupabaseClient,
    private auditService: AuditService,
  ) {}

  async exportTenantData(tenantId: string): Promise<Record<string, any>> {
    const tables = [
      'tenants',
      'users',
      'branches',
      'items',
      'orders',
      'order_items',
      'subscriptions',
      'payments',
      'customers',
    ];

    const exportData: Record<string, any> = {
      exported_at: new Date().toISOString(),
      tenant_id: tenantId,
      tables: {},
    };

    for (const table of tables) {
      if (table === 'tenants') {
        const { data } = await this.supabase
          .from(table)
          .select('*')
          .eq('id', tenantId);
        exportData.tables[table] = data || [];
      } else {
        const { data } = await this.supabase
          .from(table)
          .select('*')
          .eq('tenant_id', tenantId);
        exportData.tables[table] = data || [];
      }
    }

    await this.auditService.log({
      action: 'EXPORT_TENANT_DATA',
      entity: 'tenant',
      entity_id: tenantId,
      details: { tables_exported: tables },
    });

    return exportData;
  }

  async getSystemStats(): Promise<Record<string, any>> {
    const [
      { count: totalTenants },
      { count: activeTenants },
      { count: totalUsers },
      { count: totalOrders },
    ] = await Promise.all([
      this.supabase.from('tenants').select('*', { count: 'exact', head: true }),
      this.supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('is_active', true),
      this.supabase.from('users').select('*', { count: 'exact', head: true }),
      this.supabase.from('orders').select('*', { count: 'exact', head: true }),
    ]);

    return {
      total_tenants: totalTenants || 0,
      active_tenants: activeTenants || 0,
      total_users: totalUsers || 0,
      total_orders: totalOrders || 0,
      generated_at: new Date().toISOString(),
    };
  }
}