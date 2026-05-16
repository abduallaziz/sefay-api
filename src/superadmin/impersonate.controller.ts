import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ImpersonateService } from './impersonate.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/superadmin.guard';

@Controller('superadmin/impersonate')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class ImpersonateController {
  constructor(private readonly impersonateService: ImpersonateService) {}

  @Post(':tenantId')
  impersonate(@Param('tenantId') tenantId: string) {
    return this.impersonateService.impersonate(tenantId);
  }
}