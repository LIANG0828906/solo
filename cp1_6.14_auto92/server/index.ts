import express, { Request, Response } from 'express';
import cors from 'cors';
import { initDb } from './db/index.js';
import { customerService } from './services/CustomerService.js';
import { receiptService } from './services/ReceiptService.js';
import { statementService } from './services/StatementService.js';
import { dashboardService } from './services/DashboardService.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ success: true });
});

app.get('/api/customers', async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const customers = await customerService.searchCustomers(search);
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/customers', async (req: Request, res: Response) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/customers/:id', async (req: Request, res: Response) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.put('/api/customers/:id', async (req: Request, res: Response) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.delete('/api/customers/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await customerService.deleteCustomer(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/receipts', async (req: Request, res: Response) => {
  try {
    const query = {
      customerId: typeof req.query.customerId === 'string' ? req.query.customerId : undefined,
      status: typeof req.query.status === 'string' ? req.query.status as any : undefined,
      startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
      endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
    };
    const result = await receiptService.getReceipts(query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/receipts', async (req: Request, res: Response) => {
  try {
    const receipt = await receiptService.createReceipt(req.body);
    res.json({ success: true, data: receipt });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/receipts/:id', async (req: Request, res: Response) => {
  try {
    const receipt = await receiptService.getReceiptById(req.params.id);
    if (!receipt) {
      res.status(404).json({ success: false, error: 'Receipt not found' });
      return;
    }
    res.json({ success: true, data: receipt });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.put('/api/receipts/:id', async (req: Request, res: Response) => {
  try {
    const receipt = await receiptService.updateReceipt(req.params.id, req.body);
    if (!receipt) {
      res.status(404).json({ success: false, error: 'Receipt not found' });
      return;
    }
    res.json({ success: true, data: receipt });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.patch('/api/receipts/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, paymentInfo } = req.body;
    const receipt = await receiptService.updateStatus(req.params.id, status, paymentInfo);
    if (!receipt) {
      res.status(404).json({ success: false, error: 'Receipt not found' });
      return;
    }
    res.json({ success: true, data: receipt });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.delete('/api/receipts/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await receiptService.deleteReceipt(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Receipt not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/statements', async (req: Request, res: Response) => {
  try {
    const { customerId, startDate, endDate } = req.body;
    const statement = await statementService.generateStatement({ customerId, startDate, endDate });
    res.json({ success: true, data: statement });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/dashboard/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

async function startServer() {
  try {
    await initDb();
    console.log('Database initialized successfully');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
