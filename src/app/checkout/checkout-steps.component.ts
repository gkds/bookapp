import { Component, Input } from '@angular/core';

/** Progress bar of the order funnel: Cart > Delivery > Payment > Confirmation. */
@Component({
  selector: 'app-checkout-steps',
  template: `
    <ol class="flex items-center gap-2 sm:gap-4 mb-6 text-xs sm:text-sm" aria-label="Checkout progress">
      <li *ngFor="let step of steps; let i = index; let last = last" class="flex items-center gap-2 sm:gap-4"
        [attr.aria-current]="i === current ? 'step' : null">
        <span class="flex items-center gap-2">
          <span class="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold"
            [ngClass]="i < current ? 'bg-green-600 text-white' : i === current ? 'bg-purple-700 text-white' : 'bg-gray-200 text-gray-600'">
            {{ i < current ? '✓' : i + 1 }}
          </span>
          <span [ngClass]="i === current ? 'font-semibold text-purple-900' : 'text-gray-600'" class="hidden sm:inline">{{ step }}</span>
        </span>
        <span *ngIf="!last" class="w-4 sm:w-10 h-px bg-gray-300" aria-hidden="true"></span>
      </li>
    </ol>
  `,
})
export class CheckoutStepsComponent {
  readonly steps = ['Cart', 'Delivery', 'Payment', 'Confirmation'];
  /** Index of the current step in `steps`. */
  @Input() current = 0;
}
