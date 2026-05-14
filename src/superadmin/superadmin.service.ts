import { Injectable, Inject } from '@nestjs/common'
import { SUPABASE_CLIENT } from '../supabase/supabase.module'
import { SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class SuperAdminService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async getOverview() {
    const [tenantsResult, subscriptionsResult] = await Promise.all([
      this.supabase.from('tenants').select('id, plan, created_at, onboarded'),
      this.supabase.from('subscriptions').select('id, status, amount, created_at'),
    ])

    const tenants = tenantsResult.data ?? []
    const subscriptions = subscriptionsResult.data ?? []

    const totalTenants = tenants.length
    const activeTenants = tenants.filter(t => t.onboarded).length
    const trialTenants = tenants.filter(t => t.plan === 'trial').length

    const totalRevenue = subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (s.amount ?? 0), 0)

    // نمو آخر 6 أشهر
    const monthlyGrowth = this.calcMonthlyGrowth(tenants)

    return {
      totalTenants,
      activeTenants,
      trialTenants,
      totalRevenue,
      monthlyGrowth,
    }
  }

  private calcMonthlyGrowth(tenants: any[]) {
    const months: Record<string, number> = {}

    tenants.forEach(t => {
      const date = new Date(t.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      months[key] = (months[key] ?? 0) + 1
    })

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => ({ month, count }))
  }
}