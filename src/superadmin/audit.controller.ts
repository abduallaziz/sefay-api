// C:\wc\sefay-api\src\superadmin\audit.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/superadmin.guard';
import { AuditService } from './audit.service';

@Controller('superadmin/audit')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  getLogs(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('tenant_id') tenant_id: string,
    @Query('action') action: string,
    @Query('from_date') from_date: string,
    @Query('to_date') to_date: string,
  ) {
    return this.auditService.getLogs({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 30,
      tenant_id,
      action,
      from_date,
      to_date,
    });
  }
}