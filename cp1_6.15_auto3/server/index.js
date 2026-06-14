const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const contractRoutes = require('./routes/contractRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', contractRoutes);

app.listen(PORT, () => {
  console.log(`Contract Approval Server is running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

module.exports = app;
