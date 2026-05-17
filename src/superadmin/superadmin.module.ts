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
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '2h' },
    }),
  ],
  controllers: [
    SuperAdminController,
    NotificationsController,
    AuditController,
    CommunicationsController,
    ImpersonateController,
    FeatureFlagsController,
    AutomationController,
  ],
  providers: [
    SuperAdminService,
    NotificationsService,
    AuditService,
    CommunicationsService,
    ImpersonateService,
    FeatureFlagsService,
    AutomationService,
  ],
  exports: [AuditService],
})
export class SuperAdminModule {}