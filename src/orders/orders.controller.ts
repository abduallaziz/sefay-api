import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  async createOrder(@Request() req: any, @Body() body: any) {
    return this.ordersService.createOrder(req.user, body);
  }

  @Get()
  async getOrders(@Request() req: any, @Query('date') date?: string) {
    return this.ordersService.getOrders(req.user, date);
  }

  @Get('summary')
  async getDailySummary(@Request() req: any, @Query('date') date: string) {
    const today = date || new Date().toISOString().split('T')[0];
    return this.ordersService.getDailySummary(req.user, today);
  }
}