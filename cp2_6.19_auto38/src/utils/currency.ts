import type { CurrencyCode } from '@/modules/trip/types';

export interface ExchangeRates {
  [key: string]: number;
}

export const EXCHANGE_RATES: ExchangeRates = {
  USD: 1.00,
  EUR: 0.92,
  CNY: 7.24,
  JPY: 149.50,
  GBP: 0.79,
};

export const CURRENCY_LIST: CurrencyCode[] = ['USD', 'EUR', 'CNY', 'JPY', 'GBP'];

export interface ConversionResult {
  convertedAmount: number;
  originalAmount: number;
  originalCurrency: string;
  targetCurrency: string;
  rate: number;
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): ConversionResult {
  const fromRate = EXCHANGE_RATES[fromCurrency] ?? 1;
  const toRate = EXCHANGE_RATES[toCurrency] ?? 1;
  
  const amountInUsd = amount / fromRate;
  const convertedAmount = amountInUsd * toRate;
  
  return {
    convertedAmount: Math.round(convertedAmount * 100) / 100,
    originalAmount: amount,
    originalCurrency: fromCurrency,
    targetCurrency: toCurrency,
    rate: Math.round((toRate / fromRate) * 10000) / 10000,
  };
}

export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    CNY: '¥',
    JPY: '¥',
    GBP: '£',
  };
  
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
}
