import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class CustomersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  // بحث ديناميكي — جوال أو لوحة أو اسم
  async search(query: string, tenant_id: string) {
    const q = query.trim()

    // بحث في customers مباشرة
    const { data: customers } = await this.supabase
      .from('customers')
      .select('*, vehicles(*)')
      .eq('tenant_id', tenant_id)
      .or(`phone.ilike.%${q}%,name.ilike.%${q}%`)
      .limit(5)

    // بحث في vehicles بالرقم
    const { data: vehicles } = await this.supabase
      .from('vehicles')
      .select('*, customers(*)')
      .eq('tenant_id', tenant_id)
      .ilike('plate', `%${q}%`)
      .limit(5)

    // دمج النتائج بدون تكرار
    const map = new Map()

    for (const c of customers || []) {
      map.set(c.id, {
        customer_id: c.id,
        name:        c.name,
        phone:       c.phone,
        loyalty_points: c.loyalty_points,
        plates: (c.vehicles || []).map((v: any) => v.plate),
      })
    }

    for (const v of vehicles || []) {
      const c = v.customers as any
      if (!map.has(c.id)) {
        map.set(c.id, {
          customer_id: c.id,
          name:        c.name,
          phone:       c.phone,
          loyalty_points: c.loyalty_points,
          plates: [v.plate],
        })
      }
    }

    return Array.from(map.values())
  }

  async createOrFind(tenant_id: string, data: {
    phone?: string
    name?:  string
    plate?: string
  }) {
    let customer_id: string
    let vehicle_id:  string | null = null

    // ابحث عن عميل موجود
    if (data.phone) {
      const { data: existing } = await this.supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('phone', data.phone)
        .maybeSingle()

      if (existing) {
        customer_id = existing.id
      }
    }

    // أنشئ عميل جديد لو ما وجد
    if (!customer_id) {
      const { data: newCustomer } = await this.supabase
        .from('customers')
        .insert({
          tenant_id,
          name:           data.name || data.phone || 'زائر',
          phone:          data.phone || null,
          loyalty_points: 0,
        })
        .select()
        .single()
      customer_id = newCustomer.id
    }

    // لو في لوحة — أنشئ vehicle
    if (data.plate) {
      const { data: existingVeh } = await this.supabase
        .from('vehicles')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('plate', data.plate.toUpperCase())
        .maybeSingle()

      if (existingVeh) {
        vehicle_id = existingVeh.id
      } else {
        const { data: newVeh } = await this.supabase
          .from('vehicles')
          .insert({
            tenant_id,
            customer_id,
            plate: data.plate.toUpperCase(),
            type:  'سيدان',
          })
          .select()
          .single()
        vehicle_id = newVeh.id
      }
    }

    return { customer_id, vehicle_id }
  }

  async getAll(tenant_id: string) {
    const { data } = await this.supabase
      .from('customers')
      .select('*, vehicles(*)')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })

    return data || []
  }
}