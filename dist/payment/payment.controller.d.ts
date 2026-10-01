import { PaymentService } from './payment.service';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    deposit(userId: string, amount: number): Promise<any>;
    waveWebhook(payload: any, signature: string): Promise<any>;
}
