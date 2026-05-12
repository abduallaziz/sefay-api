import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OnboardingGuard } from '../guards/onboarding.guard';

@UseGuards(JwtAuthGuard, OnboardingGuard)
@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  getAll(@Request() req: any) {
    return this.workersService.getAll(req.user.tenant_id);
  }
} 