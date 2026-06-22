import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { SimulationEngine } from './simulationEngine.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

const INITIAL_CONTENT = `# React 技术教程

## 1. 组件基础

React 组件是构建用户界面的基本单位。函数组件和类组件是两种主要的定义方式。使用 JSX 语法可以直观地描述 UI 结构，同时通过 Props 实现组件间的数据传递。组件命名采用大驼峰规范，确保与 HTML 元素区分开来。

## 2. 状态管理

useState 是最基础的状态 Hook，用于在函数组件中声明响应式变量。useReducer 适用于复杂状态逻辑，提供类似 Redux 的 dispatch 机制。对于全局状态，可使用 Context API 或第三方库如 Zustand 和 Jotai 进行跨组件共享。

## 3. 副作用处理

useEffect 是处理副作用的核心 Hook，支持数据获取、订阅和 DOM 操作。依赖数组决定了回调的执行时机：空数组表示仅挂载时执行，省略则每次渲染均触发。清理函数在组件卸载或依赖变更前调用，防止内存泄漏。

## 4. 性能优化

React.memo 可避免不必要的重渲染，useMemo 和 useCallback 分别缓存计算结果和函数引用。虚拟列表能有效处理大规模数据渲染。代码分割配合 React.lazy 实现路由级按需加载，显著减小首屏资源体积。

## 5. 路由与导航

React Router 提供声明式路由配置，BrowserRouter 基于 HTML5 History API，HashRouter 使用 URL 哈希。嵌套路由通过 Outlet 组件渲染子匹配项，动态参数以 useParams 获取。导航守卫和懒加载是生产环境的必备策略。

## 6. 表单处理

受控组件通过 state 驱动表单值更新，实现完全的数据流掌控。非受控组件借助 ref 直接访问 DOM 值，适用于简单场景。Formik 与 React Hook Form 简化验证逻辑，配合 Yup 可声明式定义校验规则。

## 7. 测试策略

Jest 提供测试运行器与断言库，React Testing Library 以用户视角渲染组件。快照测试捕获 UI 结构变更，端到端测试借助 Playwright 验证完整流程。测试覆盖率目标应达百分之八十以上。`;

const engine = new SimulationEngine(
  INITIAL_CONTENT,
  (event) => {
    io.emit('edit:event', event);
  },
  (userId, position) => {
    io.emit('cursor:update', { userId, position });
  }
);

app.post('/api/add-user', (_req, res) => {
  const user = engine.addUser();
  if (!user) {
    res.status(400).json({ error: '已达到最大用户数' });
    return;
  }
  io.emit('user:added', user);
  res.json(user);
});

app.post('/api/remove-user/:id', (req, res) => {
  engine.removeUser(req.params.id);
  io.emit('user:removed', req.params.id);
  res.json({ success: true });
});

app.post('/api/start-simulation', (_req, res) => {
  engine.startSimulation();
  io.emit('simulation:started');
  res.json({ success: true });
});

app.post('/api/stop-simulation', (_req, res) => {
  engine.stopSimulation();
  io.emit('simulation:stopped');
  res.json({ success: true });
});

app.post('/api/random-edit', (_req, res) => {
  engine.performSingleEdit();
  res.json({ success: true });
});

app.get('/api/content', (_req, res) => {
  res.json({ content: engine.getContent() });
});

app.get('/api/users', (_req, res) => {
  res.json({ users: engine.getUsers() });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.emit('init', {
    content: engine.getContent(),
    users: engine.getUsers(),
  });

  socket.on('addUser', () => {
    const user = engine.addUser();
    if (user) {
      io.emit('user:added', user);
    }
  });

  socket.on('removeUser', (userId: string) => {
    engine.removeUser(userId);
    io.emit('user:removed', userId);
  });

  socket.on('startSimulation', () => {
    engine.startSimulation();
    io.emit('simulation:started');
  });

  socket.on('stopSimulation', () => {
    engine.stopSimulation();
    io.emit('simulation:stopped');
  });

  socket.on('clearTimeline', () => {
    io.emit('timeline:cleared');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
