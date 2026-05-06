import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { BusinessService } from './business.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Capability } from '../common/enums';


@UseGuards(JwtAuthGuard)
@Controller('business')
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  @Get('config')
  getConfig(@Body('businessId') businessId: string) {
    return this.businessService.getConfig(businessId);
  }

  @Get('trial')
getTrial(@Request() req) {
  return this.businessService.getTrial(req.user.tenant_id);
}
  @Put('config')
  updateConfig(
    @Body('businessId') businessId: string,
    @Body('capabilities') capabilities: Capability[],
  ) {
    return this.businessService.updateConfig(businessId, capabilities);
  }
}