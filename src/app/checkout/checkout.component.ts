import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthService } from '../auth/authService';
import { CartItem, CartServiceService } from '../cart-service.service';
import { OrderService } from '../order.service';
import { PaymentInfo, ShippingAddress, ShippingMethod } from '../types/order';
import {
  BRAND_LABELS,
  CardBrand,
  cardLength,
  cardNumberError,
  cvcError,
  cvcLength,
  detectBrand,
  digitsOnly,
  expiryError,
  formatCardNumber,
  formatExpiry,
} from './card';
import { CardDetails, PaymentService, TEST_CARDS, THREE_D_SECURE_CODE } from './payment.service';
import { COUNTRIES, SHIPPING_OPTIONS, shippingPrice } from './shipping';

type Step = 'delivery' | 'payment';

const ADDRESS_STORAGE_KEY = 'bookapp.checkout.address';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
})
export class CheckoutComponent implements OnInit, OnDestroy {
  readonly shippingOptions = SHIPPING_OPTIONS;
  readonly countries = COUNTRIES;
  readonly testCards = TEST_CARDS;
  readonly threeDSecureCode = THREE_D_SECURE_CODE;

  step: Step = 'delivery';

  address: ShippingAddress = { fullName: '', address: '', city: '', postcode: '', country: 'United Kingdom', phone: '' };
  shippingMethod: ShippingMethod = 'standard';

  card: CardDetails = { number: '', holder: '', expiry: '', cvc: '' };
  cardSubmitted = false;

  isProcessing = false;
  paymentError: string | null = null;

  /** Set while the bank asks for 3-D Secure authentication. */
  challenge: { id: string; last4: string; error: string | null } | null = null;
  otp = '';

  /** Payment that went through but whose order could not be saved yet. */
  private paidWith: PaymentInfo | null = null;
  private subscription?: Subscription;

