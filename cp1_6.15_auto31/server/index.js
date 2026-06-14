const express = require('express');
const cors = require('cors');
const projectRoutes = require('./routes/projectRoutes');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api/projects', projectRoutes);
app.use('/downloads', express.static('public/downloads'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Portfolio Generator API is running' });
});

app.listen(PORT, () => {
  console.log(`Portfolio Generator Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
