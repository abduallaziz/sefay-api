import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

const FULL_ACCESS_ROLES = ['superadmin', 'owner', 'manager']

@Injectable()
export class ExpensesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async getAll(user: any, from?: string, to?: string) {
    let query = this.supabase
      .from('expenses')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('date', { ascending: false })

    if (!FULL_ACCESS_ROLES.includes(user.role) && user.branch_id) {
      query = query.eq('branch_id', user.branch_id)
    }

    if (from && to) {
      query = query.gte('date', from).lte('date', to)
    }

    const { data, error } = await query
    if (error) throw new BadRequestException(error.message)
    return data || []
  }

  async create(user: any, body: {
    title: string
    amount: number
    category?: string
    notes?: string
    date: string
    recurring_type?: string
    recurring_day?: number | null
    has_vat?: boolean
  }) {
    const { data, error } = await this.supabase
      .from('expenses')
      .insert({
        tenant_id: user.tenant_id,
        branch_id: user.branch_id || null,
        title: body.title,
        amount: body.amount,
        category: body.category || 'عام',
        notes: body.notes || null,
        date: body.date,
        recurring_type: body.recurring_type || 'none',
        recurring_day: body.recurring_day || null,
        has_vat: body.has_vat ?? false,
      })
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)
    return data
  }

  async delete(user: any, id: string) {
    const { error } = await this.supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)

    if (error) throw new BadRequestException(error.message)
    return { message: 'تم الحذف' }
  }
}