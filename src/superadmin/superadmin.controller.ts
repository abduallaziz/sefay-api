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

 

  // ─── PER-TENANT OVERRIDE ─────────────────────────────────────
  @Patch('tenants/:id/capabilities')
  updateCapabilities(
    @Param('id') id: string,
    @Body() dto: {
      max_users?: number;
      max_branches?: number;
      capabilities?: Record<string, boolean>;
    },
  ) { return this.service.updateCapabilities(id, dto); }

  // ─── AUTH CONTROL ─────────────────────────────────────────────
  @Get('tenants/:id/users')
  getTenantUsers(@Param('id') id: string) {
    return this.service.getTenantUsers(id);
  }

  @Post('tenants/:id/users')
  addUser(
    @Param('id') id: string,
    @Body() dto: {
      name: string;
      email: string;
      phone?: string;
      role: string;
      password: string;
    },
  ) { return this.service.addUserToTenant(id, dto); }

  @Delete('users/:userId')
  @HttpCode(200)
  removeUser(@Param('userId') userId: string) {
    return this.service.removeUser(userId);
  }

  @Patch('users/:userId/role')
  changeRole(
    @Param('userId') userId: string,
    @Body('role') role: string,
  ) { return this.service.changeUserRole(userId, role); }

  @Patch('users/:userId/reset-password')
  resetPassword(
    @Param('userId') userId: string,
    @Body('password') password: string,
  ) { return this.service.resetUserPassword(userId, password); }

  @Post('tenants/:id/revoke-sessions')
  @HttpCode(200)
  revokeSessions(@Param('id') id: string) {
    return this.service.revokeTenantSessions(id);
  }
  // ─── REPORTS ─────────────────────────────────────────────────
@Get('reports')
getReports() { return this.service.getReports(); }
}