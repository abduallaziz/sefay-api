import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  async createOrder(@Request() req: any, @Body() body: any) {
    return this.ordersService.createOrder(req.user, body);
  }

  @Patch(':id/refund')
  async refundOrder(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { mode: 'full' | 'partial'; refund_amount?: number },
  ) {
    return this.ordersService.refundOrder(req.user, id, body);
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

  @Get('range')
  async getOrdersByRange(
    @Request() req: any,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.ordersService.getOrdersByRange(req.user, from, to);
  }

  @Get('summary/range')
  async getSummaryByRange(
    @Request() req: any,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.ordersService.getSummaryByRange(req.user, from, to);
  }
}