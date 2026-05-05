import { Controller, Get, Post, Put, Delete, Body, Param, Request } from '@nestjs/common';
import { ItemsService } from './items.service';

@Controller('items')
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @Get()
  async getItems(@Request() req: any) {
    return this.itemsService.getItems(req.user);
  }

  @Get('all')
  async getAllItems(@Request() req: any) {
    return this.itemsService.getAllItems(req.user);
  }

  @Post()
  async createItem(@Request() req: any, @Body() body: any) {
    return this.itemsService.createItem(req.user, body);
  }

  @Put(':id')
  async updateItem(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.itemsService.updateItem(req.user, id, body);
  }

  @Delete(':id')
  async deleteItem(@Request() req: any, @Param('id') id: string) {
    return this.itemsService.deleteItem(req.user, id);
  }

  @Delete(':id/hard')
  async hardDeleteItem(@Request() req: any, @Param('id') id: string) {
    return this.itemsService.hardDeleteItem(req.user, id);
  }
}