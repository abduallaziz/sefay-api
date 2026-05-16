import { Injectable, Inject } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

const ALL_FEATURES = [
  { key: 'appointments', label: 'المواعيد' },
  { key: 'pos', label: 'نقطة البيع' },
  { key: 'orders', label: 'الطلبات' },
  { key: 'employees', label: 'الموظفين' },
  { key: 'workers', label: 'فريق العمل' },
  { key: 'expenses', label: 'المصاريف' },
  { key: 'coupons', label: 'الكوبونات' },
  { key: 'reports', label: 'التقارير' },
  { key: 'branches', label: 'الفروع' },
  { key: 'sync', label: 'المزامنة' },
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