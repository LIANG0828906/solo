const express = require('express');
const cors = require('cors');
const componentRoutes = require('./routes/components');
const favoritesRoutes = require('./routes/favorites');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/components', componentRoutes);
app.use('/api/favorites', favoritesRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
