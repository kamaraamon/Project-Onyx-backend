import { describe, expect, it } from 'vitest';
import { assertXofAmount, paymentModes, paymentProviders } from './amount';

describe('XOF amounts', () => {
  it('accepts integer amounts', () => {
    expect(assertXofAmount(0)).toBe(0);
    expect(assertXofAmount(1500)).toBe(1500);
  });

  it('rejects fractional amounts', () => {
    expect(() => assertXofAmount(10.5)).toThrow(/integer/);
  });

  it('lists the payment providers and modes from the product contract', () => {
    expect(paymentProviders).toEqual(['manual', 'mock', 'wave']);
    expect(paymentModes).toEqual(['none', 'manual']);
  });
});
