import { ShippingMethod } from '../types/order';

export interface ShippingOption {
  id: ShippingMethod;
  label: string;
  delay: string;
  price: number;
}

export const SHIPPING_OPTIONS: readonly ShippingOption[] = [
  { id: 'standard', label: 'Standard delivery', delay: '3–5 working days', price: 0 },
  { id: 'express', label: 'Express delivery', delay: 'Next working day', price: 4.99 },
];

export function shippingPrice(method: ShippingMethod): number {
  return SHIPPING_OPTIONS.find((o) => o.id === method)?.price ?? 0;
}

export const COUNTRIES = ['United Kingdom', 'France', 'Belgium', 'Germany', 'Ireland', 'Spain', 'Italy', 'Netherlands', 'Switzerland', 'United States', 'Canada'];
