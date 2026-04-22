import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('*, branches(name), tenants(name)')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const hashedInput = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    const isValid = hashedInput === user.password_hash;

    if (!isValid) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenant_id,
      branch_id: user.branch_id,
      role: user.role,
      permissions: user.permissions,
    };

    await this.supabase.from('audit_logs').insert({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'login',
      entity: 'users',
      entity_id: user.id,
      details: { email: user.email },
    });

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        tenant_id: user.tenant_id,
        branch_id: user.branch_id,
        branch_name: user.branches?.name,
        tenant_name: user.tenants?.name,
      },
    };
  }
}