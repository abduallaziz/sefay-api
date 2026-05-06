import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { SUPABASE_CLIENT } from '../supabase/supabase.module'
import { SupabaseClient } from '@supabase/supabase-js'

export const SKIP_ONBOARDING_CHECK = 'skipOnboardingCheck'

// Hard whitelist — لا يحتاج decorator
const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/health']

@Injectable()
export class OnboardingGuard implements CanActivate {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // 1. Hard whitelist — /auth/* routes يمرون دائماً
    const path = request.path as string
    if (PUBLIC_PATHS.some(p => path.startsWith(p)) || path.startsWith('/auth/')) {
      return true
    }

    // 2. Decorator check — secondary only
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_ONBOARDING_CHECK, [
      context.getHandler(),
      context.getClass(),
    ])
    if (skip) return true

    // 3. Auth enforcement — request.user يجب يكون موجود (JWT ran first)
    const user = request.user
    if (!user || !user.tenant_id) {
      throw new UnauthorizedException('Authentication required')
    }

    // 4. Tenant enforcement — لا نثق بـ DB بدون tenant_id explicit
    const tenantId = String(user.tenant_id).trim()
    if (!tenantId || tenantId.length < 10) {
      throw new ForbiddenException('Invalid tenant context')
    }

    // 5. Onboarding check
    const { data: tenant, error } = await this.supabase
      .from('tenants')
      .select('onboarded, id, trial_ends_at, plan')
      .eq('id', tenantId)
      .single()

    if (error || !tenant) {
      throw new ForbiddenException('Tenant not found')
    }

    // تأكيد إضافي أن الـ tenant_id يطابق
    if (tenant.id !== tenantId) {
      throw new ForbiddenException('Tenant mismatch')
    }

    if (!tenant.onboarded) {
      throw new ForbiddenException('Onboarding required')
    }

    // Trial check
    if (tenant.plan === 'trial' && tenant.trial_ends_at) {
      const trialEnd = new Date(tenant.trial_ends_at)
      if (trialEnd < new Date()) {
        throw new ForbiddenException('Trial expired')
      }
    }

    return true
}
}