"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const auth_service_1 = require("../auth/auth.service");
const vault_service_1 = require("./vault.service");
const crypto_service_1 = require("../common/services/crypto.service");
const wallet_service_1 = require("../wallet/wallet.service");
const common_1 = require("@nestjs/common");
describe('Auth & Vault Integration', () => {
    let authService;
    let vaultService;
    let cryptoService;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                vault_service_1.VaultService,
                crypto_service_1.CryptoService,
                wallet_service_1.WalletService,
            ],
        }).compile();
        authService = module.get(auth_service_1.AuthService);
        vaultService = module.get(vault_service_1.VaultService);
        cryptoService = module.get(crypto_service_1.CryptoService);
    });
    describe('User Onboarding & JWT Authentication', () => {
        it('should register a new Wave user and allow logging in', async () => {
            const phoneNum = `+22177${Math.floor(Math.random() * 10000000)}`;
            const password = 'mySecurePassword';
            const registered = await authService.register(phoneNum, password);
            expect(registered.phone).toBe(phoneNum);
            expect(registered.isPremium).toBe(false);
            const loginResult = await authService.login(phoneNum, password);
            expect(loginResult.accessToken).toBeDefined();
            expect(loginResult.user.phone).toBe(phoneNum);
            const payload = authService.validateToken(loginResult.accessToken);
            expect(payload.userId).toBe(registered.id);
            expect(payload.phone).toBe(phoneNum);
        });
        it('should throw BadRequestException if password is too short during registration', async () => {
            await expect(authService.register('+221770001122', '123'))
                .rejects
                .toThrow(common_1.BadRequestException);
        });
        it('should throw UnauthorizedException if logging in with incorrect password', async () => {
            const phoneNum = '+221775556677';
            await authService.register(phoneNum, 'correctPassword');
            await expect(authService.login(phoneNum, 'wrongPassword'))
                .rejects
                .toThrow(common_1.UnauthorizedException);
        });
    });
    describe('Secure Vault Operations (AES-256-GCM)', () => {
        it('should encrypt stored credentials and decrypt them correctly', async () => {
            const userId = 'user-vault-test-id';
            const serviceName = 'Netflix';
            const originalUsername = 'user@netflix.com';
            const originalPassword = 'passwordToEncrypt123';
            const entry = await vaultService.addCredentials(userId, serviceName, originalUsername, originalPassword);
            expect(entry.id).toBeDefined();
            expect(entry.serviceName).toBe(serviceName);
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
            await vaultService.addCredentials(userA, 'Spotify', 'alice@spotify.com', 'alicepwd');
            const bobVault = await vaultService.getCredentials(userB);
            expect(bobVault.length).toBe(0);
            const aliceVault = await vaultService.getCredentials(userA);
            expect(aliceVault.length).toBe(1);
        });
        it('should delete vault entries correctly', async () => {
            const userId = 'user-delete-test';
            const entry = await vaultService.addCredentials(userId, 'Canal', 'user@canal.com', 'canalpwd');
            let list = await vaultService.getCredentials(userId);
            expect(list.length).toBe(1);
            await vaultService.deleteCredentials(userId, entry.id);
            list = await vaultService.getCredentials(userId);
            expect(list.length).toBe(0);
        });
    });
});
//# sourceMappingURL=auth-vault.service.spec.js.map