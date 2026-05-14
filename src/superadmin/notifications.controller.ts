// C:\wc\sefay-api\src\superadmin\notifications.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/superadmin.guard';
import { NotificationsService } from './notifications.service';

@Controller('superadmin/notifications')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getAll(@Query('page') page: string, @Query('limit') limit: string) {
    return this.notificationsService.getAll(
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
  }

  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.notificationsService.create({
      ...body,
      created_by: req.user?.id,
    });
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.notificationsService.delete(id);
  }

  @Post('send-scheduled')
  sendScheduled() {
    return this.notificationsService.sendScheduled();
  }
}