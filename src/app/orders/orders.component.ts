import { Component, OnInit } from '@angular/core';
import { OrderService } from '../order.service';
import { Order } from '../types/order';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  isLoading = true;
  error: string | null = null;
  downloadingId: string | null = null;

  constructor(private orderService: OrderService) {}

  async ngOnInit(): Promise<void> {
    try {
      this.orders = await this.orderService.getMyOrders();
    } catch {
      this.error = 'Your orders could not be loaded. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  itemCount(order: Order): number {
    return order.lines.reduce((sum, line) => sum + line.quantity, 0);
  }

  async downloadInvoice(order: Order): Promise<void> {
    if (this.downloadingId) return;

    this.downloadingId = order.id;
    this.error = null;
    try {
      await this.orderService.downloadInvoice(order);
    } catch {
      this.error = 'The invoice could not be generated. Please try again.';
    } finally {
      this.downloadingId = null;
    }
  }
}
