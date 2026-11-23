/** Card helpers used by the payment form. Nothing here leaves the browser. */

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

export const BRAND_LABELS: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  unknown: 'Card',
};

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function detectBrand(cardNumber: string): CardBrand {
  const n = digitsOnly(cardNumber);
  if (/^4/.test(n)) return 'visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  if (/^(6011|65|64[4-9])/.test(n)) return 'discover';
  return 'unknown';
}

/** Number of digits expected for the brand. */
export function cardLength(brand: CardBrand): number {
  return brand === 'amex' ? 15 : 16;
}

export function cvcLength(brand: CardBrand): number {
  return brand === 'amex' ? 4 : 3;
}

/** Luhn checksum, which every real card number satisfies. */
export function luhnValid(cardNumber: string): boolean {
  const n = digitsOnly(cardNumber);
  if (n.length < 12) return false;
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    let digit = Number(n[n.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/** "4242424242424242" -> "4242 4242 4242 4242"; Amex: "3782 822463 10005". */
export function formatCardNumber(value: string): string {
  const brand = detectBrand(value);
  const n = digitsOnly(value).slice(0, cardLength(brand));
  if (brand === 'amex') {
    return [n.slice(0, 4), n.slice(4, 10), n.slice(10)].filter(Boolean).join(' ');
  }
  return n.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** "1228" or "12/28" -> "12/28", as the user types. */
export function formatExpiry(value: string): string {
  let n = digitsOnly(value).slice(0, 4);
  if (n.length === 1 && Number(n) > 1) n = '0' + n; // "5" -> "05"
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
}

/** Null when valid, otherwise the reason. */
export function expiryError(value: string, now = new Date()): string | null {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return 'Enter the expiry date as MM/YY.';
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return 'The month must be between 01 and 12.';
  // A card is valid until the last day of its expiry month.
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
    return 'This card has expired.';
  }
  if (year > now.getFullYear() + 20) return 'The expiry year is too far away.';
  return null;
}

export function cardNumberError(value: string): string | null {
  const n = digitsOnly(value);
  if (!n) return 'Enter your card number.';
  const brand = detectBrand(n);
  if (brand === 'unknown') return 'This card type is not accepted (Visa, Mastercard, American Express, Discover).';
  if (n.length !== cardLength(brand)) return `The card number must have ${cardLength(brand)} digits.`;
  if (!luhnValid(n)) return 'This card number is not valid.';
  return null;
}

export function cvcError(value: string, brand: CardBrand): string | null {
  const length = cvcLength(brand);
  return new RegExp(`^\\d{${length}}$`).test(value) ? null : `The security code has ${length} digits.`;
}
