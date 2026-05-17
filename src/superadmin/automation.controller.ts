import { Controller, Post, UseGuards } from '@nestjs/common'
import { AutomationService } from './automation.service'
import { SuperAdminGuard } from '../guards/superadmin.guard'

@Controller('superadmin/automation')
@UseGuards(SuperAdminGuard)
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post('run-expired-check')
  runExpiredCheck() {
    return this.automationService.runExpiredCheck()
  }

  @Post('run-expiring-check')
  runExpiringCheck() {
    return this.automationService.runExpiringCheck()
  }
}