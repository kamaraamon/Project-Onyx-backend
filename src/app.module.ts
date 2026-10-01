import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { VaultModule } from './vault/vault.module';
import { ExchangeModule } from './exchange/exchange.module';
import { ConciergeModule } from './concierge/concierge.module';
import { PrismaModule as PrismaModuleGlobal } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { PaymentModule } from './payment/payment.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    PrismaModuleGlobal,
    AuthModule,
    WalletModule,
    VaultModule,
    ExchangeModule,
    ConciergeModule,
    PaymentModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
