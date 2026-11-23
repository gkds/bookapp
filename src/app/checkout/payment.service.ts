import { Injectable } from '@angular/core';
import { BRAND_LABELS, CardBrand, detectBrand, digitsOnly } from './card';

/**
 * FAKE payment gateway, for demonstration only: no money moves and the card
 * details never leave the browser. It behaves like a real card processor
 * (authorization, 3-D Secure challenge, declines) with these test cards; any
 * other valid number is accepted.
 */
export const TEST_CARDS = [
  { number: '4242 4242 4242 4242', result: 'Payment accepted' },
  { number: '5555 5555 5555 4444', result: 'Payment accepted (Mastercard)' },
  { number: '3782 822463 10005', result: 'Payment accepted (American Express)' },
  { number: '4000 0027 6000 3184', result: '3-D Secure: enter code 123456' },
  { number: '4000 0000 0000 0002', result: 'Card declined' },
  { number: '4000 0000 0000 9995', result: 'Insufficient funds' },
  { number: '4000 0000 0000 0069', result: 'Expired card' },
  { number: '4000 0000 0000 0127', result: 'Incorrect security code' },
];

/** Code to type in the fake 3-D Secure screen. */
export const THREE_D_SECURE_CODE = '123456';

export interface CardDetails {
  number: string;
  holder: string;
  expiry: string;
  cvc: string;
}

export interface PaymentSuccess {
  status: 'succeeded';
  transactionId: string;
  brand: string;
  last4: string;
}

export interface PaymentRequiresAction {
  status: 'requires_action';
  /** Identifies the pending authorization for confirmThreeDSecure(). */
  challengeId: string;
  last4: string;
}

export interface PaymentDeclined {
  status: 'declined';
  message: string;
}

export type PaymentResult = PaymentSuccess | PaymentRequiresAction | PaymentDeclined;

const DECLINES: Record<string, string> = {
  '4000000000000002': 'Your card was declined by your bank.',
  '4000000000009995': 'Your card has insufficient funds.',
  '4000000000000069': 'Your card has expired.',
  '4000000000000127': 'The security code (CVC) is incorrect.',
};
const THREE_D_SECURE_CARDS = new Set(['4000002760003184']);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  /** Simulated network latency, in milliseconds. */
  latency = 1200;

  private pending = new Map<string, { brand: CardBrand; last4: string; attempts: number }>();

  /** Asks the (fake) bank to authorize and capture `amount` on the card. */
  async charge(card: CardDetails, amount: number): Promise<PaymentResult> {
    await delay(this.latency);
    const number = digitsOnly(card.number);
    const brand = detectBrand(number);
    const last4 = number.slice(-4);

    if (!(amount > 0)) return { status: 'declined', message: 'Invalid amount.' };
    const decline = DECLINES[number];
    if (decline) return { status: 'declined', message: decline };

    if (THREE_D_SECURE_CARDS.has(number)) {
      const challengeId = this.newId('3ds');
      this.pending.set(challengeId, { brand, last4, attempts: 0 });
      return { status: 'requires_action', challengeId, last4 };
    }
    return this.success(brand, last4);
  }

  /** Answers the bank's 3-D Secure challenge (3 attempts at most). */
  async confirmThreeDSecure(challengeId: string, code: string): Promise<PaymentResult> {
    await delay(this.latency / 2);
    const challenge = this.pending.get(challengeId);
    if (!challenge) return { status: 'declined', message: 'The authentication session has expired.' };

    if (code.trim() === THREE_D_SECURE_CODE) {
      this.pending.delete(challengeId);
      return this.success(challenge.brand, challenge.last4);
    }
    challenge.attempts++;
    if (challenge.attempts >= 3) {
      this.pending.delete(challengeId);
      return { status: 'declined', message: 'Authentication failed: too many wrong codes. The payment was cancelled.' };
    }
    return { status: 'requires_action', challengeId, last4: challenge.last4 };
  }

  /** The customer closed the 3-D Secure window. */
  cancelThreeDSecure(challengeId: string): void {
    this.pending.delete(challengeId);
  }

  private success(brand: CardBrand, last4: string): PaymentSuccess {
    return { status: 'succeeded', transactionId: this.newId('txn'), brand: BRAND_LABELS[brand], last4 };
  }

  private newId(prefix: string): string {
    const random = crypto.getRandomValues(new Uint32Array(2));
    return `${prefix}_${Array.from(random, (n) => n.toString(36)).join('').toUpperCase()}`;
  }
}
