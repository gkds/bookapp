export interface OrderLine {
  bookId?: string;
  name: string;
  author: string;
  unitPrice: number;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  phone: string;
}

export type ShippingMethod = 'standard' | 'express';

/** What is kept about the payment: never the card number or the CVC. */
export interface PaymentInfo {
  method: 'card';
  brand: string;
  last4: string;
  transactionId: string;
  status: 'paid';
  /** ISO 8601 date of the payment. */
  paidAt: string;
}

export interface Order {
  id: string;
  /** ISO 8601 date of the order. */
  date: string;
  customerName: string;
  customerEmail: string;
  lines: OrderLine[];
  /** Books only. Missing on orders placed before checkout existed. */
  subtotal?: number;
  shippingMethod?: ShippingMethod;
  shippingCost?: number;
  shipping?: ShippingAddress;
  payment?: PaymentInfo;
  /** Amount charged: subtotal + shipping. */
  total: number;
}
