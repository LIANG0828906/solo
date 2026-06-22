const express = require('express');
const cors = require('cors');
const { materialRouter } = require('./routes/materials.cjs');
const { draftRouter } = require('./routes/drafts.cjs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/materials', materialRouter);
app.use('/api/drafts', draftRouter);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
