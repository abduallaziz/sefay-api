import { Module } from '@nestjs/common';
import { SuperAdminController } from './superadmin.controller';
import { SuperAdminService } from './superadmin.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';

@Module({
  controllers: [
    SuperAdminController,
    NotificationsController,
    AuditController,
    CommunicationsController,
  ],
  providers: [
    SuperAdminService,
    NotificationsService,
    AuditService,
    CommunicationsService,
  ],
  exports: [AuditService],
})
export class SuperAdminModule {}