import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/superadmin.guard';

@Controller('superadmin/feature-flags')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get(':tenantId')
  getByTenant(@Param('tenantId') tenantId: string) {
    return this.featureFlagsService.getByTenant(tenantId);
  }

  @Patch(':tenantId')
  toggle(
    @Param('tenantId') tenantId: string,
    @Body() body: { feature: string; enabled: boolean; note?: string },
  ) {
    return this.featureFlagsService.toggle(tenantId, body.feature, body.enabled, body.note);
  }
}