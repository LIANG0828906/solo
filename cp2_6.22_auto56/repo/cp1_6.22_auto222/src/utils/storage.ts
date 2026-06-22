export interface PaymentRecord {
  id: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  timestamp: string;
  note?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  projectDescription: string;
  amount: number;
  currency: string;
  invoiceDate: string;
  dueDate: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  paymentHistory: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  name: string;
  totalInvoices: number;
  outstandingAmount: number;
}

const STORAGE_KEY = 'invoice_app_data';

export const getInvoices = (): Invoice[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveInvoices = (invoices: Invoice[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
};

export const addInvoice = (invoice: Invoice): Invoice[] => {
  const invoices = getInvoices();
  invoices.push(invoice);
  saveInvoices(invoices);
  return invoices;
};

export const updateInvoice = (id: string, updates: Partial<Invoice>): Invoice | null => {
  const invoices = getInvoices();
  const index = invoices.findIndex(inv => inv.id === id);
  
  if (index === -1) return null;
  
  invoices[index] = {
    ...invoices[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  saveInvoices(invoices);
  return invoices[index];
};

export const getClients = (invoices: Invoice[]): Client[] => {
  const clientMap = new Map<string, Client>();
  
  invoices.forEach(invoice => {
    const existing = clientMap.get(invoice.clientName) || {
      name: invoice.clientName,
      totalInvoices: 0,
      outstandingAmount: 0
    };
    
    existing.totalInvoices += 1;
    if (invoice.status === 'pending' || invoice.status === 'overdue') {
      existing.outstandingAmount += invoice.amount;
    }
    
    clientMap.set(invoice.clientName, existing);
  });
  
  return Array.from(clientMap.values()).sort((a, b) => b.totalInvoices - a.totalInvoices);
};

export const fetchInvoicesFromAPI = async (): Promise<Invoice[]> => {
  const response = await fetch('/api/invoices');
  if (!response.ok) {
    throw new Error('Failed to fetch invoices');
  }
  return response.json();
};

export const createInvoiceAPI = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'paymentHistory'>): Promise<Invoice> => {
  const response = await fetch('/api/invoice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(invoiceData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create invoice');
  }
  
  return response.json();
};

export const updateInvoiceAPI = async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
  const response = await fetch(`/api/invoice/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update invoice');
  }
  
  return response.json();
};

export const fetchClientsFromAPI = async (): Promise<Client[]> => {
  const response = await fetch('/api/clients');
  if (!response.ok) {
    throw new Error('Failed to fetch clients');
  }
  return response.json();
};
