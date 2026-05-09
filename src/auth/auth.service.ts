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

  async register(body: { name: string; email: string; password: string; phone?: string }) {
    const { data: existing } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', body.email)
      .single();

    if (existing) {
      throw new UnauthorizedException('البريد الإلكتروني مستخدم مسبقاً');
    }

    const { data: tenant, error: tenantError } = await this.supabase
      .from('tenants')
      .insert({ name: body.name, plan: 'trial' })
      .select()
      .single();

    if (tenantError || !tenant) {
      throw new UnauthorizedException(tenantError?.message || 'فشل إنشاء الحساب');
    }

    const password_hash = crypto
      .createHash('sha256')
      .update(body.password)
      .digest('hex');

    const { data: user, error: userError } = await this.supabase
      .from('users')
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        password_hash,
        role: 'owner',
        tenant_id: tenant.id,
        is_active: true,
      })
      .select()
      .single();

    if (userError || !user) {
      throw new UnauthorizedException(userError?.message || 'فشل إنشاء المستخدم');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenant_id,
      branch_id: null,
      role: user.role,
      permissions: user.permissions,
    };

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        tenant_id: user.tenant_id,
        branch_id: null,
        branch_name: null,
        tenant_name: tenant.name,
      },
    };
  }
}