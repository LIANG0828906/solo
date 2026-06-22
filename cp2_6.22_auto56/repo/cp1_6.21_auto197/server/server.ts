import express from 'express';
import cors from 'cors';
import sizeChartRoutes from './routes/sizeChartRoutes';
import productRoutes from './routes/productRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/sizecharts', sizeChartRoutes);
app.use('/api/products', productRoutes);

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
