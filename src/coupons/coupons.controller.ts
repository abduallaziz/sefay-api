import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CouponsService } from './coupons.service';

@Controller('coupons')
@UseGuards(AuthGuard('jwt'))
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  @Get()
  async getAll(@Request() req: any) {
    return this.couponsService.getAll(req.user.tenant_id);
  }

  @Post('validate')
  async validate(
    @Request() req: any,
    @Body() body: { code: string; subtotal: number },
  ) {
    return this.couponsService.validate(body.code, req.user.tenant_id, body.subtotal);
  }
}