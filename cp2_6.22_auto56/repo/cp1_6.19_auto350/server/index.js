const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const DATA_DIR = path.join(__dirname, 'data');
const SCHEMES_FILE = path.join(DATA_DIR, 'schemes.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function readSchemes() {
  if (!fs.existsSync(SCHEMES_FILE)) {
    fs.writeFileSync(SCHEMES_FILE, JSON.stringify([]));
    return [];
  }
  try {
    const data = fs.readFileSync(SCHEMES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeSchemes(schemes) {
  fs.writeFileSync(SCHEMES_FILE, JSON.stringify(schemes, null, 2));
}

app.get('/api/schemes', (req, res) => {
  const schemes = readSchemes();
  res.json(schemes);
});

app.post('/api/schemes', (req, res) => {
  const schemes = readSchemes();
  const newScheme = {
    ...req.body,
    id: Date.now().toString(),
    createdAt: Date.now()
  };
  schemes.push(newScheme);
  writeSchemes(schemes);
  io.emit('scheme:broadcast', newScheme);
  res.status(201).json(newScheme);
});

app.put('/api/schemes/:id', (req, res) => {
  const schemes = readSchemes();
  const index = schemes.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Scheme not found' });
  }
  const updatedScheme = {
    ...schemes[index],
    ...req.body,
    id: req.params.id
  };
  schemes[index] = updatedScheme;
  writeSchemes(schemes);
  io.emit('scheme:broadcast', updatedScheme);
  res.json(updatedScheme);
});

app.delete('/api/schemes/:id', (req, res) => {
  const schemes = readSchemes();
  const index = schemes.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Scheme not found' });
  }
  const deleted = schemes.splice(index, 1)[0];
  writeSchemes(schemes);
  io.emit('scheme:delete', { id: req.params.id });
  res.json(deleted);
});

io.on('connection', (socket) => {
  socket.emit('scheme:list', readSchemes());

  socket.on('scheme:list', () => {
    socket.emit('scheme:list', readSchemes());
  });

  socket.on('scheme:save', (scheme) => {
    const schemes = readSchemes();
    const newScheme = {
      ...scheme,
      id: Date.now().toString(),
      createdAt: Date.now()
    };
    schemes.push(newScheme);
    writeSchemes(schemes);
    io.emit('scheme:broadcast', newScheme);
    socket.emit('scheme:saved', newScheme);
  });

  socket.on('scheme:update', (scheme) => {
    const schemes = readSchemes();
    const index = schemes.findIndex(s => s.id === scheme.id);
    if (index !== -1) {
      schemes[index] = scheme;
      writeSchemes(schemes);
      io.emit('scheme:broadcast', scheme);
    }
  });

  socket.on('scheme:delete', ({ id }) => {
    const schemes = readSchemes();
    const index = schemes.findIndex(s => s.id === id);
    if (index !== -1) {
      schemes.splice(index, 1);
      writeSchemes(schemes);
      io.emit('scheme:delete', { id });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
