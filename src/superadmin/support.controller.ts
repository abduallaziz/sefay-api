import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SupportService } from './support.service';
import { SuperAdminGuard } from '../guards/superadmin.guard';

@Controller('superadmin/support')
@UseGuards(SuperAdminGuard)
export class SupportController {
  constructor(private supportService: SupportService) {}

  @Get('tickets')
  getTickets(@Query('status') status?: string) {
    return this.supportService.getTickets(status);
  }

  @Post('tickets')
  createTicket(@Body() dto: {
    tenant_id: string;
    subject: string;
    message: string;
    priority: string;
  }) {
    return this.supportService.createTicket(dto);
  }

  @Patch('tickets/:id')
  updateTicket(@Param('id') id: string, @Body() dto: { status?: string; reply?: string }) {
    return this.supportService.updateTicket(id, dto);
  }

  @Get('settings')
  getSettings() {
    return this.supportService.getSystemSettings();
  }

  @Post('settings')
  updateSetting(@Body() dto: { key: string; value: any }) {
    return this.supportService.updateSystemSetting(dto.key, dto.value);
  }
}