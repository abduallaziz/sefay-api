import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServicesService } from './services.service';

@Controller('services')
@UseGuards(AuthGuard('jwt'))
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  async getServices(@Request() req: any) {
    return this.servicesService.getServices(req.user);
  }

  @Post()
  async createService(@Request() req: any, @Body() body: any) {
    return this.servicesService.createService(req.user, body);
  }

  @Put(':id')
  async updateService(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.servicesService.updateService(req.user, id, body);
  }

  @Delete(':id')
  async deleteService(@Request() req: any, @Param('id') id: string) {
    return this.servicesService.deleteService(req.user, id);
  }
}