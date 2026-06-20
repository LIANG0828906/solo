## 1. 架构设计

```mermaid
graph TD
    A["index.html 入口"] --> B["main.ts 主入口"]
    B --> C["audio.ts 音频模块"]
    B --> D["particle.ts 粒子模块"]
    B --> E["controls.ts UI 控制模块"]
    C -->|频率数据回调| B
    B -->|更新指令| D
    E -->|交互事件| B
    D --> Three.js 渲染
```

## 2. 技术选型说明

- **前端框架**：原生 TypeScript + Vite
- **3D 引擎**：Three.js（CDN 引入）
- **音频 API**：Web Audio API（原生）
- **构建工具**：Vite
- **语言**：TypeScript（严格模式）
- **样式**：原生 CSS（磨砂玻璃效果）

## 3. 模块定义

### 3.1 文件结构
| 文件路径 | 职责描述 |
|---------|---------|
| `index.html` | 入口页面，全屏布局，引入 Three.js CDN |
| `src/main.ts` | 主入口，初始化场景/相机/渲染器，驱动主循环 |
| `src/audio.ts` | 音频模块，文件上传，频率分析 |
| `src/particle.ts` | 粒子模块，粒子系统，对象池，动画更新 |
| `src/controls.ts` | UI 控制模块，控制条渲染与交互 |

### 3.2 模块接口

#### audio.ts
- `initAudio(): void - 初始化音频上下文
- `loadFile(file: File): Promise<void>` - 加载音频文件
- `getFrequencyData(): { low: number, mid: number, high: number } - 获取三段频率能量
- `onFrequency(callback: (data: FrequencyData) => void): void` - 注册频率数据回调
- `play(): void` - 播放
- `pause(): void` - 暂停
- `setVolume(v: number): void` - 设置音量 0-1
- `setProgress(t: number): void` - 设置播放进度
- `getDuration(): number` - 获取总时长
- `getCurrentTime(): number` - 获取当前时间

#### particle.ts
- `initParticles(scene: THREE.Scene, count: number): void` - 初始化粒子系统
- `update(delta: number, freqData: FrequencyData): void` - 更新粒子状态
- `setTheme(theme: Theme): void` - 设置主题
- `resize(): void` - 窗口大小变化处理

#### controls.ts
- `initControls(container: HTMLElement): void` - 初始化控制条
- `onPlayPause(callback: () => void): void` - 播放/暂停回调
- `onVolumeChange(callback: (v: number) => void): void` - 音量变化回调
- `onProgressChange(callback: (t: number) => void): void` - 进度变化回调
- `onThemeChange(callback: (theme: string) => void): void` - 主题变化回调
- `updateProgress(time: number, duration: number): void` - 更新进度显示

## 4. 性能优化

- **对象池**：粒子对象复用，减少 GC
- **InstancedMesh**：使用实例化网格渲染大量粒子
- **帧率控制**：requestAnimationFrame 驱动，deltaTime 插值
- **内存管理**：及时释放不需要的资源

## 5. 主题配置

```typescript
interface Theme {
  name: string;
  particleHue: [number, number]; // 粒子色相范围
  bgColor: number; // 背景色
  starColor: number; // 星空颜色
  glowIntensity: number; // 光晕强度
}

const themes: Record<string, Theme> = {
  neon: { name: '霓虹', particleHue: [180, 320], bgColor: 0x0a0a1a, starColor: 0x00ffff, glowIntensity: 1.5 },
  aurora: { name: '极光', particleHue: [120, 280], bgColor: 0x0a1a0a, starColor: 0x00ff88, glowIntensity: 1.2 },
  lava: { name: '熔岩', particleHue: [0, 60], bgColor: 0x1a0a0a, starColor: 0xff4400, glowIntensity: 2.0 }
};
```
