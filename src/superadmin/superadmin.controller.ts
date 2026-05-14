import { Controller, Get, UseGuards } from '@nestjs/common'
import { SuperAdminGuard } from '../guards/superadmin.guard'
import { SuperAdminService } from './superadmin.service'

@UseGuards(SuperAdminGuard)
@Controller('superadmin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('overview')
  getOverview() {
    return this.superAdminService.getOverview()
  }
}