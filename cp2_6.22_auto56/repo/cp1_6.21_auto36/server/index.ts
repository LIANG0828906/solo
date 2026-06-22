import express from 'express';
import cors from 'cors';
import recipeRouter from './recipeAPI';
import inventoryRouter from './inventoryAPI';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/recipes', recipeRouter);
app.use('/api/inventory', inventoryRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
