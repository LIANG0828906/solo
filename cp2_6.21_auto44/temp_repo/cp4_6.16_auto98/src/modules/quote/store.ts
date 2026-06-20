import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { useClientStore } from '@/modules/client/store';
import type {
  Quote,
  QuoteItem,
  QuoteVersion,
  QuoteVersionStatus,
  Invoice,
  InvoiceStatus,
  PaymentEvent,
  DiffResult,
} from './types';

const QUOTES_KEY = 'freelance_quotes';
const INVOICES_KEY = 'freelance_invoices';

function calculateTotalAmount(items: QuoteItem[]): number {
  return items.reduce((total, item) => {
    const subtotal = item.quantity * item.unitPrice;
    const tax = subtotal * item.taxRate;
    return total + subtotal + tax;
  }, 0);
}

function generateContractNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `HT-${year}-${random}`;
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${year}${month}-${random}`;
}

interface QuoteState {
  quotes: Quote[];
  invoices: Invoice[];

  createQuote: (projectId: string, projectName: string) => Quote;
  saveVersion: (
    quoteId: string,
    items: QuoteItem[],
    status?: QuoteVersionStatus
  ) => QuoteVersion | null;
  getQuoteByProject: (projectId: string) => Quote | undefined;
  compareVersions: (
    versionA: QuoteVersion,
    versionB: QuoteVersion
  ) => DiffResult;
  createInvoice: (
    quoteId: string,
    quoteVersionId: string,
    itemIds?: string[]
  ) => Invoice | null;
  updateInvoiceStatus: (
    invoiceId: string,
    status: InvoiceStatus,
    paidAmount?: number
  ) => void;
  addPaymentEvent: (
    invoiceId: string,
    amount: number,
    date: string,
    status: InvoiceStatus,
    note?: string
  ) => void;
  exportClientData: (clientId: string) => string;
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
}

export const useQuoteStore = create<QuoteState>((set, get) => ({
  quotes: [],
  invoices: [],

  createQuote: (projectId: string, projectName: string) => {
    const quoteId = uuidv4();
    const versionId = uuidv4();
    const now = new Date().toISOString();

    const initialVersion: QuoteVersion = {
      id: versionId,
      version: 1,
      createdAt: now,
      status: 'draft',
      items: [],
      totalAmount: 0,
    };

    const newQuote: Quote = {
      id: quoteId,
      projectId,
      projectName,
      quoteDate: now,
      versions: [initialVersion],
      currentVersionId: versionId,
    };

    set((state) => ({
      quotes: [...state.quotes, newQuote],
    }));

    void get().saveToDB();
    return newQuote;
  },

  saveVersion: (
    quoteId: string,
    items: QuoteItem[],
    status?: QuoteVersionStatus
  ) => {
    const state = get();
    const quote = state.quotes.find((q) => q.id === quoteId);

    if (!quote) {
      return null;
    }

    const currentVersion = quote.versions.find(
      (v) => v.id === quote.currentVersionId
    );
    const nextVersionNumber = currentVersion ? currentVersion.version + 1 : 1;
    const totalAmount = calculateTotalAmount(items);
    const versionId = uuidv4();
    const now = new Date().toISOString();

    const newVersion: QuoteVersion = {
      id: versionId,
      version: nextVersionNumber,
      createdAt: now,
      status: status ?? 'draft',
      items: [...items],
      totalAmount,
    };

    set((state) => ({
      quotes: state.quotes.map((q) => {
        if (q.id === quoteId) {
          return {
            ...q,
            versions: [...q.versions, newVersion],
            currentVersionId: versionId,
          };
        }
        return q;
      }),
    }));

    void get().saveToDB();
    return newVersion;
  },

  getQuoteByProject: (projectId: string) => {
    return get().quotes.find((q) => q.projectId === projectId);
  },

  compareVersions: (
    versionA: QuoteVersion,
    versionB: QuoteVersion
  ): DiffResult => {
    const added: QuoteItem[] = [];
    const removed: QuoteItem[] = [];
    const modified: QuoteItem[] = [];

    const itemsAMap = new Map(versionA.items.map((item) => [item.description, item]));
    const itemsBMap = new Map(versionB.items.map((item) => [item.description, item]));

    for (const item of versionB.items) {
      const itemA = itemsAMap.get(item.description);
      if (!itemA) {
        added.push(item);
      } else if (
        itemA.quantity !== item.quantity ||
        itemA.unitPrice !== item.unitPrice ||
        itemA.taxRate !== item.taxRate
      ) {
        modified.push(item);
      }
    }

    for (const item of versionA.items) {
      if (!itemsBMap.has(item.description)) {
        removed.push(item);
      }
    }

    return { added, removed, modified };
  },

  createInvoice: (
    quoteId: string,
    quoteVersionId: string,
    itemIds?: string[]
  ) => {
    const state = get();
    const quote = state.quotes.find((q) => q.id === quoteId);

    if (!quote) {
      return null;
    }

    const version = quote.versions.find((v) => v.id === quoteVersionId);

    if (!version) {
      return null;
    }

    let selectedItems: QuoteItem[];
    if (itemIds && itemIds.length > 0) {
      selectedItems = version.items.filter((item) => itemIds.includes(item.id));
    } else {
      selectedItems = [...version.items];
    }

    const totalAmount = calculateTotalAmount(selectedItems);
    const invoiceId = uuidv4();
    const now = new Date().toISOString();

    const newInvoice: Invoice = {
      id: invoiceId,
      quoteId,
      quoteVersionId,
      projectId: quote.projectId,
      contractNumber: generateContractNumber(),
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: now,
      items: selectedItems,
      totalAmount,
      paidAmount: 0,
      status: 'unsent',
      paymentEvents: [],
    };

    set((state) => ({
      invoices: [...state.invoices, newInvoice],
    }));

    void get().saveToDB();
    return newInvoice;
  },

  updateInvoiceStatus: (
    invoiceId: string,
    status: InvoiceStatus,
    paidAmount?: number
  ) => {
    set((state) => ({
      invoices: state.invoices.map((invoice) => {
        if (invoice.id === invoiceId) {
          return {
            ...invoice,
            status,
            paidAmount: paidAmount ?? invoice.paidAmount,
          };
        }
        return invoice;
      }),
    }));

    void get().saveToDB();
  },

  addPaymentEvent: (
    invoiceId: string,
    amount: number,
    date: string,
    status: InvoiceStatus,
    note?: string
  ) => {
    const paymentEvent: PaymentEvent = {
      id: uuidv4(),
      invoiceId,
      amount,
      date,
      status,
      note,
    };

    set((state) => {
      const invoices = state.invoices.map((invoice) => {
        if (invoice.id === invoiceId) {
          const newPaidAmount = invoice.paidAmount + amount;
          let newStatus: InvoiceStatus = invoice.status;
          if (newPaidAmount >= invoice.totalAmount) {
            newStatus = 'paid';
          } else if (newPaidAmount > 0) {
            newStatus = 'partial';
          }

          return {
            ...invoice,
            paidAmount: newPaidAmount,
            status: newStatus,
            paymentEvents: [...invoice.paymentEvents, paymentEvent],
          };
        }
        return invoice;
      });

      return { invoices };
    });

    void get().saveToDB();
  },

  exportClientData: (clientId: string): string => {
    const state = get();
    const clientState = useClientStore.getState();
    const client = clientState.clients.find((c) => c.id === clientId);

    if (!client) {
      return JSON.stringify({ client: null, quotes: [], invoices: [] });
    }

    const projectIds = clientState.projects
      .filter((p) => p.clientId === clientId)
      .map((p) => p.id);
    const clientQuotes = state.quotes.filter((q) =>
      projectIds.includes(q.projectId)
    );
    const clientInvoices = state.invoices.filter((i) =>
      projectIds.includes(i.projectId)
    );

    return JSON.stringify(
      {
        client,
        quotes: clientQuotes,
        invoices: clientInvoices,
      },
      null,
      2
    );
  },

  loadFromDB: async () => {
    try {
      const [quotesData, invoicesData] = await Promise.all([
        idbGet(QUOTES_KEY),
        idbGet(INVOICES_KEY),
      ]);

      set({
        quotes: (quotesData as Quote[]) ?? [],
        invoices: (invoicesData as Invoice[]) ?? [],
      });
    } catch (error) {
      console.error('Failed to load quote data from IndexedDB:', error);
    }
  },

  saveToDB: async () => {
    try {
      const state = get();
      await Promise.all([
        idbSet(QUOTES_KEY, state.quotes),
        idbSet(INVOICES_KEY, state.invoices),
      ]);
    } catch (error) {
      console.error('Failed to save quote data to IndexedDB:', error);
    }
  },
}));
