import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { BackupService } from './backup.service';
import { SuperAdminGuard } from '../guards/superadmin.guard';

@Controller('superadmin/backup')
@UseGuards(SuperAdminGuard)
export class BackupController {
  constructor(private backupService: BackupService) {}

  @Get('export/:tenantId')
  exportTenantData(@Param('tenantId') tenantId: string) {
    return this.backupService.exportTenantData(tenantId);
  }

  @Get('system-stats')
  getSystemStats() {
    return this.backupService.getSystemStats();
  }
}