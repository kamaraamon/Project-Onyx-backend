"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const concierge_service_1 = require("./concierge.service");
const auth_service_1 = require("../auth/auth.service");
const wallet_service_1 = require("../wallet/wallet.service");
const common_1 = require("@nestjs/common");
describe('ConciergeService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                concierge_service_1.ConciergeService,
                auth_service_1.AuthService,
                wallet_service_1.WalletService
            ],
        }).compile();
        service = module.get(concierge_service_1.ConciergeService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('createRequest', () => {
        it('should create a request and set the SLA expiration date to 24 hours in the future', async () => {
            const userId = 'user-free-id';
            const actionType = 'resiliation';
            const serviceName = 'Netflix';
            const request = await service.createRequest(userId, actionType, serviceName);
            expect(request.id).toBeDefined();
            expect(request.userId).toBe(userId);
            expect(request.actionType).toBe(actionType);
            expect(request.serviceName).toBe(serviceName);
            expect(request.status).toBe('pending');
            const expectedTime = new Date();
            expectedTime.setHours(expectedTime.getHours() + 24);
            const diffMs = Math.abs(request.slaExpiry.getTime() - expectedTime.getTime());
            expect(diffMs).toBeLessThan(1000);
        });
        it('should insert a creation alert into the security logs', async () => {
            const userId = 'user-free-id';
            const request = await service.createRequest(userId, 'activation', 'Spotify');
            const alerts = await service.getAlerts(userId);
            expect(alerts[0].title).toBe('Demande reçue');
            expect(alerts[0].message).toContain('Spotify');
        });
    });
    describe('completeRequest', () => {
        it('should update request status to completed and trigger the double notification log', async () => {
            const userId = 'user-free-id';
            const request = await service.createRequest(userId, 'suspension', 'Canal+');
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const completed = await service.completeRequest(request.id);
            expect(completed.status).toBe('completed');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[PUSH NOTIFICATION DISPATCHED]'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[EMAIL NOTIFICATION DISPATCHED]'));
            consoleSpy.mockRestore();
        });
        it('should insert a security log entry when action is executed', async () => {
            const userId = 'user-free-id';
            const request = await service.createRequest(userId, 'activation', 'Netflix');
            await service.completeRequest(request.id);
            const alerts = await service.getAlerts(userId);
            expect(alerts[0].title).toBe('Sécurité : Action Exécutée');
            expect(alerts[0].message).toContain('Netflix');
        });
        it('should throw BadRequestException if completing a request that is already completed', async () => {
            const userId = 'user-free-id';
            const request = await service.createRequest(userId, 'activation', 'Netflix');
            await service.completeRequest(request.id);
            await expect(service.completeRequest(request.id))
                .rejects
                .toThrow(common_1.BadRequestException);
        });
        it('should throw NotFoundException for invalid request ID', async () => {
            await expect(service.completeRequest('invalid-request-id'))
                .rejects
                .toThrow(common_1.NotFoundException);
        });
    });
});
//# sourceMappingURL=concierge.service.spec.js.map