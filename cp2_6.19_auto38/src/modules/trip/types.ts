export type CurrencyCode = 'USD' | 'EUR' | 'CNY' | 'JPY' | 'GBP';

export interface Trip {
  id: string;
  destination: string;
  currency: CurrencyCode;
  budget: number;
  startDate: string;
  endDate: string;
}

export type TripFormData = Omit<Trip, 'id'>;

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  CNY: '¥',
  JPY: '¥',
  GBP: '£',
};
