import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SUPABASE_CLIENT,
      inject: [ConfigService],
      useFactory: () =>
        createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_KEY!,
        ),
    },
  ],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}