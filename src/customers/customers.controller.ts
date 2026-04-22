import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomersService } from './customers.service';

@Controller('customers')
@UseGuards(AuthGuard('jwt'))
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get('search')
  async search(@Query('plate') plate: string, @Query('tenant_id') tenant_id: string) {
    return this.customersService.searchByPlate(plate, tenant_id);
  }

  @Post('create')
  async create(@Request() req: any, @Body() body: { plate: string; phone: string }) {
    return this.customersService.createCustomerWithVehicle(
      req.user.tenant_id,
      body.plate,
      body.phone,
    );
  }
}