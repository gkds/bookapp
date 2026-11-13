import { CurrencyPipe, DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { auth } from './firebase';
import { CartServiceService } from './cart-service.service';
import { Order } from './types/order';

const LAST_ORDER_KEY = 'bookapp.lastOrder';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly currency = new CurrencyPipe('en-US');
  private readonly datePipe = new DatePipe('en-US');
  private lastOrder: Order | null = null;

  constructor(private cartService: CartServiceService) {}

  /** Turns the current cart into an order, empties the cart and returns the order. */
  placeOrder(): Order | null {
    const items = this.cartService.get();
    if (items.length === 0) return null;

    const user = auth.currentUser;
    const order: Order = {
      id: this.newOrderId(),
      date: new Date().toISOString(),
      customerName: user?.displayName ?? '',
      customerEmail: user?.email ?? '',
      lines: items.map((item) => ({
        name: item.book.name,
        author: item.book.author,
        unitPrice: item.book.price,
        quantity: item.quantity,
      })),
      total: this.cartService.total(),
    };

    this.cartService.clear();
    // Kept for the browser session so the confirmation page survives a reload.
    try {
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
    } catch {
      // Storage unavailable (private mode, quota): the page still works until reload.
    }
    this.lastOrder = order;
    return order;
  }

  getLastOrder(): Order | null {
    if (this.lastOrder) return this.lastOrder;
    try {
      const saved = sessionStorage.getItem(LAST_ORDER_KEY);
      this.lastOrder = saved ? (JSON.parse(saved) as Order) : null;
    } catch {
      this.lastOrder = null;
    }
    return this.lastOrder;
  }

  /** Builds the invoice PDF and starts the download. */
  async downloadInvoice(order: Order): Promise<void> {
    // Loaded on demand: the PDF library is only needed on this action.
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const doc = new jsPDF();
    const price = (value: number) => this.currency.transform(value, 'GBP') ?? '';

    doc.setFontSize(20);
    doc.text('Book shop', 14, 20);
    doc.setFontSize(14);
    doc.text('Invoice', 196, 20, { align: 'right' });

    doc.setFontSize(10);
    doc.text(`Invoice no: ${order.id}`, 14, 32);
    doc.text(`Date: ${this.datePipe.transform(order.date, 'mediumDate')}`, 14, 38);
    doc.text('Billed to:', 14, 50);
    doc.text(order.customerName || '-', 14, 56);
    doc.text(order.customerEmail || '-', 14, 62);

    autoTable(doc, {
      startY: 72,
      head: [['Book', 'Author', 'Unit price', 'Qty', 'Subtotal']],
      body: order.lines.map((line) => [
        line.name,
        line.author,
        price(line.unitPrice),
        String(line.quantity),
        price(line.unitPrice * line.quantity),
      ]),
      foot: [['', '', '', 'Total', price(order.total)]],
      headStyles: { fillColor: [88, 28, 135] },
      footStyles: { fillColor: [243, 232, 255], textColor: 20, fontStyle: 'bold' },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'center' },
        4: { halign: 'right' },
      },
    });

    doc.save(`invoice-${order.id}.pdf`);
  }

  private newOrderId(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `ORD-${date}-${suffix}`;
  }
}
