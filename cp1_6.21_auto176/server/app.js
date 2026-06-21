const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const contentRoutes = require('./routes/contentRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

const app = express();
const PORT = 4000;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.use('/api/content', contentRoutes);
app.use('/api/materials', contentRoutes);
app.use('/api/calendar', calendarRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
