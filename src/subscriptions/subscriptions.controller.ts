import {
  Controller, Get, Post, Delete,
  Body, Param, Request, UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OnboardingGuard } from '../guards/onboarding.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, OnboardingGuard)
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  // الاشتراك الحالي للـ business
  @Get('current')
  getCurrent(@Request() req: any) {
    return this.service.getCurrent(req.user.tenant_id);
  }

  // تاريخ الاشتراكات
  @Get('history')
  getHistory(@Request() req: any) {
    return this.service.getHistory(req.user.tenant_id);
  }

  // إنشاء اشتراك — superadmin فقط
  @Post(':businessId')
  create(
    @Param('businessId') businessId: string,
    @Body() dto: {
      plan: string;
      billing_cycle: 'monthly' | 'yearly';
      payment_ref?: string;
    },
    @Request() req: any,
  ) {
    if (req.user.role !== 'superadmin') {
      throw new Error('غير مصرح');
    }
    return this.service.create(businessId, dto);
  }

  // إلغاء اشتراك — superadmin فقط
  @Delete(':businessId')
  cancel(
    @Param('businessId') businessId: string,
    @Request() req: any,
  ) {
    if (req.user.role !== 'superadmin') {
      throw new Error('غير مصرح');
    }
    return this.service.cancel(businessId);
  }

  // كل الاشتراكات — superadmin فقط
  @Get('all')
  getAll(@Request() req: any) {
    if (req.user.role !== 'superadmin') {
      throw new Error('غير مصرح');
    }
    return this.service.getAll();
  }
}