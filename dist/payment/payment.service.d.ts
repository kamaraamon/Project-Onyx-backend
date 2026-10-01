import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export declare class RenewalFundsException extends BadRequestException {
    constructor(message: string);
}
export declare class PaymentService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    deposit(userId: string, amount: number): Promise<any>;
    checkRenewalFunds(subscriptionId: string): Promise<boolean>;
    handleWaveWebhook(payload: any, signature: string): Promise<any>;
}
