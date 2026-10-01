export const paymentProviders = ['manual', 'mock', 'wave'] as const;
export type PaymentProvider = (typeof paymentProviders)[number];

export const paymentModes = ['none', 'manual'] as const;
export type PaymentMode = (typeof paymentModes)[number];

export function assertXofAmount(amount: number): number {
  if (!Number.isInteger(amount)) {
    throw new Error('XOF amounts must be integers');
  }
  return amount;
}
