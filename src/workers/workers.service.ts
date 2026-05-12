import { Injectable, Inject } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class WorkersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async getAll(tenant_id: string) {
    const { data } = await this.supabase
      .from('workers')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false });
    return data || [];
  }
} 