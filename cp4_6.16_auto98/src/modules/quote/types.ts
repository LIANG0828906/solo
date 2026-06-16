export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export type QuoteVersionStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface QuoteVersion {
  id: string;
  version: number;
  createdAt: string;
  status: QuoteVersionStatus;
  items: QuoteItem[];
  totalAmount: number;
}

export interface Quote {
  id: string;
  projectId: string;
  projectName: string;
  quoteDate: string;
  versions: QuoteVersion[];
  currentVersionId: string;
}

export type InvoiceStatus = 'unsent' | 'sent' | 'partial' | 'paid';

export interface PaymentEvent {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  status: InvoiceStatus;
  note?: string;
}

export interface Invoice {
  id: string;
  quoteId: string;
  quoteVersionId: string;
  projectId: string;
  contractNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  items: QuoteItem[];
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  paymentEvents: PaymentEvent[];
}

export interface DiffResult {
  added: QuoteItem[];
  removed: QuoteItem[];
  modified: QuoteItem[];
}
