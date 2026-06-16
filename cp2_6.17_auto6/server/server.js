import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

const USER_COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12'];
const USER_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana'];

let documentContent = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function sum(arr) {
  return arr.reduce((acc, val) => acc + val, 0);
}

function max(arr) {
  return Math.max(...arr);
}

console.log(fibonacci(10));
console.log(factorial(5));
console.log(sum([1, 2, 3, 4, 5]));
console.log(max([3, 1, 4, 1, 5, 9]));
`;

let revision = 0;
const operationHistory = [];
const connectedUsers = new Map();

function transformOperation(op1, op2) {
  if (op1.type === 'insert' && op2.type === 'insert') {
    if (op1.position < op2.position || (op1.position === op2.position && op1.userId < op2.userId)) {
      return { ...op1 };
    }
    return { ...op1, position: op1.position + (op2.text?.length || 0) };
  }
  if (op1.type === 'insert' && op2.type === 'delete') {
    if (op1.position <= op2.position) return { ...op1 };
    if (op1.position >= op2.position + op2.length) {
      return { ...op1, position: op1.position - op2.length };
    }
    return { ...op1, position: op2.position };
  }
  if (op1.type === 'delete' && op2.type === 'insert') {
    if (op2.position >= op1.position + op1.length) return { ...op1 };
    if (op2.position <= op1.position) {
      return { ...op1, position: op1.position + (op2.text?.length || 0) };
    }
    const overlap = op2.position - op1.position;
    return { ...op1, length: op1.length + (op2.text?.length || 0), position: op1.position };
  }
  if (op1.type === 'delete' && op2.type === 'delete') {
    if (op1.position >= op2.position + op2.length) {
      return { ...op1, position: op1.position - op2.length };
    }
    if (op2.position >= op1.position + op1.length) {
      return { ...op1 };
    }
    const start = Math.max(op1.position, op2.position);
    const end = Math.min(op1.position + op1.length, op2.position + op2.length);
    const overlapLen = Math.max(0, end - start);
    if (op2.position <= op1.position && op2.position + op2.length >= op1.position + op1.length) {
      return { ...op1, length: 0 };
    }
    if (op2.position <= op1.position) {
      return { ...op1, position: op2.position, length: op1.length - overlapLen };
    }
    return { ...op1, length: op1.length - overlapLen };
  }
  return { ...op1 };
}

function applyOperation(doc, op) {
  if (op.type === 'insert') {
    return doc.slice(0, op.position) + (op.text || '') + doc.slice(op.position);
  }
  if (op.type === 'delete') {
    if (op.length <= 0) return doc;
    return doc.slice(0, op.position) + doc.slice(op.position + op.length);
  }
  return doc;
}

io.on('connection', (socket) => {
  const userCount = connectedUsers.size;
  if (userCount >= 4) {
    socket.emit('room-full');
    socket.disconnect();
    return;
  }

  const colorIndex = userCount % USER_COLORS.length;
  const user = {
    id: socket.id,
    name: USER_NAMES[colorIndex],
    color: USER_COLORS[colorIndex],
  };
  connectedUsers.set(socket.id, user);

  socket.emit('init', {
    document: documentContent,
    revision,
    user,
    onlineUsers: Array.from(connectedUsers.values()),
  });

  socket.broadcast.emit('user-joined', user);

  socket.on('operation', (data) => {
    let op = data.operation;
    let currentRevision = data.revision;

    while (currentRevision < revision) {
      const historyOp = operationHistory[currentRevision];
      if (historyOp) {
        op = transformOperation(op, historyOp);
      }
      currentRevision++;
    }

    documentContent = applyOperation(documentContent, op);
    op.revision = revision;
    operationHistory[revision] = op;
    revision++;

    socket.emit('operation-ack', { revision, operation: op });
    socket.broadcast.emit('remote-operation', { operation: op, userId: socket.id });
  });

  socket.on('cursor-move', (data) => {
    socket.broadcast.emit('remote-cursor', {
      userId: socket.id,
      position: data.position,
      lineNumber: data.lineNumber,
    });
  });

  socket.on('comment-add', (data) => {
    io.emit('comment-broadcast', data);
  });

  socket.on('comment-reply', (data) => {
    io.emit('comment-reply-broadcast', data);
  });

  socket.on('version-save', (data) => {
    io.emit('version-broadcast', data);
  });

  socket.on('disconnect', () => {
    const disconnectedUser = connectedUsers.get(socket.id);
    connectedUsers.delete(socket.id);
    setTimeout(() => {
      io.emit('user-left', { id: socket.id });
    }, 3000);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`CodeCollab server running on port ${PORT}`);
});
