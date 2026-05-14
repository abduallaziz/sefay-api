import { Module } from '@nestjs/common'
import { SuperAdminController } from './superadmin.controller'
import { SuperAdminService } from './superadmin.service'
import { SupabaseModule } from '../supabase/supabase.module'

@Module({
  imports: [SupabaseModule],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
})
export class SuperAdminModule {}