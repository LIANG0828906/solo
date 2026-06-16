import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { useGameStore } from './store/gameStore';

console.log('[TRACE] 应用启动，初始化游戏...');

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#121830',
  scene: [GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true
  },
  fps: {
    target: 60,
    min: 30,
    forceSetTimeOut: false
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

let game: Phaser.Game | null = null;
let perfTestResults: any = null;

const initGame = async () => {
  console.log('[TRACE] 创建 Phaser.Game 实例...');
  console.log('[TRACE] 窗口尺寸:', window.innerWidth, 'x', window.innerHeight);

  game = new Phaser.Game(config);

  game.events.on('ready', () => {
    console.log('[TRACE] Phaser 游戏实例已就绪');
  });

  game.events.on('destroy', () => {
    console.log('[TRACE] Phaser 游戏实例已销毁');
  });

  window.addEventListener('resize', () => {
    if (game) {
      game.scale.resize(window.innerWidth, window.innerHeight);
      console.log('[TRACE] 窗口大小调整:', window.innerWidth, 'x', window.innerHeight);
    }
  });

  try {
    await useGameStore.getState().loadGame();
    console.log('[TRACE] 游戏状态加载完成');
  } catch (e) {
    console.error('[TRACE] 加载游戏状态失败:', e);
  }

  setupAutoSave();
  setupGlobalErrorHandler();

  console.log('[TRACE] 游戏初始化完成！');
  console.log('[TRACE] 执行顺序: 1.类型定义 → 2.状态管理 → 3.粒子效果 → 4.投射物系统 → 5.实体类 → 6.音频 → 7.UI → 8.游戏场景 → 9.主入口');
};

const setupAutoSave = () => {
  setInterval(() => {
    if (game && !useGameStore.getState().gameOver) {
      useGameStore.getState().saveGame();
    }
  }, 30000);
  console.log('[TRACE] 自动保存已启用（每30秒）');
};

const setupGlobalErrorHandler = () => {
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('[ERROR] 全局错误:', { message, source, lineno, colno, error });
    return false;
  };

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[ERROR] 未处理的 Promise 拒绝:', event.reason);
  });
};

(window as any).runPerformanceTest = async (towerCount: number = 40, enemyCount: number = 80) => {
  if (!game) {
    console.error('[PERF-TEST] 游戏未初始化');
    return;
  }

  const scene = game.scene.getScene('GameScene') as GameScene;
  if (!scene) {
    console.error('[PERF-TEST] GameScene 不存在');
    return;
  }

  console.log('='.repeat(60));
  console.log('[PERF-TEST] 性能测试开始');
  console.log('[PERF-TEST] 测试配置:', towerCount, '座塔,', enemyCount, '个敌人');
  console.log('='.repeat(60));

  const startTime = performance.now();
  const result = await scene.runPerformanceTest(towerCount, enemyCount);
  const endTime = performance.now();

  perfTestResults = {
    ...result,
    testTime: endTime - startTime,
    towerCount,
    enemyCount,
    timestamp: new Date().toISOString(),
    passed: result.avgFPS >= 45
  };

  console.log('='.repeat(60));
  console.log('[PERF-TEST] 最终结果:');
  console.log(JSON.stringify(perfTestResults, null, 2));
  console.log('='.repeat(60));

  return perfTestResults;
};

(window as any).getPerfResults = () => {
  return perfTestResults;
};

(window as any).resetGame = () => {
  useGameStore.getState().resetGame();
  console.log('[TRACE] 游戏已重置');
};

(window as any).getFPS = () => {
  if (!game) return 0;
  const scene = game.scene.getScene('GameScene') as GameScene;
  return scene ? scene.getFPS() : 0;
};

initGame().catch((error) => {
  console.error('[TRACE] 游戏初始化失败:', error);
});

export { game };
