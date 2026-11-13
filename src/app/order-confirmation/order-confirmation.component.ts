import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../order.service';
import { Order } from '../types/order';

@Component({
  selector: 'app-order-confirmation',
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.css'],
})
export class OrderConfirmationComponent implements OnInit {
  order: Order | null = null;
  isLoading = true;
  isGenerating = false;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private orderService: OrderService) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.order = id ? await this.orderService.getOrder(id) : null;
    this.isLoading = false;
  }

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
