import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SecurityService } from './security.service';
import { SuperAdminGuard } from '../guards/superadmin.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('superadmin/security')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('api-logs')
  getApiLogs(
    @Query('limit') limit?: string,
    @Query('method') method?: string,
    @Query('status') status?: string,
    @Query('path') path?: string,
  ) {
    return this.securityService.getApiLogs(
      limit ? parseInt(limit) : 100,
      method,
      status ? parseInt(status) : undefined,
      path,
    );
  }

  @Get('api-stats')
  getApiStats() {
    return this.securityService.getApiStats();
  }

  @Get('blocked-ips')
  getBlockedIps() {
    return this.securityService.getBlockedIps();
  }

  @Post('blocked-ips')
  blockIp(@Body() body: { ip: string; reason: string }, @Request() req: any) {
    return this.securityService.blockIp(body.ip, body.reason, req.user.email);
  }

  @Delete('blocked-ips/:id')
  unblockIp(@Param('id') id: string) {
    return this.securityService.unblockIp(id);
  }

  @Get('webhooks')
  getWebhooks() {
    return this.securityService.getWebhooks();
  }

  @Post('webhooks')
  createWebhook(@Body() body: { url: string; events: string[]; tenant_id?: string }) {
    return this.securityService.createWebhook(body.url, body.events, body.tenant_id);
  }

  @Patch('webhooks/:id')
  toggleWebhook(@Param('id') id: string, @Body() body: { is_active: boolean }) {
    return this.securityService.toggleWebhook(id, body.is_active);
  }

  @Delete('webhooks/:id')
  deleteWebhook(@Param('id') id: string) {
    return this.securityService.deleteWebhook(id);
  }

  @Get('db/tables')
  getTables() {
    return this.securityService.getTables();
  }

  @Get('db/tables/:table')
  getTableData(
    @Param('table') table: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.securityService.getTableData(
      table,
      limit ? parseInt(limit) : 50,
      page ? parseInt(page) : 1,
    );
  }
}