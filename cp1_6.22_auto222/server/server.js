import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let invoices = [];

const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const count = invoices.length + 1;
  return `INV-${year}-${String(count).padStart(4, '0')}`;
};

const getMockInvoices = () => {
  const today = new Date();
  const pastDue = new Date(today);
  pastDue.setDate(today.getDate() - 15);
  
  const dueSoon = new Date(today);
  dueSoon.setDate(today.getDate() + 7);
  
  const paidDate = new Date(today);
  paidDate.setDate(today.getDate() - 30);

  return [
    {
      id: uuidv4(),
      invoiceNumber: generateInvoiceNumber(),
      clientName: '科技创新有限公司',
      clientEmail: 'finance@techcorp.com',
      projectDescription: '企业官网设计与开发',
      amount: 28000,
      currency: 'CNY',
      invoiceDate: paidDate.toISOString().split('T')[0],
      dueDate: dueSoon.toISOString().split('T')[0],
      status: 'pending',
      paymentHistory: [
        {
          id: uuidv4(),
          status: 'pending',
          timestamp: new Date().toISOString(),
          note: '发票已发送'
        }
      ],
      createdAt: paidDate.toISOString(),
      updatedAt: paidDate.toISOString()
    },
    {
      id: uuidv4(),
      invoiceNumber: generateInvoiceNumber(),
      clientName: '创意设计工作室',
      clientEmail: 'accounts@creativestudio.com',
      projectDescription: '品牌Logo设计与VI系统',
      amount: 15000,
      currency: 'CNY',
      invoiceDate: pastDue.toISOString().split('T')[0],
      dueDate: pastDue.toISOString().split('T')[0],
      status: 'overdue',
      paymentHistory: [
        {
          id: uuidv4(),
          status: 'pending',
          timestamp: pastDue.toISOString(),
          note: '发票已发送'
        },
        {
          id: uuidv4(),
          status: 'overdue',
          timestamp: new Date().toISOString(),
          note: '已逾期'
        }
      ],
      createdAt: pastDue.toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      invoiceNumber: generateInvoiceNumber(),
      clientName: '科技创新有限公司',
      clientEmail: 'finance@techcorp.com',
      projectDescription: '移动端App界面设计',
      amount: 35000,
      currency: 'CNY',
      invoiceDate: paidDate.toISOString().split('T')[0],
      dueDate: paidDate.toISOString().split('T')[0],
      status: 'paid',
      paymentHistory: [
        {
          id: uuidv4(),
          status: 'pending',
          timestamp: paidDate.toISOString(),
          note: '发票已发送'
        },
        {
          id: uuidv4(),
          status: 'paid',
          timestamp: new Date(paidDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          note: '款项已到账'
        }
      ],
      createdAt: paidDate.toISOString(),
      updatedAt: new Date(paidDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: uuidv4(),
      invoiceNumber: generateInvoiceNumber(),
      clientName: '数字营销集团',
      clientEmail: 'ap@digitalmarketing.com',
      projectDescription: '季度营销活动页面开发',
      amount: 42000,
      currency: 'CNY',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: dueSoon.toISOString().split('T')[0],
      status: 'draft',
      paymentHistory: [
        {
          id: uuidv4(),
          status: 'draft',
          timestamp: new Date().toISOString(),
          note: '草稿'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      invoiceNumber: generateInvoiceNumber(),
      clientName: '创意设计工作室',
      clientEmail: 'accounts@creativestudio.com',
      projectDescription: '产品包装设计',
      amount: 8500,
      currency: 'CNY',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: dueSoon.toISOString().split('T')[0],
      status: 'pending',
      paymentHistory: [
        {
          id: uuidv4(),
          status: 'pending',
          timestamp: new Date().toISOString(),
          note: '发票已发送'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      invoiceNumber: generateInvoiceNumber(),
      clientName: '智慧教育科技',
      clientEmail: 'payment@edutech.com',
      projectDescription: '在线课程平台开发',
      amount: 68000,
      currency: 'CNY',
      invoiceDate: pastDue.toISOString().split('T')[0],
      dueDate: pastDue.toISOString().split('T')[0],
      status: 'overdue',
      paymentHistory: [
        {
          id: uuidv4(),
          status: 'pending',
          timestamp: pastDue.toISOString(),
          note: '发票已发送'
        },
        {
          id: uuidv4(),
          status: 'overdue',
          timestamp: new Date().toISOString(),
          note: '已逾期'
        }
      ],
      createdAt: pastDue.toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
};

invoices = getMockInvoices();

app.get('/api/invoices', (_req, res) => {
  res.json(invoices);
});

app.post('/api/invoice', (req, res) => {
  const newInvoice = {
    ...req.body,
    id: uuidv4(),
    invoiceNumber: generateInvoiceNumber(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    paymentHistory: [
      {
        id: uuidv4(),
        status: req.body.status || 'draft',
        timestamp: new Date().toISOString(),
        note: req.body.status === 'draft' ? '草稿' : '发票已发送'
      }
    ]
  };
  invoices.push(newInvoice);
  res.status(201).json(newInvoice);
});

app.put('/api/invoice/:id', (req, res) => {
  const { id } = req.params;
  const index = invoices.findIndex(inv => inv.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  invoices[index] = {
    ...invoices[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  res.json(invoices[index]);
});

app.get('/api/clients', (_req, res) => {
  const clientMap = new Map();
  
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
  
  const clients = Array.from(clientMap.values()).sort((a, b) => b.totalInvoices - a.totalInvoices);
  res.json(clients);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
