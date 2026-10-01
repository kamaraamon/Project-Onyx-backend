import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { CryptoService } from '../common/services/crypto.service';

@Module({
  controllers: [WalletController],
  providers: [WalletService, CryptoService],
  exports: [WalletService],
})
export class WalletModule {}
