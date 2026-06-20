import { Kitchen } from './kitchen';
import { Renderer } from './renderer';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let lastTime: number = 0;
let frameCount: number = 0;
let fpsTime: number = 0;

function initWebSocket(): Socket | null {
  try {
    const ws = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    ws.on('connect', () => {
      console.log('已连接到御膳房服务器');
    });

    ws.on('disconnect', () => {
      console.log('与御膳房服务器断开连接');
    });

    ws.on('welcome', (data: { playerId: string; message: string }) => {
      console.log(data.message, '玩家ID:', data.playerId);
    });

    ws.on('scoreUpdate', (data: { playerId: string; dish: string; score: number; totalScore: number }) => {
      console.log(`玩家 ${data.playerId.slice(0, 6)}... 完成了 ${data.dish}，得分 ${data.score}，总分 ${data.totalScore}`);
    });

    return ws;
  } catch (e) {
    console.warn('WebSocket 初始化失败，游戏将以单机模式运行');
    return null;
  }
}

function gameLoop(
  kitchen: Kitchen,
  renderer: Renderer,
  currentTime: number
) {
  if (!lastTime) {
    lastTime = currentTime;
    fpsTime = currentTime;
  }

  const deltaTime = Math.min(currentTime - lastTime, 50);
  lastTime = currentTime;

  frameCount++;
  if (currentTime - fpsTime >= 1000) {
    fpsTime = currentTime;
    frameCount = 0;
  }

  kitchen.update(currentTime, deltaTime);
  renderer.render(currentTime);

  requestAnimationFrame((t) => gameLoop(kitchen, renderer, t));
}

function init() {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('找不到游戏画布元素');
    return;
  }

  const kitchen = new Kitchen(canvas);
  const renderer = new Renderer(kitchen);
  
  socket = initWebSocket();

  console.log('御膳房模拟器启动完毕');
  console.log('操作说明：');
  console.log('  - 从左侧备料台拖拽食材到炉灶开始烹饪');
  console.log('  - 点击炉灶显示火力调节按钮（文/中/武火）');
  console.log('  - 火力越强，烹饪越快，需要把握好时间');
  console.log('  - 连续三道菜品得分超过80分可触发御膳连击！');

  requestAnimationFrame((t) => gameLoop(kitchen, renderer, t));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
