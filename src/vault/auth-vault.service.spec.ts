import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { VaultService } from './vault.service';
import { CryptoService } from '../common/services/crypto.service';
import { WalletService } from '../wallet/wallet.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('Auth & Vault Integration', () => {
  let authService: AuthService;
  let vaultService: VaultService;
  let cryptoService: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        VaultService,
        CryptoService,
        WalletService, // WalletService requis en tant que dépendance de AuthService
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    vaultService = module.get<VaultService>(VaultService);
    cryptoService = module.get<CryptoService>(CryptoService);
  });

  describe('User Onboarding & JWT Authentication', () => {
    it('should register a new Wave user and allow logging in', async () => {
      const phoneNum = `+22177${Math.floor(Math.random() * 10000000)}`;
      const password = 'mySecurePassword';

      // 1. Enregistrement
      const registered = await authService.register(phoneNum, password);
      expect(registered.phone).toBe(phoneNum);
      expect(registered.isPremium).toBe(false);

      // 2. Connexion
      const loginResult = await authService.login(phoneNum, password);
      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.user.phone).toBe(phoneNum);

      // 3. Validation de jeton
      const payload = authService.validateToken(loginResult.accessToken);
      expect(payload.userId).toBe(registered.id);
      expect(payload.phone).toBe(phoneNum);
    });

    it('should throw BadRequestException if password is too short during registration', async () => {
      await expect(authService.register('+221770001122', '123'))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if logging in with incorrect password', async () => {
      const phoneNum = '+221775556677';
      await authService.register(phoneNum, 'correctPassword');

      await expect(authService.login(phoneNum, 'wrongPassword'))
        .rejects
        .toThrow(UnauthorizedException);
    });
  });

  describe('Secure Vault Operations (AES-256-GCM)', () => {
    it('should encrypt stored credentials and decrypt them correctly', async () => {
      const userId = 'user-vault-test-id';
      const serviceName = 'Netflix';
      const originalUsername = 'user@netflix.com';
      const originalPassword = 'passwordToEncrypt123';

      // 1. Ajout dans le coffre-fort
      const entry = await vaultService.addCredentials(
        userId,
        serviceName,
        originalUsername,
        originalPassword
      );

      expect(entry.id).toBeDefined();
      expect(entry.serviceName).toBe(serviceName);

      // 2. Récupération et vérification du déchiffrement correct
      const vaultEntries = await vaultService.getCredentials(userId);
      expect(vaultEntries.length).toBe(1);
      
      const decryptedEntry = vaultEntries[0];
      expect(decryptedEntry.serviceName).toBe(serviceName);
      expect(decryptedEntry.username).toBe(originalUsername);
      expect(decryptedEntry.password).toBe(originalPassword);
    });

    it('should keep vault credentials isolated between users', async () => {
      const userA = 'user-alice-id';
      const userB = 'user-bob-id';

      // Ajout pour Alice
      await vaultService.addCredentials(userA, 'Spotify', 'alice@spotify.com', 'alicepwd');

      // Bob ne doit pas avoir accès aux identifiants d'Alice
      const bobVault = await vaultService.getCredentials(userB);
      expect(bobVault.length).toBe(0);

      const aliceVault = await vaultService.getCredentials(userA);
      expect(aliceVault.length).toBe(1);
    });

    it('should delete vault entries correctly', async () => {
      const userId = 'user-delete-test';
      const entry = await vaultService.addCredentials(userId, 'Canal', 'user@canal.com', 'canalpwd');

      // Vérifie l'ajout
      let list = await vaultService.getCredentials(userId);
      expect(list.length).toBe(1);

      // Supprime
      await vaultService.deleteCredentials(userId, entry.id);

      // Vérifie la suppression
      list = await vaultService.getCredentials(userId);
      expect(list.length).toBe(0);
    });
  });
});
