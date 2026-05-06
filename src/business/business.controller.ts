import { Controller, Get, Put, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { BusinessService } from './business.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Capability } from '../common/enums';

@UseGuards(JwtAuthGuard)
@Controller('business')
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  @Get('config')
  getConfig(@Request() req) {
    return this.businessService.getConfig(req.user.tenant_id);
  }

  @Get('trial')
  getTrial(@Request() req) {
    return this.businessService.getTrial(req.user.tenant_id);
  }

  @Get('plans')
  getPlans() {
    return this.businessService.getPlans();
  }

  @Get('current-plan')
  getCurrentPlan(@Request() req) {
    return this.businessService.getCurrentPlan(req.user.tenant_id);
  }

  @Put('upgrade')
  upgradePlan(@Request() req, @Body('planId') planId: string) {
    if (req.user.role !== 'superadmin') {
      throw new ForbiddenException('فقط السوبر أدمن يقدر يغير الخطة');
    }
    return this.businessService.upgradePlan(req.user.tenant_id, planId);
  }

  @Put('config')
  updateConfig(
    @Request() req,
    @Body('capabilities') capabilities: Capability[],
  ) {
    return this.businessService.updateConfig(req.user.tenant_id, capabilities);
  }
}