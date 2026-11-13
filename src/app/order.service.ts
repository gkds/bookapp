import { CurrencyPipe, DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { CartServiceService } from './cart-service.service';
import { auth, db } from './firebase';
import { Order } from './types/order';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly currency = new CurrencyPipe('en-US');
  private readonly datePipe = new DatePipe('en-US');

  constructor(private cartService: CartServiceService) {}

  /**
   * Saves the current cart as an order in `orders/{id}` and empties the
   * stored cart in the same atomic write. Returns the saved order.
   */
  async placeOrder(): Promise<Order> {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be logged in to place an order.');

    const items = this.cartService.get();
    if (items.length === 0) throw new Error('Your cart is empty.');

    const order: Order = {
      id: this.newOrderId(),
      date: new Date().toISOString(),
      customerName: user.displayName ?? '',
      customerEmail: user.email ?? '',
      lines: items.map((item) => ({
        name: item.book.name,
        author: item.book.author,
        unitPrice: item.book.price,
        quantity: item.quantity,
      })),
      total: this.cartService.total(),
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'orders', order.id), {
      ...order,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
    batch.set(CartServiceService.cartRef(user.uid), { items: [], updatedAt: serverTimestamp() });
    await batch.commit();

    this.cartService.clearLocal();
    return order;
  }

  /** Reads one of the current user's orders; null if missing or not theirs. */
  async getOrder(id: string): Promise<Order | null> {
    try {
      const snapshot = await getDoc(doc(db, 'orders', id));
      if (!snapshot.exists()) return null;
      const { userId, createdAt, ...order } = snapshot.data();
      return order as Order;
    } catch {
      // The security rules refuse to read another user's (or a missing) order.
      return null;
    }
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
