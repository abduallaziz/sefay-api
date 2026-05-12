import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Request, UseGuards,
} from '@nestjs/common';
import { VariantsService } from './variants.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('items')
export class VariantsController {
  constructor(private variantsService: VariantsService) {}

  // ✅ Static routes FIRST
  @Get('low-stock/alerts')
  getLowStock(@Request() req: any) {
    return this.variantsService.getLowStockItems(req.user);
  }

  // ✅ Dynamic routes AFTER
  @Get(':itemId/variants')
  getGroups(@Request() req: any, @Param('itemId') itemId: string) {
    return this.variantsService.getVariantGroups(req.user, itemId);
  }

  @Post(':itemId/variants')
  createGroup(@Request() req: any, @Param('itemId') itemId: string, @Body() body: any) {
    return this.variantsService.createVariantGroup(req.user, itemId, body);
  }

  @Get(':itemId/inventory-logs')
  getLogs(@Request() req: any, @Param('itemId') itemId: string) {
    return this.variantsService.getInventoryLogs(req.user, itemId);
  }

  @Put('variants/groups/:groupId')
  updateGroup(@Request() req: any, @Param('groupId') groupId: string, @Body() body: any) {
    return this.variantsService.updateVariantGroup(req.user, groupId, body);
  }

  @Delete('variants/groups/:groupId')
  deleteGroup(@Request() req: any, @Param('groupId') groupId: string) {
    return this.variantsService.deleteVariantGroup(req.user, groupId);
  }

  @Post('variants/groups/:groupId/options')
  createOption(@Request() req: any, @Param('groupId') groupId: string, @Body() body: any) {
    return this.variantsService.createVariantOption(req.user, groupId, body);
  }

  @Put('variants/options/:optionId')
  updateOption(@Request() req: any, @Param('optionId') optionId: string, @Body() body: any) {
    return this.variantsService.updateVariantOption(req.user, optionId, body);
  }

  @Delete('variants/options/:optionId')
  deleteOption(@Request() req: any, @Param('optionId') optionId: string) {
    return this.variantsService.deleteVariantOption(req.user, optionId);
  }

  @Post('variants/options/:optionId/stock')
  adjustStock(@Request() req: any, @Param('optionId') optionId: string, @Body() body: any) {
    return this.variantsService.adjustStock(req.user, optionId, body);
  }
}