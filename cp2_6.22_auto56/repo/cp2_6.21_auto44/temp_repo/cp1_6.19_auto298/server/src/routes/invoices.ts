import { Router, Request, Response } from 'express';

const router = Router();

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'confirmed' | 'overdue';
export type InvoiceTemplate = 'minimal-white' | 'business-blue' | 'warm-tone';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  customerEmail: string;
  items: InvoiceItem[];
  taxRate: number;
  status: InvoiceStatus;
  template: InvoiceTemplate;
  dueDate: string;
  issueDate: string;
  createdAt: string;
  updatedAt: string;
  payments: PaymentRecord[];
  notes?: string;
}

let invoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    customerName: '北京科技有限公司',
    customerAddress: '北京市朝阳区建国路88号',
    customerEmail: 'contact@bjtech.com',
    items: [
      { id: '1', description: '网站设计服务', quantity: 1, unitPrice: 5000 },
      { id: '2', description: '前端开发', quantity: 20, unitPrice: 800 },
    ],
    taxRate: 0.06,
    status: 'confirmed',
    template: 'business-blue',
    dueDate: '2024-01-15',
    issueDate: '2024-01-01',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-05T14:30:00Z',
    payments: [
      { id: '1', amount: 21000, date: '2024-01-05' },
    ],
    notes: '请于截止日前付款',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    customerName: '上海贸易集团',
    customerAddress: '上海市浦东新区陆家嘴环路1000号',
    customerEmail: 'finance@shtrade.com',
    items: [
      { id: '1', description: '咨询服务费', quantity: 10, unitPrice: 1500 },
    ],
    taxRate: 0.06,
    status: 'sent',
    template: 'minimal-white',
    dueDate: '2024-02-01',
    issueDate: '2024-01-15',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
    payments: [],
    notes: '',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    customerName: '深圳创新科技',
    customerAddress: '深圳市南山区科技园路10号',
    customerEmail: 'ap@szinnov.com',
    items: [
      { id: '1', description: '软件定制开发', quantity: 1, unitPrice: 50000 },
      { id: '2', description: '维护服务（年）', quantity: 1, unitPrice: 10000 },
    ],
    taxRate: 0.06,
    status: 'draft',
    template: 'warm-tone',
    dueDate: '2024-02-15',
    issueDate: '2024-01-20',
    createdAt: '2024-01-20T11:00:00Z',
    updatedAt: '2024-01-20T11:00:00Z',
    payments: [],
    notes: '初稿，待确认',
  },
  {
    id: '4',
    invoiceNumber: 'INV-2023-099',
    customerName: '广州物流有限公司',
    customerAddress: '广州市天河区体育西路191号',
    customerEmail: 'account@gzlogistics.com',
    items: [
      { id: '1', description: '系统集成服务', quantity: 1, unitPrice: 30000 },
    ],
    taxRate: 0.06,
    status: 'overdue',
    template: 'business-blue',
    dueDate: '2023-12-01',
    issueDate: '2023-11-15',
    createdAt: '2023-11-15T10:00:00Z',
    updatedAt: '2023-11-15T10:00:00Z',
    payments: [],
    notes: '已逾期，请尽快付款',
  },
  {
    id: '5',
    invoiceNumber: 'INV-2024-004',
    customerName: '杭州电商平台',
    customerAddress: '杭州市西湖区文三路398号',
    customerEmail: 'finance@hzecommerce.com',
    items: [
      { id: '1', description: 'UI/UX 设计', quantity: 15, unitPrice: 1000 },
      { id: '2', description: '品牌设计', quantity: 1, unitPrice: 8000 },
    ],
    taxRate: 0.06,
    status: 'sent',
    template: 'warm-tone',
    dueDate: '2024-02-10',
    issueDate: '2024-01-25',
    createdAt: '2024-01-25T14:00:00Z',
    updatedAt: '2024-01-25T14:00:00Z',
    payments: [
      { id: '1', amount: 10000, date: '2024-01-28' },
    ],
    notes: '',
  },
];

const calculateSubtotal = (items: InvoiceItem[]): number => {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
};

const calculateTax = (items: InvoiceItem[], taxRate: number): number => {
  return calculateSubtotal(items) * taxRate;
};

const calculateTotal = (items: InvoiceItem[], taxRate: number): number => {
  return calculateSubtotal(items) + calculateTax(items, taxRate);
};

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const generateInvoiceNumber = (): string => {
  const year = new Date().getFullYear();
  const count = invoices.filter(i => i.invoiceNumber.includes(String(year))).length + 1;
  return `INV-${year}-${String(count).padStart(3, '0')}`;
};

const checkOverdue = (invoice: Invoice): Invoice => {
  if (invoice.status === 'draft' || invoice.status === 'confirmed') {
    return invoice;
  }
  const dueDate = new Date(invoice.dueDate);
  const now = new Date();
  const diffTime = now.getTime() - dueDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  if (diffDays > 7 && invoice.status !== 'confirmed') {
    return { ...invoice, status: 'overdue' };
  }
  return invoice;
};

