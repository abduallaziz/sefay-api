import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SuperAdminController } from './superadmin.controller';
import { SuperAdminService } from './superadmin.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';
import { ImpersonateController } from './impersonate.controller';
import { ImpersonateService } from './impersonate.service';

@Module({
  imports: [JwtModule],
  controllers: [
    SuperAdminController,
    NotificationsController,
    AuditController,
    CommunicationsController,
    ImpersonateController,
  ],
  providers: [
    SuperAdminService,
    NotificationsService,
    AuditService,
    CommunicationsService,
    ImpersonateService,
  ],
  exports: [AuditService],
})
export class SuperAdminModule {}