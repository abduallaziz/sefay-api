import {
  Controller, Get, Patch, Delete, Param, Query,
  Body, UseGuards, HttpCode,
} from '@nestjs/common';
import { SuperAdminService } from './superadmin.service';
import { SuperAdminGuard } from '../guards/superadmin.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('superadmin')
export class SuperAdminController {

  constructor(private readonly service: SuperAdminService) {}

  // GET /superadmin/overview
  @Get('overview')
  getOverview() {
    return this.service.getOverview();
  }

  // GET /superadmin/tenants?search=&status=&plan=
  @Get('tenants')
  getTenants(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('plan')   plan?: string,
  ) {
    return this.service.getTenants(search, status, plan);
  }

  // GET /superadmin/tenants/:id
  @Get('tenants/:id')
  getTenant(@Param('id') id: string) {
    return this.service.getTenantById(id);
  }

  // PATCH /superadmin/tenants/:id
  @Patch('tenants/:id')
  updateTenant(@Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.service.updateTenant(id, dto);
  }

  // PATCH /superadmin/tenants/:id/status
  @Patch('tenants/:id/status')
  toggleStatus(
    @Param('id') id: string,
    @Body('status') status: 'active' | 'inactive' | 'suspended',
  ) {
    return this.service.toggleTenantStatus(id, status);
  }

  // DELETE /superadmin/tenants/:id
  @Delete('tenants/:id')
  @HttpCode(200)
  deleteTenant(@Param('id') id: string) {
    return this.service.softDeleteTenant(id);
  }

  // PATCH /superadmin/tenants/:id/extend-trial
  @Patch('tenants/:id/extend-trial')
  extendTrial(
    @Param('id') id: string,
    @Body('days') days: number,
  ) {
    return this.service.extendTrial(id, days);
  }
}