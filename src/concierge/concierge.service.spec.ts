import { Test, TestingModule } from '@nestjs/testing';
import { ConciergeService } from './concierge.service';
import { AuthService } from '../auth/auth.service';
import { WalletService } from '../wallet/wallet.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ConciergeService', () => {
  let service: ConciergeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConciergeService,
        AuthService,
        WalletService
      ],
    }).compile();

    service = module.get<ConciergeService>(ConciergeService);
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
      
      // SLA should be exactly 24h from now (allowing some margin for execution latency)
      const expectedTime = new Date();
      expectedTime.setHours(expectedTime.getHours() + 24);
      
      const diffMs = Math.abs(request.slaExpiry.getTime() - expectedTime.getTime());
      expect(diffMs).toBeLessThan(1000); // Less than 1 second difference
    });

    it('should insert a creation alert into the security logs', async () => {
      const userId = 'user-free-id';
      const request = await service.createRequest(userId, 'activation', 'Spotify');

      const alerts = await service.getAlerts(userId);
      // The newest alert should be the creation alert
      expect(alerts[0].title).toBe('Demande reçue');
      expect(alerts[0].message).toContain('Spotify');
    });
  });

  describe('completeRequest', () => {
    it('should update request status to completed and trigger the double notification log', async () => {
      const userId = 'user-free-id';
      const request = await service.createRequest(userId, 'suspension', 'Canal+');

      // Intercept console.log to confirm notification triggers
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const completed = await service.completeRequest(request.id);
      expect(completed.status).toBe('completed');

      // Verify double notification logs
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
        .toThrow(BadRequestException);
    });

    it('should throw NotFoundException for invalid request ID', async () => {
      await expect(service.completeRequest('invalid-request-id'))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});
