const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const entriesRouter = require('./routes/entries');
const archivesRouter = require('./routes/archives');

const app = express();
const PORT = 3001;

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

app.use('/api/entries', entriesRouter);
app.use('/api/archives', archivesRouter);

app.listen(PORT, () => {
  console.log(`Team Weekly Report backend running on http://localhost:${PORT}`);
});

module.exports = app;
