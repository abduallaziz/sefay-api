// C:\wc\sefay-api\src\superadmin\superadmin.module.ts
import { Module } from '@nestjs/common';
import { SuperAdminController } from './superadmin.controller';
import { SuperAdminService } from './superadmin.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Module({
  controllers: [
    SuperAdminController,
    NotificationsController,
    AuditController,
  ],
  providers: [
    SuperAdminService,
    NotificationsService,
    AuditService,
  ],
  exports: [AuditService], // نحتاجه في services ثانية
})
export class SuperAdminModule {}