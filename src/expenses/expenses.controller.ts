import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
@UseGuards(AuthGuard('jwt'))
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get()
  async getAll(@Request() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.expensesService.getAll(req.user, from, to)
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    return this.expensesService.create(req.user, body)
  }

  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.expensesService.update(req.user, id, body)
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.expensesService.delete(req.user, id)
  }
}