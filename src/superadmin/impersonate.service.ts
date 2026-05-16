import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ImpersonateService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private jwtService: JwtService,
  ) {}

  async impersonate(tenantId: string) {
    // جيب الـ owner لهذا الـ tenant
    const { data: user, error } = await this.supabase
      .from('users')
      .select('id, email, name, role, tenant_id, branch_id, permissions')
      .eq('tenant_id', tenantId)
      .eq('role', 'owner')
      .eq('is_active', true)
      .single();

    if (error || !user) {
      throw new NotFoundException('لم يتم العثور على صاحب هذا الحساب');
    }

    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single();

    const payload = {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenant_id,
      branch_id: user.branch_id,
      role: user.role,
      permissions: user.permissions,
      impersonated: true, // علامة مهمة
    };

    return {
      token: this.jwtService.sign(payload, { expiresIn: '2h' }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
        tenant_name: tenant?.name,
      },
    };
  }
}