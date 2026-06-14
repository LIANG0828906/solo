const express = require('express');
const cors = require('cors');
const eventsRouter = require('./routes/events');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/events', eventsRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
