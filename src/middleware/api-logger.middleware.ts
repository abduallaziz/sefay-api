import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ApiLoggerMiddleware implements NestMiddleware {
  constructor(@Inject('SUPABASE_CLIENT') private supabase: SupabaseClient) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, path, ip } = req;

    res.on('finish', async () => {
      const duration_ms = Date.now() - start;
      const status_code = res.statusCode;

      // تجاهل superadmin/security عشان ما يسجل نفسه
      if (path.includes('/superadmin/security')) return;

      try {
        await this.supabase.from('api_logs').insert({
          method,
          path,
          status_code,
          duration_ms,
          ip: req.headers['x-forwarded-for']?.toString() || ip,
        });
      } catch (e) {
        // silent fail
      }
    });

    next();
  }
}