const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const buildingTemplates = [
  {
    id: 'residential',
    name: '住宅',
    defaultHeight: 30,
    color: '#4CAF50',
    type: 'residential'
  },
  {
    id: 'office',
    name: '办公',
    defaultHeight: 50,
    color: '#2196F3',
    type: 'office'
  },
  {
    id: 'commercial',
    name: '商业',
    defaultHeight: 25,
    color: '#FF9800',
    type: 'commercial'
  },
  {
    id: 'hotel',
    name: '酒店',
    defaultHeight: 45,
    color: '#9C27B0',
    type: 'hotel'
  }
];

app.get('/api/buildings', (req, res) => {
  res.json(buildingTemplates);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
