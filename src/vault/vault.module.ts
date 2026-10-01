import { Module } from '@nestjs/common';
import { VaultController } from './vault.controller';
import { VaultService } from './vault.service';
import { AuthModule } from '../auth/auth.module';
import { CryptoService } from '../common/services/crypto.service';

@Module({
  imports: [AuthModule],
  controllers: [VaultController],
  providers: [VaultService, CryptoService],
  exports: [VaultService],
})
export class VaultModule {}
