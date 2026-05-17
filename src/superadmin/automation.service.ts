import { Injectable, Logger, Inject } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { SUPABASE_CLIENT } from '../supabase/supabase.module'
import { SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name)

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  @Cron('0 2 * * *')
  async handleExpiredSubscriptions() {
    this.logger.log('🔄 Checking expired subscriptions...')

    const now = new Date().toISOString()

    const { data: expired, error } = await this.supabase
      .from('subscriptions')
      .select('id, tenant_id')
      .eq('status', 'active')
      .lt('expires_at', now)

    if (error) {
      this.logger.error('Failed to fetch expired subscriptions', error)
      return
    }

    if (!expired || expired.length === 0) {
      this.logger.log('No expired subscriptions found')
      return
    }

    for (const sub of expired) {
      await this.supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('id', sub.id)

      await this.supabase
        .from('tenants')
        .update({ is_active: false })
        .eq('id', sub.tenant_id)

      await this.supabase.from('audit_log').insert({
        action: 'auto_suspend_tenant',
        target_type: 'tenant',
        target_id: sub.tenant_id,
        details: { reason: 'subscription_expired', subscription_id: sub.id },
        performed_by: 'system',
      })

      this.logger.log(`✅ Suspended tenant ${sub.tenant_id}`)
    }
  }

  @Cron('0 9 * * *')
  async handleExpiringReminders() {
    this.logger.log('🔔 Checking subscriptions expiring in 7 days...')

    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const nowIso = now.toISOString()

    const { data: expiring, error } = await this.supabase
      .from('subscriptions')
      .select('id, tenant_id, expires_at, plan')
      .eq('status', 'active')
      .gte('expires_at', nowIso)
      .lte('expires_at', in7Days)

    if (error) {
      this.logger.error('Failed to fetch expiring subscriptions', error)
      return
    }

    if (!expiring || expiring.length === 0) {
      this.logger.log('No expiring subscriptions found')
      return
    }

    for (const sub of expiring) {
      const expiresAt = new Date(sub.expires_at)
      const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      await this.supabase.from('notifications').insert({
        tenant_id: sub.tenant_id,
        type: 'subscription_expiring',
        title: 'اشتراكك على وشك الانتهاء',
        message: `اشتراك خطة ${sub.plan} ينتهي خلال ${daysLeft} أيام`,
        is_read: false,
        created_at: new Date().toISOString(),
      })

      this.logger.log(`🔔 Reminder sent for tenant ${sub.tenant_id} — ${daysLeft} days left`)
    }
  }

  async runExpiredCheck() {
    await this.handleExpiredSubscriptions()
    return { message: 'Expired check completed' }
  }

  async runExpiringCheck() {
    await this.handleExpiringReminders()
    return { message: 'Expiring check completed' }
  }
}