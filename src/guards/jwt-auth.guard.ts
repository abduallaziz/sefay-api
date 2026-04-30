import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Reflector } from '@nestjs/core'
import { SKIP_ONBOARDING_CHECK } from './onboarding.guard'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super()
  }

  canActivate(context: ExecutionContext) {
    // تحقق من whitelist
    const request = context.switchToHttp().getRequest()
    const path    = request.path as string

    if (path.startsWith('/auth/')) return true

    // تحقق من decorator
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_ONBOARDING_CHECK, [
      context.getHandler(),
      context.getClass(),
    ])
    if (skip) return true

    return super.canActivate(context)
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or missing token')
    }
    return user
  }
}