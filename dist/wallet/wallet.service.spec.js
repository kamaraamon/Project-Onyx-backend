"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const wallet_service_1 = require("./wallet.service");
const common_1 = require("@nestjs/common");
describe('WalletService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [wallet_service_1.WalletService],
        }).compile();
        service = module.get(wallet_service_1.WalletService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('initiateRecharge', () => {
        it('should apply a 1% fee for Freemium users', async () => {
            const result = await service.initiateRecharge('user-free-id', 10000);
            expect(result.fee).toBe(100);
            expect(result.totalCharged).toBe(10100);
            expect(result.paymentUrl).toContain('amount=10100');
        });
        it('should apply 0% fee for Premium users', async () => {
            const result = await service.initiateRecharge('user-premium-id', 10000);
            expect(result.fee).toBe(0);
            expect(result.totalCharged).toBe(10000);
            expect(result.paymentUrl).toContain('amount=10000');
        });
        it('should throw NotFoundException if user is not found', async () => {
            await expect(service.initiateRecharge('invalid-user-id', 5000))
                .rejects
                .toThrow(common_1.NotFoundException);
        });
    });
    describe('handleWaveWebhook', () => {
        it('should credit the wallet balance when transaction is completed', async () => {
            const recharge = await service.initiateRecharge('user-premium-id', 10000);
            const initialWallet = await service.getWallet('user-premium-id');
            const initialBalance = initialWallet.balance;
            const tx = await service.handleWaveWebhook(recharge.referenceId, recharge.totalCharged, 'completed');
            expect(tx.status).toBe('completed');
            const updatedWallet = await service.getWallet('user-premium-id');
            expect(updatedWallet.balance).toBe(initialBalance + 10000);
        });
        it('should not credit balance if transaction failed', async () => {
            const recharge = await service.initiateRecharge('user-free-id', 5000);
            const initialWallet = await service.getWallet('user-free-id');
            const initialBalance = initialWallet.balance;
            const tx = await service.handleWaveWebhook(recharge.referenceId, recharge.totalCharged, 'failed');
            expect(tx.status).toBe('failed');
            const updatedWallet = await service.getWallet('user-free-id');
            expect(updatedWallet.balance).toBe(initialBalance);
        });
        it('should throw BadRequestException if transaction is already completed', async () => {
            const recharge = await service.initiateRecharge('user-premium-id', 5000);
            await service.handleWaveWebhook(recharge.referenceId, recharge.totalCharged, 'completed');
            await expect(service.handleWaveWebhook(recharge.referenceId, recharge.totalCharged, 'completed'))
                .rejects
                .toThrow(common_1.BadRequestException);
        });
    });
    describe('updateBudgetLimit', () => {
        it('should update the wallet budget limit correctly', async () => {
            const wallet = await service.updateBudgetLimit('user-free-id', 12000);
            expect(wallet.budgetLimit).toBe(12000);
        });
        it('should throw BadRequestException for negative budget limits', async () => {
            await expect(service.updateBudgetLimit('user-free-id', -500))
                .rejects
                .toThrow(common_1.BadRequestException);
        });
    });
});
//# sourceMappingURL=wallet.service.spec.js.map