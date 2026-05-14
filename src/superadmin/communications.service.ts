import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';

@Injectable()
export class CommunicationsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getTemplates(page: number, limit: number, type?: string) {
    let query = this.supabase
      .from('message_templates')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (type) query = query.eq('type', type);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, total: count, page, limit };
  }

  async getTemplate(id: string) {
    const { data, error } = await this.supabase
      .from('message_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createTemplate(body: {
    name: string;
    type: string;
    subject?: string;
    body: string;
    variables?: string[];
  }) {
    const { data, error } = await this.supabase
      .from('message_templates')
      .insert({
        name: body.name,
        type: body.type,
        subject: body.subject || null,
        body: body.body,
        variables: body.variables || [],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTemplate(id: string, body: {
    name?: string;
    type?: string;
    subject?: string;
    body?: string;
    variables?: string[];
    is_active?: boolean;
  }) {
    const { data, error } = await this.supabase
      .from('message_templates')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTemplate(id: string) {
    const { error } = await this.supabase
      .from('message_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }
}