router.get('/', (req: Request, res: Response) => {
  const { status } = req.query;
  let result = invoices.map(checkOverdue);
  
  if (status && status !== 'all') {
    result = result.filter(inv => inv.status === status);
  }
  
  result.sort((a, b) => {
    if (a.status === 'overdue' && b.status !== 'overdue') return -1;
    if (a.status !== 'overdue' && b.status === 'overdue') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  res.json(result);
});

router.get('/stats', (req: Request, res: Response) => {
  const updatedInvoices = invoices.map(checkOverdue);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const thisMonthInvoices = updatedInvoices.filter(inv => {
    const d = new Date(inv.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  
  const totalCount = thisMonthInvoices.length;
  
  let totalPaid = 0;
  let totalPending = 0;
  let overdueCount = 0;
  
  updatedInvoices.forEach(inv => {
    const paidAmount = inv.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalAmount = calculateTotal(inv.items, inv.taxRate);
    
    if (inv.status === 'confirmed') {
      totalPaid += totalAmount;
    } else {
      totalPending += totalAmount - paidAmount;
    }
    
    if (inv.status === 'overdue') {
      overdueCount++;
    }
  });
  
  res.json({
    totalCount,
    totalPaid,
    totalPending,
    overdueCount,
  });
});

router.get('/recent', (req: Request, res: Response) => {
  const updatedInvoices = invoices.map(checkOverdue);
  const recent = updatedInvoices
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
  res.json(recent);
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const invoice = invoices.find(inv => inv.id === id);
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  res.json(checkOverdue(invoice));
});

router.post('/', (req: Request, res: Response) => {
  const { customerName, customerAddress, customerEmail, items, taxRate, template, dueDate, notes } = req.body;
  
  const now = new Date().toISOString();
  const newInvoice: Invoice = {
    id: generateId(),
    invoiceNumber: generateInvoiceNumber(),
    customerName,
    customerAddress: customerAddress || '',
    customerEmail: customerEmail || '',
    items: items.map((item: Omit<InvoiceItem, 'id'>) => ({ ...item, id: generateId() })),
    taxRate: taxRate ?? 0.06,
    status: 'draft',
    template: template || 'minimal-white',
    dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    issueDate: new Date().toISOString().split('T')[0],
    createdAt: now,
    updatedAt: now,
    payments: [],
    notes: notes || '',
  };
  
  invoices.unshift(newInvoice);
  res.status(201).json(newInvoice);
});

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = invoices.findIndex(inv => inv.id === id);
  
  if (index === -1) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  
  const updated = {
    ...invoices[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  
  invoices[index] = updated;
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = invoices.findIndex(inv => inv.id === id);
  
  if (index === -1) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  
  invoices.splice(index, 1);
  res.status(204).send();
});

router.post('/:id/send', (req: Request, res: Response) => {
  const { id } = req.params;
  const invoice = invoices.find(inv => inv.id === id);
  
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  
  invoice.status = 'sent';
  invoice.updatedAt = new Date().toISOString();
  
  console.log(`📧 发送发票邮件至: ${invoice.customerEmail}, 发票编号: ${invoice.invoiceNumber}`);
  
  res.json(invoice);
});

router.post('/:id/confirm', (req: Request, res: Response) => {
  const { id } = req.params;
  const invoice = invoices.find(inv => inv.id === id);
  
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  
  invoice.status = 'confirmed';
  invoice.updatedAt = new Date().toISOString();
  
  res.json(invoice);
});

router.post('/:id/payments', (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, date } = req.body;
  const invoice = invoices.find(inv => inv.id === id);
  
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  
  const payment = {
    id: generateId(),
    amount: Number(amount),
    date: date || new Date().toISOString().split('T')[0],
  };
  
  invoice.payments.push(payment);
  invoice.updatedAt = new Date().toISOString();
  
  const totalAmount = calculateTotal(invoice.items, invoice.taxRate);
  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  
  if (totalPaid >= totalAmount && invoice.status !== 'draft') {
    invoice.status = 'confirmed';
  }
  
  res.json(invoice);
});

router.delete('/:id/payments/:paymentId', (req: Request, res: Response) => {
  const { id, paymentId } = req.params;
  const invoice = invoices.find(inv => inv.id === id);
  
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  
  invoice.payments = invoice.payments.filter(p => p.id !== paymentId);
  invoice.updatedAt = new Date().toISOString();
  
  const totalAmount = calculateTotal(invoice.items, invoice.taxRate);
  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  
  if (totalPaid < totalAmount && invoice.status === 'confirmed') {
    invoice.status = 'sent';
  }
  
  res.json(invoice);
});

export default router;
export { calculateSubtotal, calculateTax, calculateTotal };
