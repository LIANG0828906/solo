import express from 'express';
import cors from 'cors';
import invoiceRoutes from './routes/invoices.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/invoices', invoiceRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
