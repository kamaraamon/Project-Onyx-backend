"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const exchange_service_1 = require("./exchange.service");
const auth_service_1 = require("../auth/auth.service");
const wallet_service_1 = require("../wallet/wallet.service");
const common_1 = require("@nestjs/common");
describe('ExchangeService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                exchange_service_1.ExchangeService,
                auth_service_1.AuthService,
                wallet_service_1.WalletService
            ],
        }).compile();
        service = module.get(exchange_service_1.ExchangeService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('proposeExchange', () => {
        it('should create a valid exchange proposal if user trust score is high', async () => {
            const proposal = await service.proposeExchange('user-premium-id', '+221779876543', 'Netflix', 'Spotify');
            expect(proposal.id).toBeDefined();
            expect(proposal.offeringUserId).toBe('user-premium-id');
            expect(proposal.offeredSubName).toBe('Netflix');
            expect(proposal.wantedSubName).toBe('Spotify');
            expect(proposal.status).toBe('available');
        });
        it('should throw BadRequestException if user trust score is too low (<= 30)', async () => {
            await service.reportUser('user-free-id', 'Fraud 1');
            await service.reportUser('user-free-id', 'Fraud 2');
            await service.reportUser('user-free-id', 'Fraud 3');
            await service.reportUser('user-free-id', 'Fraud 4');
            const score = service.getTrustScore('user-free-id');
            expect(score).toBeLessThanOrEqual(30);
            await expect(service.proposeExchange('user-free-id', '+221771234567', 'Spotify', 'Netflix')).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('acceptExchange', () => {
        it('should change status to completed when matched', async () => {
            const proposal = await service.proposeExchange('user-free-id', '+221771234567', 'Netflix', 'Spotify');
            const matched = await service.acceptExchange('user-premium-id', proposal.id);
            expect(matched.status).toBe('completed');
        });
        it('should throw BadRequestException if matching one\'s own proposal', async () => {
            const proposal = await service.proposeExchange('user-premium-id', '+221779876543', 'Netflix', 'Spotify');
            await expect(service.acceptExchange('user-premium-id', proposal.id)).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('reportUser', () => {
        it('should decrease the trust score of the target user by 20 points', async () => {
            const targetUserId = 'user-premium-id';
            const initialScore = service.getTrustScore(targetUserId);
            const result = await service.reportUser(targetUserId, 'Changed password');
            expect(result.newScore).toBe(initialScore - 20);
            const currentScore = service.getTrustScore(targetUserId);
            expect(currentScore).toBe(80);
        });
    });
    describe('claimBackupProfile', () => {
        it('should register a backup claim under SLA', async () => {
            const userId = 'user-free-id';
            const exchangeId = 'ex-1';
            const claim = await service.claimBackupProfile(userId, exchangeId);
            expect(claim.id).toBeDefined();
            expect(claim.userId).toBe(userId);
            expect(claim.exchangeId).toBe(exchangeId);
            expect(claim.status).toBe('pending');
            const claimsList = await service.getBackupClaims(userId);
            expect(claimsList.length).toBe(1);
        });
    });
});
//# sourceMappingURL=exchange.service.spec.js.map