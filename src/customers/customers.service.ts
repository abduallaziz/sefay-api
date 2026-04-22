import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class CustomersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async searchByPlate(plate: string, tenant_id: string) {
    const { data: vehicle } = await this.supabase
      .from('vehicles')
      .select('*, customers(*)')
      .eq('tenant_id', tenant_id)
      .eq('plate', plate.toUpperCase())
      .maybeSingle()

    if (vehicle) {
      return {
        found: true,
        vehicle: { id: vehicle.id, plate: vehicle.plate, type: vehicle.type },
        customer: vehicle.customers,
      }
    }

    return { found: false }
  }

  async createCustomerWithVehicle(tenant_id: string, plate: string, phone: string) {
    let customer_id: string

    const { data: existing } = await this.supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('phone', phone)
      .maybeSingle()

    if (existing) {
      customer_id = existing.id
    } else {
      const { data: newCustomer } = await this.supabase
        .from('customers')
        .insert({ tenant_id, name: phone, phone, loyalty_points: 0 })
        .select()
        .single()
      customer_id = newCustomer.id
    }

    const { data: newVehicle } = await this.supabase
      .from('vehicles')
      .insert({ tenant_id, customer_id, plate: plate.toUpperCase(), type: 'سيدان' })
      .select()
      .single()

    return {
      customer_id,
      vehicle_id: newVehicle.id,
    }
  }
}