import { Injectable, Inject } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

const ALL_FEATURES = [
  { key: 'pos', label: 'نقطة البيع' },
  { key: 'appointments', label: 'المواعيد' },
  { key: 'orders', label: 'الطلبات' },
  { key: 'items', label: 'المنتجات' },
  { key: 'categories', label: 'الفئات' },
  { key: 'customers', label: 'العملاء' },
  { key: 'reports', label: 'التقارير' },
  { key: 'branches', label: 'الفروع' },
  { key: 'employees', label: 'الموظفين' },
  { key: 'workers', label: 'فريق العمل' },
  { key: 'expenses', label: 'المصاريف' },
  { key: 'coupons', label: 'الكوبونات' },
  { key: 'sync', label: 'المزامنة' },
  { key: 'upgrade', label: 'ترقية الخطة' },
  { key: 'subscriptions', label: 'الاشتراكات' },
  { key: 'settings', label: 'الإعدادات' },
];

@Injectable()
export class FeatureFlagsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async getByTenant(tenantId: string) {
    const { data } = await this.supabase
      .from('feature_flags')
      .select('*')
      .eq('tenant_id', tenantId);

    const flagsMap = new Map((data || []).map((f: any) => [f.feature, f]));

    return ALL_FEATURES.map((feature) => ({
      feature: feature.key,
      label: feature.label,
      enabled: flagsMap.get(feature.key)?.enabled ?? false,
      note: flagsMap.get(feature.key)?.note ?? null,
    }));
  }

  async toggle(tenantId: string, feature: string, enabled: boolean, note?: string) {
    const { data: existing } = await this.supabase
      .from('feature_flags')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('feature', feature)
      .single();

    if (existing) {
      const { data } = await this.supabase
        .from('feature_flags')
        .update({ enabled, note: note ?? null, updated_at: new Date().toISOString() })
        .eq('tenant_id', tenantId)
        .eq('feature', feature)
        .select()
        .single();
      return data;
    } else {
      const { data } = await this.supabase
        .from('feature_flags')
        .insert({ tenant_id: tenantId, feature, enabled, note: note ?? null })
        .select()
        .single();
      return data;
    }
  }
}