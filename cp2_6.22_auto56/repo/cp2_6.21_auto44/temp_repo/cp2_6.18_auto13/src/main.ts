// ============================================================================
// main.ts - 应用入口文件
// 职责：初始化所有模块，启动应用
// 调用关系：
//   - 初始化 dataHandler → 生成数据 → 发送到 renderer
//   - 初始化 renderer   → 渲染3D场景
//   - 初始化 uiControl   → 管理UI交互
// 数据流向：
//   应用启动 → dataHandler生成温度数据 → 事件总线 → renderer渲染 →
//   UI交互 → uiControl发送指令 → 事件总线 → renderer响应更新
// ============================================================================

import { dataHandler } from './dataHandler';
import { Renderer } from './renderer';
import { UIControl } from './uiControl';

class UrbanHeatVizApp {
  private renderer: Renderer | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    try {
      // 初始化UI控制模块
      new UIControl();

      // 初始化渲染模块
      this.renderer = new Renderer(
        'scene-canvas',
        'label-container',
        'tooltip'
      );

      // 初始化数据处理模块并发送数据
      dataHandler.initialize();

      console.log('[UrbanHeatViz] 应用初始化成功');
      console.log('[UrbanHeatViz] 模块调用关系：');
      console.log('  dataHandler → eventBus → renderer');
      console.log('  uiControl   → eventBus → renderer');
      console.log('  renderer    → eventBus → uiControl');
    } catch (error) {
      console.error('[UrbanHeatViz] 应用初始化失败:', error);
    }
  }

  public dispose(): void {
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

// 启动应用
window.addEventListener('DOMContentLoaded', () => {
  const app = new UrbanHeatVizApp();

  // 页面卸载时清理
  window.addEventListener('beforeunload', () => {
    app.dispose();
  });
});
