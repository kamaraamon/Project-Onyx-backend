import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Recharge Wave simulee
   * POST /payment/deposit
   */
  @Post('deposit')
  @HttpCode(HttpStatus.OK)
  async deposit(
    @Body('userId') userId: string,
    @Body('amount') amount: number
  ) {
    return this.paymentService.deposit(userId, amount);
  }

  /**
   * Webhook Wave Squelette securise
   * POST /payment/wave-webhook
   */
  @Post('wave-webhook')
  @HttpCode(HttpStatus.OK)
  async waveWebhook(
    @Body() payload: any,
    @Headers('x-wave-signature') signature: string
  ) {
    return this.paymentService.handleWaveWebhook(payload, signature);
  }
}
