import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomersService } from './customers.service';

@Controller('customers')
@UseGuards(AuthGuard('jwt'))
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  // بحث ديناميكي
  @Get('search')
  async search(
    @Query('q') q: string,
    @Request() req: any,
  ) {
    return this.customersService.search(q, req.user.tenant_id)
  }

  // إنشاء أو إيجاد عميل
  @Post()
  async createOrFind(
    @Request() req: any,
    @Body() body: { phone?: string; name?: string; plate?: string },
  ) {
    return this.customersService.createOrFind(req.user.tenant_id, body)
  }

  @Get()
  async getAll(@Request() req: any) {
    return this.customersService.getAll(req.user.tenant_id)
  }
}