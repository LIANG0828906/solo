import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

const rooms = new Map();

const getOrCreateRoom = (roomId) => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      tasks: new Map(),
      dependencies: new Map(),
      users: new Set()
    });
  }
  return rooms.get(roomId);
};

const COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'
];

const ASSIGNEES = ['张三', '李四', '王五', '赵六', '钱七', '孙八'];

const initializeDemoData = (room) => {
  if (room.tasks.size > 0) return;
  
  const today = new Date();
  const formatDate = (date) => date.toISOString().split('T')[0];
  
  const demoTasks = [
    {
      id: uuidv4(),
      name: '项目启动会议',
      assignee: '张三',
      startDate: formatDate(today),
      endDate: formatDate(new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000)),
      progress: 100,
      status: 'completed',
      dependencies: [],
      color: COLORS[0]
    },
    {
      id: uuidv4(),
      name: '需求分析与设计',
      assignee: '李四',
      startDate: formatDate(new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000)),
      endDate: formatDate(new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000)),
      progress: 60,
      status: 'in-progress',
      dependencies: [],
      color: COLORS[1]
    },
    {
      id: uuidv4(),
      name: '数据库设计',
      assignee: '王五',
      startDate: formatDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)),
      endDate: formatDate(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)),
      progress: 30,
      status: 'in-progress',
      dependencies: [],
      color: COLORS[2]
    },
    {
      id: uuidv4(),
      name: '前端开发',
      assignee: '赵六',
      startDate: formatDate(new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000)),
      endDate: formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)),
      progress: 15,
      status: 'in-progress',
      dependencies: [],
      color: COLORS[3]
    },
    {
      id: uuidv4(),
      name: '后端API开发',
      assignee: '钱七',
      startDate: formatDate(new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000)),
      endDate: formatDate(new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000)),
      progress: 25,
      status: 'in-progress',
      dependencies: [],
      color: COLORS[4]
    },
    {
      id: uuidv4(),
      name: '测试与部署',
      assignee: '孙八',
      startDate: formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)),
      endDate: formatDate(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)),
      progress: 0,
      status: 'pending',
      dependencies: [],
      color: COLORS[5]
    }
  ];
  
  demoTasks.forEach(task => {
    room.tasks.set(task.id, task);
  });
  
  const demoDependencies = [
    { id: uuidv4(), fromTaskId: demoTasks[0].id, toTaskId: demoTasks[1].id },
    { id: uuidv4(), fromTaskId: demoTasks[1].id, toTaskId: demoTasks[3].id },
    { id: uuidv4(), fromTaskId: demoTasks[2].id, toTaskId: demoTasks[4].id },
    { id: uuidv4(), fromTaskId: demoTasks[3].id, toTaskId: demoTasks[5].id },
    { id: uuidv4(), fromTaskId: demoTasks[4].id, toTaskId: demoTasks[5].id }
  ];
  
  demoDependencies.forEach(dep => {
    room.dependencies.set(dep.id, dep);
    const toTask = room.tasks.get(dep.toTaskId);
    if (toTask && !toTask.dependencies.includes(dep.fromTaskId)) {
      toTask.dependencies.push(dep.fromTaskId);
    }
  });
};

const calculateTaskStatus = (task, room) => {
  if (task.progress >= 100) return 'completed';
  if (task.progress > 0) return 'in-progress';
  
  const hasIncompleteDependency = task.dependencies.some(depId => {
    const depTask = room.tasks.get(depId);
    return depTask && depTask.progress < 100;
  });
  
  if (hasIncompleteDependency) return 'warning';
  return 'pending';
};

const updateDependentTasksStatus = (room, io, roomId) => {
  room.tasks.forEach(task => {
    const newStatus = calculateTaskStatus(task, room);
    if (task.status !== newStatus) {
      task.status = newStatus;
      io.to(roomId).emit('broadcast-task-updated', { ...task });
    }
  });
};

app.get('/api/tasks/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = getOrCreateRoom(roomId);
  initializeDemoData(room);
  const tasks = Array.from(room.tasks.values());
  const dependencies = Array.from(room.dependencies.values());
  res.json({ tasks, dependencies });
});

app.post('/api/tasks/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = getOrCreateRoom(roomId);
  
  const taskData = req.body;
  const newTask = {
    id: uuidv4(),
    name: taskData.name || '新任务',
    assignee: taskData.assignee || ASSIGNEES[0],
    startDate: taskData.startDate || new Date().toISOString().split('T')[0],
    endDate: taskData.endDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    progress: taskData.progress || 0,
    status: 'pending',
    dependencies: taskData.dependencies || [],
    color: taskData.color || COLORS[Math.floor(Math.random() * COLORS.length)]
  };
  
  room.tasks.set(newTask.id, newTask);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:roomId/:taskId', (req, res) => {
  const { roomId, taskId } = req.params;
  const room = getOrCreateRoom(roomId);
  
  if (!room.tasks.has(taskId)) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  const existingTask = room.tasks.get(taskId);
  const updatedTask = {
    ...existingTask,
    ...req.body,
    id: taskId
  };
  
  updatedTask.status = calculateTaskStatus(updatedTask, room);
  room.tasks.set(taskId, updatedTask);
  
  updateDependentTasksStatus(room, io, roomId);
  
  res.json(updatedTask);
});

