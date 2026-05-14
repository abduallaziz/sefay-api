import {
  Controller, Get, Post, Patch, Delete,
  Param, Query, Body, UseGuards, HttpCode,
} from '@nestjs/common';
import { SuperAdminService } from './superadmin.service';
import { SuperAdminGuard } from '../guards/superadmin.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('superadmin')
export class SuperAdminController {
  constructor(private readonly service: SuperAdminService) {}

  // ─── OVERVIEW ───────────────────────────────────────────────
  @Get('overview')
  getOverview() { return this.service.getOverview(); }

  // ─── TENANTS ─────────────────────────────────────────────────
  @Get('tenants')
  getTenants(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('plan')   plan?: string,
  ) { return this.service.getTenants(search, status, plan); }

  @Get('tenants/:id')
  getTenant(@Param('id') id: string) { return this.service.getTenantById(id); }

  @Patch('tenants/:id')
  updateTenant(@Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.service.updateTenant(id, dto);
  }

  @Patch('tenants/:id/status')
  toggleStatus(
    @Param('id') id: string,
    @Body('status') status: 'active' | 'inactive' | 'suspended',
  ) { return this.service.toggleTenantStatus(id, status); }

  @Delete('tenants/:id')
  @HttpCode(200)
  deleteTenant(@Param('id') id: string) { return this.service.softDeleteTenant(id); }

  @Patch('tenants/:id/extend-trial')
  extendTrial(@Param('id') id: string, @Body('days') days: number) {
    return this.service.extendTrial(id, days);
  }

  // ─── SUBSCRIPTIONS ───────────────────────────────────────────
  @Get('subscriptions')
  getSubscriptions(
    @Query('tenant_id') tenantId?: string,
    @Query('status')    status?: string,
  ) { return this.service.getSubscriptions(tenantId, status); }

  @Post('subscriptions')
  createSubscription(@Body() dto: any) {
    return this.service.createSubscription(dto);
  }

  @Patch('subscriptions/:id/cancel')
  @HttpCode(200)
  cancelSubscription(@Param('id') id: string) {
    return this.service.cancelSubscription(id);
  }

  @Patch('subscriptions/:id/expiry')
  updateExpiry(
    @Param('id') id: string,
    @Body('expires_at') expiresAt: string,
  ) { return this.service.updateSubscriptionExpiry(id, expiresAt); }

  @Post('subscriptions/payment')
  addPayment(@Body() dto: any) {
    return this.service.addManualPayment(dto);
  }

  // ─── PLANS ───────────────────────────────────────────────────
  @Get('plans')
  getPlans() { return this.service.getPlans(); }

  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: any) {
    return this.service.updatePlan(id, dto);
  }
}