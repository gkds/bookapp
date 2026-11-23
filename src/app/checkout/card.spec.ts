import { cardNumberError, cvcError, detectBrand, expiryError, formatCardNumber, formatExpiry, luhnValid } from './card';

describe('card helpers', () => {
  it('detects brands', () => {
    expect(detectBrand('4242')).toBe('visa');
    expect(detectBrand('5555')).toBe('mastercard');
    expect(detectBrand('2221')).toBe('mastercard');
    expect(detectBrand('3782')).toBe('amex');
    expect(detectBrand('9999')).toBe('unknown');
  });

  it('checks the Luhn checksum', () => {
    expect(luhnValid('4242 4242 4242 4242')).toBeTrue();
    expect(luhnValid('4242 4242 4242 4241')).toBeFalse();
  });

  it('validates card numbers', () => {
    expect(cardNumberError('4242424242424242')).toBeNull();
    expect(cardNumberError('378282246310005')).toBeNull();
    expect(cardNumberError('4242')).toContain('16 digits');
    expect(cardNumberError('4242424242424241')).toContain('not valid');
  });

  it('formats as the user types', () => {
    expect(formatCardNumber('42424242424242429999')).toBe('4242 4242 4242 4242');
    expect(formatCardNumber('378282246310005')).toBe('3782 822463 10005');
    expect(formatExpiry('1228')).toBe('12/28');
    expect(formatExpiry('5')).toBe('05');
  });

  it('validates the expiry date', () => {
    const now = new Date(2026, 10, 23); // November 2026
    expect(expiryError('11/26', now)).toBeNull();
    expect(expiryError('10/26', now)).toBe('This card has expired.');
    expect(expiryError('13/27', now)).toContain('month');
    expect(expiryError('1227', now)).toContain('MM/YY');
  });

  it('validates the CVC length per brand', () => {
    expect(cvcError('123', 'visa')).toBeNull();
    expect(cvcError('123', 'amex')).toContain('4 digits');
  });
});
