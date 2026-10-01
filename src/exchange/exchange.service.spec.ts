import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeService } from './exchange.service';
import { AuthService } from '../auth/auth.service';
import { WalletService } from '../wallet/wallet.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ExchangeService', () => {
  let service: ExchangeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeService,
        AuthService,
        WalletService
      ],
    }).compile();

    service = module.get<ExchangeService>(ExchangeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('proposeExchange', () => {
    it('should create a valid exchange proposal if user trust score is high', async () => {
      const proposal = await service.proposeExchange(
        'user-premium-id',
        '+221779876543',
        'Netflix',
        'Spotify'
      );

      expect(proposal.id).toBeDefined();
      expect(proposal.offeringUserId).toBe('user-premium-id');
      expect(proposal.offeredSubName).toBe('Netflix');
      expect(proposal.wantedSubName).toBe('Spotify');
      expect(proposal.status).toBe('available');
    });

    it('should throw BadRequestException if user trust score is too low (<= 30)', async () => {
      // Simulate low trust score by reporting user 4 times (100 -> 80 -> 60 -> 40 -> 20)
      await service.reportUser('user-free-id', 'Fraud 1');
      await service.reportUser('user-free-id', 'Fraud 2');
      await service.reportUser('user-free-id', 'Fraud 3');
      await service.reportUser('user-free-id', 'Fraud 4');

      const score = service.getTrustScore('user-free-id');
      expect(score).toBeLessThanOrEqual(30);

      await expect(
        service.proposeExchange('user-free-id', '+221771234567', 'Spotify', 'Netflix')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('acceptExchange', () => {
    it('should change status to completed when matched', async () => {
      // Alice creates proposal
      const proposal = await service.proposeExchange(
        'user-free-id',
        '+221771234567',
        'Netflix',
        'Spotify'
      );

      // Bob accepts proposal
      const matched = await service.acceptExchange('user-premium-id', proposal.id);
      expect(matched.status).toBe('completed');
    });

    it('should throw BadRequestException if matching one\'s own proposal', async () => {
      const proposal = await service.proposeExchange(
        'user-premium-id',
        '+221779876543',
        'Netflix',
        'Spotify'
      );

      await expect(
        service.acceptExchange('user-premium-id', proposal.id)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reportUser', () => {
    it('should decrease the trust score of the target user by 20 points', async () => {
      const targetUserId = 'user-premium-id';
      const initialScore = service.getTrustScore(targetUserId); // 100

      const result = await service.reportUser(targetUserId, 'Changed password');
      expect(result.newScore).toBe(initialScore - 20); // 80
      
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
