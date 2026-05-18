import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { CreatePlanDto, UpdatePlanDto } from './dto/plans.dto';

@Injectable()
export class PlansService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async findAll() {
    const { data, error } = await this.supabase
      .from('plans')
      .select(`*, plan_features(*)`)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('plans')
      .select(`*, plan_features(*)`)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async create(dto: CreatePlanDto) {
    const { features, ...planData } = dto;
    const { data: plan, error } = await this.supabase
      .from('plans')
      .insert({ ...planData, created_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    if (features?.length) {
      const { error: featError } = await this.supabase
        .from('plan_features')
        .insert(features.map(f => ({ ...f, plan_id: plan.id })));
      if (featError) throw featError;
    }
    return this.findOne(plan.id);
  }

  async update(id: string, dto: UpdatePlanDto) {
    const { features, ...planData } = dto;
    const { error } = await this.supabase
      .from('plans')
      .update({ ...planData, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    if (features?.length) {
      await this.supabase.from('plan_features').delete().eq('plan_id', id);
      await this.supabase
        .from('plan_features')
        .insert(features.map(f => ({ ...f, plan_id: id })));
    }
    return this.findOne(id);
  }

  async remove(id: string) {
    const { error } = await this.supabase
      .from('plans')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  }
}