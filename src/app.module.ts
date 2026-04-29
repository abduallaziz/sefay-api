import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { ServicesModule } from './services/services.module';
import { ShiftsModule } from './shifts/shifts.module';
import { CustomersModule } from './customers/customers.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CouponsModule } from './coupons/coupons.module';
import { ExpensesModule } from './expenses/expenses.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    CouponsModule,
    AuthModule,
    OrdersModule,
    ServicesModule,
    ShiftsModule,
    CustomersModule,
    ExpensesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}