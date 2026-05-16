import { Injectable, Inject } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

const ALL_FEATURES = [
  { key: 'pos',           label: 'نقطة البيع',     group: 'صفحات' },
  { key: 'appointments',  label: 'المواعيد',        group: 'صفحات' },
  { key: 'orders',        label: 'الطلبات',         group: 'صفحات' },
  { key: 'items',         label: 'المنتجات',        group: 'صفحات' },
  { key: 'categories',    label: 'الفئات',          group: 'صفحات' },
  { key: 'customers',     label: 'العملاء',         group: 'صفحات' },
  { key: 'reports',       label: 'التقارير',        group: 'صفحات' },
  { key: 'branches',      label: 'الفروع',          group: 'صفحات' },
  { key: 'employees',     label: 'الموظفين',        group: 'صفحات' },
  { key: 'workers',       label: 'فريق العمل',      group: 'صفحات' },
  { key: 'expenses',      label: 'المصاريف',        group: 'صفحات' },
  { key: 'coupons',       label: 'الكوبونات',       group: 'صفحات' },
  { key: 'sync',          label: 'المزامنة',        group: 'صفحات' },
  { key: 'subscriptions', label: 'الاشتراكات',      group: 'صفحات' },
  { key: 'settings',      label: 'الإعدادات',       group: 'صفحات' },
  { key: 'INVENTORY',     label: 'المخزون',         group: 'capabilities' },
  { key: 'APPOINTMENTS',  label: 'المواعيد (cap)',   group: 'capabilities' },
  { key: 'VARIANTS',      label: 'أحجام/ألوان',     group: 'capabilities' },
  { key: 'SUBSCRIPTIONS', label: 'اشتراكات (cap)',  group: 'capabilities' },
];

@Injectable()
export class FeatureFlagsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async getByTenant(tenantId: string) {
    // جيب الـ tenant وخطته
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('plan')
      .eq('id', tenantId)
      .single();

    // جيب ميزات الخطة
    let planFeatures: string[] = [];
    if (tenant?.plan) {
      const { data: plan } = await this.supabase
        .from('plans')
        .select('features')
        .eq('id', tenant.plan)
        .single();

      if (plan?.features) {
        planFeatures = plan.features.includes('all')
          ? ALL_FEATURES.map((f) => f.key)
          : plan.features;
      }
    }

    // جيب الـ overrides من feature_flags
    const { data: flags } = await this.supabase
      .from('feature_flags')
      .select('*')
      .eq('tenant_id', tenantId);

    const flagsMap = new Map((flags || []).map((f: any) => [f.feature, f]));

    return ALL_FEATURES.map((feature) => {
      const fromPlan = planFeatures.includes(feature.key);
      const override = flagsMap.get(feature.key);
      const enabled  = fromPlan || (override?.enabled ?? false);

      return {
        feature:  feature.key,
        label:    feature.label,
        group:    feature.group,
        enabled,
        fromPlan, // من الخطة = read-only
        override: override?.enabled ?? null,
        note:     override?.note ?? null,
      };
    });
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