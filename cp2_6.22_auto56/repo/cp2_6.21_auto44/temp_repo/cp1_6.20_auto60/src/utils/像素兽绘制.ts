import { 种族类型 } from '../data/初始数据';

export interface 绘制参数 {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  size: number;
  种族: 种族类型;
  进化阶段: number;
  配色: { 主色: string; 副色: string; 强调色: string };
  动画帧?: number;
  动画状态?: 'idle' | 'hurt' | 'attack' | 'happy' | 'defeated';
}

export function 绘制像素兽(参数: 绘制参数) {
  const { ctx, x, y, size, 种族, 进化阶段, 配色, 动画帧 = 0, 动画状态 = 'idle' } = 参数;
  
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const 缩放 = size / 100;
  let offsetY = 0;
  let scaleX = 1;
  let scaleY = 1;

  if (动画状态 === 'idle') {
    offsetY = Math.sin(动画帧 * 0.08) * 3;
  } else if (动画状态 === 'hurt') {
    offsetY = Math.sin(动画帧 * 0.5) * 2;
    scaleX = 0.95 - Math.abs(Math.sin(动画帧 * 0.3)) * 0.1;
    scaleY = 0.95 - Math.abs(Math.sin(动画帧 * 0.3)) * 0.1;
  } else if (动画状态 === 'attack') {
    scaleX = 1.1;
    scaleY = 1.1;
  } else if (动画状态 === 'happy') {
    offsetY = -Math.abs(Math.sin(动画帧 * 0.2)) * 10;
  } else if (动画状态 === 'defeated') {
    scaleY = 0.6;
    offsetY = 10;
  }

  ctx.translate(x, y + offsetY);
  ctx.scale(缩放 * scaleX, 缩放 * scaleY);
  ctx.translate(-50, -50);

  if (动画状态 === 'defeated') {
    ctx.globalAlpha = 0.5;
    ctx.filter = 'grayscale(100%)';
  }

  if (种族 === 'dragon') {
    绘制龙(ctx, 进化阶段, 配色, 动画帧, 动画状态);
  } else if (种族 === 'cat') {
    绘制猫(ctx, 进化阶段, 配色, 动画帧, 动画状态);
  } else if (种族 === 'bird') {
    绘制鸟(ctx, 进化阶段, 配色, 动画帧, 动画状态);
  }

  ctx.restore();
}

