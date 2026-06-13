import express from 'express';
import componentRoutes from './componentRoutes';

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', componentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Landing Page Builder API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api`);
});

export default app;