  constructor(
    private cartService: CartServiceService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.items.length === 0) {
      this.router.navigate(['/cart']);
      return;
    }
    // Reuse the last delivery address, or at least the account's name.
    try {
      const saved = sessionStorage.getItem(ADDRESS_STORAGE_KEY);
      if (saved) this.address = { ...this.address, ...JSON.parse(saved) };
    } catch {
      /* storage unavailable: start with an empty form */
    }
    this.subscription = this.authService.user$.pipe(take(1)).subscribe((user) => {
      if (!this.address.fullName) this.address.fullName = user?.displayName ?? '';
      if (!this.card.holder) this.card.holder = user?.displayName ?? '';
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  get items(): CartItem[] {
    return this.cartService.get();
  }

  get subtotal(): number {
    return this.cartService.total();
  }

  get shippingCost(): number {
    return shippingPrice(this.shippingMethod);
  }

  get total(): number {
    return this.orderService.totalWithShipping(this.shippingMethod);
  }

  get itemCount(): number {
    return this.items.reduce((n, i) => n + i.quantity, 0);
  }

  // --- Step 1: delivery --------------------------------------------------

  submitDelivery(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    try {
      sessionStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(this.address));
    } catch {
      /* not critical */
    }
    this.step = 'payment';
    window.scrollTo({ top: 0 });
  }

  backToDelivery(): void {
    if (this.isProcessing) return;
    this.step = 'delivery';
    this.paymentError = null;
  }

  // --- Step 2: payment ---------------------------------------------------

  get brand(): CardBrand {
    return detectBrand(this.card.number);
  }

  get brandLabel(): string {
    return BRAND_LABELS[this.brand];
  }

  get cardMaxLength(): number {
    // digits + the spaces added by formatCardNumber()
    return cardLength(this.brand) + (this.brand === 'amex' ? 2 : 3);
  }

  get cvcMaxLength(): number {
    return cvcLength(this.brand);
  }

  get numberError(): string | null {
    return cardNumberError(this.card.number);
  }

  get expiryErr(): string | null {
    return expiryError(this.card.expiry);
  }

  get cvcErr(): string | null {
    return cvcError(this.card.cvc, this.brand);
  }

  get holderError(): string | null {
    return this.card.holder.trim().length >= 2 ? null : 'Enter the name shown on the card.';
  }

  /** Card number as shown on the card preview. */
  get previewNumber(): string {
    const masked = formatCardNumber(this.card.number);
    const template = this.brand === 'amex' ? '•••• •••••• •••••' : '•••• •••• •••• ••••';
    return masked + template.slice(masked.length);
  }

  // The inputs are formatted as the user types; the element is updated
  // directly so the caret stays usable even when the model does not change.
  onCardNumberInput(input: HTMLInputElement): void {
    this.card.number = input.value = formatCardNumber(input.value);
  }

  onExpiryInput(input: HTMLInputElement): void {
    // Let backspace remove the "/" naturally.
    const deleting = input.value.length < this.card.expiry.length;
    this.card.expiry = input.value = deleting ? input.value : formatExpiry(input.value);
  }

  onCvcInput(input: HTMLInputElement): void {
    this.card.cvc = input.value = digitsOnly(input.value).slice(0, this.cvcMaxLength);
  }

  useTestCard(number: string): void {
    this.card.number = formatCardNumber(number);
    const nextYear = (new Date().getFullYear() + 2) % 100;
    if (!this.card.expiry) this.card.expiry = `12/${String(nextYear).padStart(2, '0')}`;
    this.card.cvc = detectBrand(number) === 'amex' ? '1234' : '123';
    this.paymentError = null;
  }

  async pay(): Promise<void> {
    this.cardSubmitted = true;
    this.paymentError = null;
    if (this.isProcessing) return;

    if (this.paidWith) {
      // Already charged: only the order is left to save.
      await this.saveOrder(this.paidWith);
      return;
    }
    if (this.numberError || this.expiryErr || this.cvcErr || this.holderError) return;

    this.isProcessing = true;
    try {
      const result = await this.paymentService.charge(this.card, this.total);
      if (result.status === 'requires_action') {
        this.challenge = { id: result.challengeId, last4: result.last4, error: null };
        this.otp = '';
        return;
      }
      if (result.status === 'declined') {
        this.paymentError = result.message;
        return;
      }
      await this.onPaid(result.transactionId, result.brand, result.last4);
    } catch {
      this.paymentError = 'The payment service is unreachable. You have not been charged; please try again.';
    } finally {
      this.isProcessing = false;
    }
  }

  async submitOtp(): Promise<void> {
    if (!this.challenge || this.isProcessing) return;
    this.isProcessing = true;
    try {
      const result = await this.paymentService.confirmThreeDSecure(this.challenge.id, this.otp);
      if (result.status === 'requires_action') {
        this.challenge.error = 'Wrong code. Please try again.';
        this.otp = '';
      } else if (result.status === 'declined') {
        this.challenge = null;
        this.paymentError = result.message;
      } else {
        this.challenge = null;
        await this.onPaid(result.transactionId, result.brand, result.last4);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  cancelChallenge(): void {
    if (!this.challenge) return;
    this.paymentService.cancelThreeDSecure(this.challenge.id);
    this.challenge = null;
    this.paymentError = 'Authentication cancelled. You have not been charged.';
  }

  private async onPaid(transactionId: string, brand: string, last4: string): Promise<void> {
    // Forget the sensitive fields straight away.
    this.card = { number: '', holder: this.card.holder, expiry: '', cvc: '' };
    this.paidWith = { method: 'card', brand, last4, transactionId, status: 'paid', paidAt: new Date().toISOString() };
    await this.saveOrder(this.paidWith);
  }

  private async saveOrder(payment: PaymentInfo): Promise<void> {
    this.isProcessing = true;
    try {
      const order = await this.orderService.placeOrder({
        shipping: { ...this.address },
        shippingMethod: this.shippingMethod,
        payment,
      });
      this.paidWith = null;
      await this.router.navigate(['/order-confirmation', order.id]);
    } catch {
      this.paymentError = `Your payment went through (transaction ${payment.transactionId}) but the order could not be saved. Click "Retry" — you will not be charged again.`;
    } finally {
      this.isProcessing = false;
    }
  }

  get paymentAccepted(): boolean {
    return this.paidWith !== null;
  }
}
