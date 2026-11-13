export interface OrderLine {
  bookId?: string;
  name: string;
  author: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  /** ISO 8601 date of the order. */
  date: string;
  customerName: string;
  customerEmail: string;
  lines: OrderLine[];
  total: number;
}
