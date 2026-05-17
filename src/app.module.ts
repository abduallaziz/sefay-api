import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
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
import { BusinessModule } from './business/business.module'
import { AppointmentsModule } from './appointments/appointments.module'
import { WorkersModule } from './workers/workers.module'
import { SubscriptionsModule } from './subscriptions/subscriptions.module'
import { SuperAdminModule } from './superadmin/superadmin.module'
import { ApiLoggerMiddleware } from './middleware/api-logger.middleware'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
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
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: OnboardingGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiLoggerMiddleware).forRoutes('*');
  }
}