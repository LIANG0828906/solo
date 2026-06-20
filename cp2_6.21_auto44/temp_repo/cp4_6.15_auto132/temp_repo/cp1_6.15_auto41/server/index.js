const express = require('express');
const cors = require('cors');
const animalsRouter = require('./routes/animals');
const schedulesRouter = require('./routes/schedules');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/animals', animalsRouter);
app.use('/api/schedules', schedulesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常' });
});

app.listen(PORT, () => {
  console.log(`动物园管理系统后端服务器运行在 http://localhost:${PORT}`);
});
