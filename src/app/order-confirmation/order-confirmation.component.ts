import { Component } from '@angular/core';
import { OrderService } from '../order.service';
import { Order } from '../types/order';

@Component({
  selector: 'app-order-confirmation',
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.css'],
})
export class OrderConfirmationComponent {
  readonly order: Order | null = this.orderService.getLastOrder();
  isGenerating = false;
  error: string | null = null;

  constructor(private orderService: OrderService) {}

  async downloadInvoice(): Promise<void> {
    if (!this.order || this.isGenerating) return;

    this.isGenerating = true;
    this.error = null;
    try {
      await this.orderService.downloadInvoice(this.order);
    } catch {
      this.error = 'The invoice could not be generated. Please try again.';
    } finally {
      this.isGenerating = false;
    }
  }
}
