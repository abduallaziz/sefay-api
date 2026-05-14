import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/superadmin.guard';
import { CommunicationsService } from './communications.service';

@Controller('superadmin/communications')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Get('templates')
  getTemplates(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('type') type: string,
  ) {
    return this.communicationsService.getTemplates(
      parseInt(page) || 1,
      parseInt(limit) || 20,
      type,
    );
  }

  @Get('templates/:id')
  getTemplate(@Param('id') id: string) {
    return this.communicationsService.getTemplate(id);
  }

  @Post('templates')
  createTemplate(@Body() body: any) {
    return this.communicationsService.createTemplate(body);
  }

  @Put('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() body: any) {
    return this.communicationsService.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string) {
    return this.communicationsService.deleteTemplate(id);
  }
}