app.delete('/api/tasks/:roomId/:taskId', (req, res) => {
  const { roomId, taskId } = req.params;
  const room = getOrCreateRoom(roomId);
  
  if (!room.tasks.has(taskId)) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  room.tasks.delete(taskId);
  
  room.dependencies.forEach((dep, depId) => {
    if (dep.fromTaskId === taskId || dep.toTaskId === taskId) {
      room.dependencies.delete(depId);
      io.to(roomId).emit('broadcast-dependency-deleted', { id: depId });
    }
  });
  
  room.tasks.forEach(task => {
    if (task.dependencies.includes(taskId)) {
      task.dependencies = task.dependencies.filter(d => d !== taskId);
      task.status = calculateTaskStatus(task, room);
      io.to(roomId).emit('broadcast-task-updated', { ...task });
    }
  });
  
  res.json({ success: true });
});

io.on('connection', (socket) => {
  console.log('客户端连接:', socket.id);
  
  socket.on('join-room', ({ roomId }) => {
    socket.join(roomId);
    const room = getOrCreateRoom(roomId);
    room.users.add(socket.id);
    initializeDemoData(room);
    
    console.log(`客户端 ${socket.id} 加入房间 ${roomId}`);
    
    const tasks = Array.from(room.tasks.values());
    const dependencies = Array.from(room.dependencies.values());
    socket.emit('sync-tasks', { tasks, dependencies });
  });
  
  socket.on('task-created', ({ roomId, task }) => {
    const room = getOrCreateRoom(roomId);
    const newTask = {
      ...task,
      id: uuidv4(),
      status: calculateTaskStatus(task, room)
    };
    
    room.tasks.set(newTask.id, newTask);
    io.to(roomId).emit('broadcast-task-created', newTask);
    updateDependentTasksStatus(room, io, roomId);
  });
  
  socket.on('task-updated', ({ roomId, task }) => {
    const room = getOrCreateRoom(roomId);
    
    if (!room.tasks.has(task.id)) return;
    
    const existingTask = room.tasks.get(task.id);
    const updatedTask = {
      ...existingTask,
      ...task,
      status: calculateTaskStatus(task, room)
    };
    
    room.tasks.set(task.id, updatedTask);
    socket.to(roomId).emit('broadcast-task-updated', updatedTask);
    updateDependentTasksStatus(room, io, roomId);
  });
  
  socket.on('task-deleted', ({ roomId, id }) => {
    const room = getOrCreateRoom(roomId);
    
    if (!room.tasks.has(id)) return;
    
    room.tasks.delete(id);
    
    room.dependencies.forEach((dep, depId) => {
      if (dep.fromTaskId === id || dep.toTaskId === id) {
        room.dependencies.delete(depId);
        io.to(roomId).emit('broadcast-dependency-deleted', { id: depId });
      }
    });
    
    room.tasks.forEach(task => {
      if (task.dependencies.includes(id)) {
        task.dependencies = task.dependencies.filter(d => d !== id);
        task.status = calculateTaskStatus(task, room);
        io.to(roomId).emit('broadcast-task-updated', { ...task });
      }
    });
    
    io.to(roomId).emit('broadcast-task-deleted', { id });
  });
  
  socket.on('dependency-created', ({ roomId, dependency }) => {
    const room = getOrCreateRoom(roomId);
    
    const newDep = {
      ...dependency,
      id: uuidv4()
    };
    
    const exists = Array.from(room.dependencies.values()).some(
      d => d.fromTaskId === newDep.fromTaskId && d.toTaskId === newDep.toTaskId
    );
    
    if (exists) return;
    
    room.dependencies.set(newDep.id, newDep);
    
    const toTask = room.tasks.get(newDep.toTaskId);
    if (toTask && !toTask.dependencies.includes(newDep.fromTaskId)) {
      toTask.dependencies.push(newDep.fromTaskId);
      toTask.status = calculateTaskStatus(toTask, room);
      io.to(roomId).emit('broadcast-task-updated', { ...toTask });
    }
    
    io.to(roomId).emit('broadcast-dependency-created', newDep);
  });
  
  socket.on('dependency-deleted', ({ roomId, id }) => {
    const room = getOrCreateRoom(roomId);
    
    const dep = room.dependencies.get(id);
    if (!dep) return;
    
    room.dependencies.delete(id);
    
    const toTask = room.tasks.get(dep.toTaskId);
    if (toTask) {
      toTask.dependencies = toTask.dependencies.filter(d => d !== dep.fromTaskId);
      toTask.status = calculateTaskStatus(toTask, room);
      io.to(roomId).emit('broadcast-task-updated', { ...toTask });
    }
    
    io.to(roomId).emit('broadcast-dependency-deleted', { id });
  });
  
  socket.on('disconnect', () => {
    console.log('客户端断开连接:', socket.id);
    rooms.forEach((room) => {
      room.users.delete(socket.id);
    });
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
