export interface ExchangeRateTable {
  [key: string]: {
    [key: string]: number;
  };
}

export const exchangeRates: ExchangeRateTable = {
  USD: { USD: 1, EUR: 0.92, CNY: 7.24, JPY: 149.50, GBP: 0.79 },
  EUR: { USD: 1.09, EUR: 1, CNY: 7.87, JPY: 162.50, GBP: 0.86 },
  CNY: { USD: 0.14, EUR: 0.13, CNY: 1, JPY: 20.65, GBP: 0.11 },
  JPY: { USD: 0.0067, EUR: 0.0062, CNY: 0.048, JPY: 1, GBP: 0.0053 },
  GBP: { USD: 1.27, EUR: 1.16, CNY: 9.16, JPY: 189.87, GBP: 1 },
};

export const currencySymbols: { [key: string]: string } = {
  USD: '$',
  EUR: '€',
  CNY: '¥',
  JPY: '¥',
  GBP: '£',
};

export const currencyNames: { [key: string]: string } = {
  USD: '美元',
  EUR: '欧元',
  CNY: '人民币',
  JPY: '日元',
  GBP: '英镑',
};

export interface CurrencyConversionResult {
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
): CurrencyConversionResult {
  const rate = exchangeRates[fromCurrency]?.[toCurrency] ?? 1;
  const convertedAmount = amount * rate;

  return {
    convertedAmount: Math.round(convertedAmount * 100) / 100,
    originalAmount: amount,
    originalCurrency: fromCurrency,
    targetCurrency: toCurrency,
    rate: Math.round(rate * 10000) / 10000,
  };
}

export function formatCurrency(amount: number, currency: string): string {
  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
}

export function getCurrencySymbol(currency: string): string {
  return currencySymbols[currency] || currency;
}
