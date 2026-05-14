import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { SupabaseModule } from './supabase/supabase.module'
import { AuthModule } from './auth/auth.module'
import { OrdersModule } from './orders/orders.module'
import { ItemsModule } from './items/items.module'
import { ShiftsModule } from './shifts/shifts.module'
import { CustomersModule } from './customers/customers.module'
import { CouponsModule } from './coupons/coupons.module'
import { ExpensesModule } from './expenses/expenses.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { OnboardingGuard } from './guards/onboarding.guard'
import { BusinessModule } from './business/business.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { WorkersModule } from './workers/workers.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { SuperAdminModule } from './superadmin/superadmin.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    OrdersModule,
    ItemsModule,
    AppointmentsModule,
    ShiftsModule,
    CustomersModule,
    CouponsModule,
    SubscriptionsModule,
    ExpensesModule,
    BusinessModule,
    WorkersModule,
    SuperAdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // الترتيب مهم: JWT أولاً → Onboarding ثانياً
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: OnboardingGuard },
  ],
})
export class AppModule {}