function 画像素点(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function 绘制龙(ctx: CanvasRenderingContext2D, 进化阶段: number, 配色: { 主色: string; 副色: string; 强调色: string }, 动画帧: number, 动画状态: string) {
  const 眨眼 = Math.floor(动画帧 / 100) % 15 === 0 && (动画帧 % 100) < 10;
  
  const 尺寸倍数 = 1 + 进化阶段 * 0.2;
  const 基础偏移 = 进化阶段 * 5;

  if (进化阶段 >= 1) {
    画像素点(ctx, 15 - 基础偏移, 25, 10, 20, 配色.副色);
    画像素点(ctx, 75 + 基础偏移, 25, 10, 20, 配色.副色);
    for (let i = 0; i < 4; i++) {
      画像素点(ctx, 12 - 基础偏移, 22 + i * 5, 16, 2, 配色.主色);
      画像素点(ctx, 72 + 基础偏移, 22 + i * 5, 16, 2, 配色.主色);
    }
  }

  画像素点(ctx, 30, 55 - 基础偏移, 40, 35 + 基础偏移, 配色.主色);
  画像素点(ctx, 35, 60 - 基础偏移, 30, 25 + 基础偏移, 配色.主色);
  画像素点(ctx, 40, 80, 20, 10, 配色.副色);
  
  画像素点(ctx, 28, 15 - 基础偏移, 44, 40, 配色.主色);
  画像素点(ctx, 30, 18 - 基础偏移, 40, 35, 配色.主色);
  
  if (进化阶段 >= 0) {
    画像素点(ctx, 30, 10 - 基础偏移, 6, 12, 配色.强调色);
    画像素点(ctx, 64, 10 - 基础偏移, 6, 12, 配色.强调色);
    画像素点(ctx, 28, 6 - 基础偏移, 4, 8, 配色.强调色);
    画像素点(ctx, 68, 6 - 基础偏移, 4, 8, 配色.强调色);
  }

  if (进化阶段 >= 2) {
    画像素点(ctx, 25, 20 - 基础偏移, 3, 15, 配色.强调色);
    画像素点(ctx, 72, 20 - 基础偏移, 3, 15, 配色.强调色);
  }

  画像素点(ctx, 40, 38, 6, 3, '#fca5a5');
  画像素点(ctx, 54, 38, 6, 3, '#fca5a5');
  
  if (!眨眼) {
    画像素点(ctx, 38, 28, 8, 8, '#ffffff');
    画像素点(ctx, 54, 28, 8, 8, '#ffffff');
    画像素点(ctx, 40, 30, 4, 5, '#1a1a1a');
    画像素点(ctx, 56, 30, 4, 5, '#1a1a1a');
  } else {
    画像素点(ctx, 38, 32, 8, 2, '#1a1a1a');
    画像素点(ctx, 54, 32, 8, 2, '#1a1a1a');
  }

  画像素点(ctx, 42, 45, 16, 4, 配色.副色);
  画像素点(ctx, 46, 42, 8, 4, 配色.强调色);

  if (动画状态 === 'attack') {
    画像素点(ctx, 15, 40, 15, 8, '#f97316');
    画像素点(ctx, 10, 38, 8, 12, '#fbbf24');
    画像素点(ctx, 5, 36, 8, 16, '#ef4444');
  }

  画像素点(ctx, 32, 88 - 基础偏移, 10, 12 + 基础偏移, 配色.副色);
  画像素点(ctx, 58, 88 - 基础偏移, 10, 12 + 基础偏移, 配色.副色);
}

function 绘制猫(ctx: CanvasRenderingContext2D, 进化阶段: number, 配色: { 主色: string; 副色: string; 强调色: string }, 动画帧: number, 动画状态: string) {
  const 眨眼 = Math.floor(动画帧 / 80) % 12 === 0 && (动画帧 % 80) < 8;
  const 尺寸倍数 = 1 + 进化阶段 * 0.2;
  const 基础偏移 = 进化阶段 * 3;

  画像素点(ctx, 25, 25, 50, 25, 配色.主色);
  画像素点(ctx, 22, 30, 6, 8, 配色.主色);
  画像素点(ctx, 72, 30, 6, 8, 配色.主色);
  
  画像素点(ctx, 20, 28, 10, 12, 配色.主色);
  画像素点(ctx, 70, 28, 10, 12, 配色.主色);
  画像素点(ctx, 24, 32, 6, 8, 配色.强调色);
  画像素点(ctx, 70, 32, 6, 8, 配色.强调色);

  if (进化阶段 >= 1) {
    画像素点(ctx, 18, 22, 4, 10, 配色.强调色);
    画像素点(ctx, 78, 22, 4, 10, 配色.强调色);
  }

  画像素点(ctx, 30, 48, 40, 35, 配色.主色);
  画像素点(ctx, 35, 50, 30, 30, 配色.主色);
  画像素点(ctx, 38, 78, 24, 8, 配色.副色);

  if (!眨眼) {
    画像素点(ctx, 32, 35, 10, 10, '#ffffff');
    画像素点(ctx, 58, 35, 10, 10, '#ffffff');
    画像素点(ctx, 35, 37, 5, 7, 配色.强调色);
    画像素点(ctx, 61, 37, 5, 7, 配色.强调色);
    画像素点(ctx, 36, 39, 2, 3, '#ffffff');
    画像素点(ctx, 62, 39, 2, 3, '#ffffff');
  } else {
    画像素点(ctx, 32, 40, 10, 2, '#1a1a1a');
    画像素点(ctx, 58, 40, 10, 2, '#1a1a1a');
  }

  画像素点(ctx, 46, 45, 8, 5, '#f9a8d4');
  画像素点(ctx, 40, 50, 20, 2, 配色.副色);
  画像素点(ctx, 48, 52, 4, 4, 配色.副色);

  画像素点(ctx, 28, 44, 8, 2, 配色.副色);
  画像素点(ctx, 64, 44, 8, 2, 配色.副色);
  画像素点(ctx, 26, 47, 10, 2, 配色.副色);
  画像素点(ctx, 64, 47, 10, 2, 配色.副色);

  if (动画状态 === 'attack') {
    画像素点(ctx, 80, 45, 10, 4, 配色.强调色);
    画像素点(ctx, 85, 40, 8, 14, 配色.强调色);
    for (let i = 0; i < 4; i++) {
      画像素点(ctx, 82 + Math.random() * 10, 38 + Math.random() * 18, 3, 3, '#fde047');
    }
  }

  画像素点(ctx, 30, 80, 10, 12 + 基础偏移, 配色.主色);
  画像素点(ctx, 60, 80, 10, 12 + 基础偏移, 配色.主色);

  if (进化阶段 >= 2) {
    const 尾巴摇摆 = Math.sin(动画帧 * 0.15) * 5;
    画像素点(ctx, 75 + 尾巴摇摆, 55, 15, 6, 配色.主色);
    画像素点(ctx, 85 + 尾巴摇摆, 50, 8, 6, 配色.强调色);
  }
}

function 绘制鸟(ctx: CanvasRenderingContext2D, 进化阶段: number, 配色: { 主色: string; 副色: string; 强调色: string }, 动画帧: number, 动画状态: string) {
  const 眨眼 = Math.floor(动画帧 / 90) % 14 === 0 && (动画帧 % 90) < 8;
  const 翅膀扇动 = Math.sin(动画帧 * 0.15) * 8;
  const 基础偏移 = 进化阶段 * 3;

  if (进化阶段 >= 0) {
    const 翅膀Y = 40 + 翅膀扇动;
    画像素点(ctx, 8, 翅膀Y, 22, 20, 配色.副色);
    画像素点(ctx, 12, 翅膀Y + 3, 18, 15, 配色.主色);
    for (let i = 0; i < 4; i++) {
      画像素点(ctx, 8 + i * 5, 翅膀Y + 18, 4, 6, 配色.强调色);
    }

    画像素点(ctx, 70, 翅膀Y, 22, 20, 配色.副色);
    画像素点(ctx, 70, 翅膀Y + 3, 18, 15, 配色.主色);
    for (let i = 0; i < 4; i++) {
      画像素点(ctx, 72 + i * 5, 翅膀Y + 18, 4, 6, 配色.强调色);
    }
  }

  画像素点(ctx, 30, 30, 40, 45, 配色.主色);
  画像素点(ctx, 35, 35, 30, 35, 配色.主色);
  画像素点(ctx, 38, 68, 24, 10, 配色.副色);

  画像素点(ctx, 32, 12, 36, 30, 配色.主色);
  画像素点(ctx, 35, 15, 30, 25, 配色.主色);

  if (进化阶段 >= 1) {
    画像素点(ctx, 40, 5, 20, 10, 配色.主色);
    for (let i = 0; i < 5; i++) {
      画像素点(ctx, 40 + i * 4, 2 - i * 1, 4, 10 + i, i % 2 === 0 ? 配色.主色 : 配色.强调色);
    }
  }

  if (!眨眼) {
    画像素点(ctx, 38, 22, 9, 9, '#ffffff');
    画像素点(ctx, 53, 22, 9, 9, '#ffffff');
    画像素点(ctx, 40, 24, 5, 6, '#1a1a1a');
    画像素点(ctx, 55, 24, 5, 6, '#1a1a1a');
    画像素点(ctx, 41, 25, 2, 2, '#ffffff');
    画像素点(ctx, 56, 25, 2, 2, '#ffffff');
  } else {
    画像素点(ctx, 38, 26, 9, 2, '#1a1a1a');
    画像素点(ctx, 53, 26, 9, 2, '#1a1a1a');
  }

  画像素点(ctx, 45, 32, 10, 8, '#f59e0b');
  画像素点(ctx, 43, 35, 14, 5, '#d97706');
  画像素点(ctx, 47, 33, 6, 3, '#fbbf24');

  if (动画状态 === 'attack') {
    for (let i = 0; i < 6; i++) {
      const 角度 = (i / 6) * Math.PI * 2;
      const 距离 = 40 + Math.sin(动画帧 * 0.2 + i) * 10;
      const bx = 50 + Math.cos(角度) * 距离;
      const by = 45 + Math.sin(角度) * 距离;
      画像素点(ctx, bx - 3, by - 3, 6, 6, 配色.强调色);
    }
  }

  画像素点(ctx, 35, 78, 8, 10 + 基础偏移, '#f59e0b');
  画像素点(ctx, 57, 78, 8, 10 + 基础偏移, '#f59e0b');
  画像素点(ctx, 33, 85 + 基础偏移, 12, 4, '#d97706');
  画像素点(ctx, 55, 85 + 基础偏移, 12, 4, '#d97706');

  if (进化阶段 >= 2) {
    const 尾巴摇摆 = Math.sin(动画帧 * 0.1) * 3;
    画像素点(ctx, 42, 72 + 尾巴摇摆, 16, 6, 配色.副色);
    画像素点(ctx, 40, 75 + 尾巴摇摆, 4, 10, 配色.强调色);
    画像素点(ctx, 48, 75 + 尾巴摇摆, 4, 10, 配色.强调色);
    画像素点(ctx, 56, 75 + 尾巴摇摆, 4, 10, 配色.强调色);
  }
}

export function 绘制粒子特效(ctx: CanvasRenderingContext2D, x: number, y: number, 粒子列表: { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[]) {
  粒子列表.forEach(p => {
    if (p.life > 0) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(x + p.x - p.size / 2, y + p.y - p.size / 2, p.size, p.size);
    }
  });
  ctx.globalAlpha = 1;
}

export function 创建粒子(x: number, y: number, 颜色: string, 数量: number = 10) {
  const 粒子 = [];
  for (let i = 0; i < 数量; i++) {
    const 角度 = Math.random() * Math.PI * 2;
    const 速度 = 1 + Math.random() * 4;
    粒子.push({
      x: x,
      y: y,
      vx: Math.cos(角度) * 速度,
      vy: Math.sin(角度) * 速度 - 2,
      life: 1,
      color: 颜色,
      size: 2 + Math.random() * 4,
    });
  }
  return 粒子;
}

export function 更新粒子(粒子列表: { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[]) {
  return 粒子列表
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.1,
      life: p.life - 0.02,
    }))
    .filter(p => p.life > 0);
}
