## 1. 架构设计

```mermaid
flowchart TD
    "index.html 入口" --> "main.ts 协调层"
    "main.ts 协调层" --> "skyMap.ts 星座图模块"
    "main.ts 协调层" --> "divination.ts 占卜引擎模块"
    "main.ts 协调层" --> "audio.ts 音效模块"
    "skyMap.ts 星座图模块" --> "Canvas 2D 上下文"
    "divination.ts 占卜引擎模块" --> "DOM 占卜面板"
    "audio.ts 音效模块" --> "Web Audio API"
```

纯前端架构，无后端依赖。所有星占规则与渲染逻辑均在浏览器端完成。

## 2. 技术说明

- 前端：TypeScript + 原生 JavaScript（无 React/Vue 框架）
- 构建工具：Vite
- 包管理器：npm
- 音效：Web Audio API（生成短促低频噪声模拟龟甲咔嗒声）
- 绘图：Canvas 2D API
- 初始化工具：Vite 原生模板（vanilla-ts）

## 3. 文件结构

```
├── package.json          # 依赖：typescript, vite；启动脚本：npm run dev
├── index.html            # 入口页面，观星台布局 + 底部滑块控制区
├── vite.config.js        # 构建配置，入口 index.html，端口 3000
├── tsconfig.json         # 严格模式，target ES2020
└── src/
    ├── main.ts           # 入口，初始化 Canvas 和占卜面板，绑定滑块事件，协调数据流
    ├── skyMap.ts         # 绘制星座图、黄道带、星体位置和光晕动画
    ├── divination.ts     # 七政位置组合匹配星占规则，生成解读文本和吉凶签，逐字动画
    └── audio.ts          # 龟甲震动音效，Web Audio API 短促低频噪声
```

## 4. 模块接口定义

### 4.1 skyMap.ts

```typescript
export function initSkyMap(canvas: HTMLCanvasElement): void
export function updatePlanets(longitudes: number[]): void
```

- `initSkyMap`：初始化 Canvas，绘制背景恒星、黄道带、十二宫轮廓
- `updatePlanets`：接收七政经度数组（长度7，0-360°），更新星体位置与光晕

### 4.2 divination.ts

```typescript
export function initDivination(panel: HTMLElement): void
export function performDivination(longitudes: number[]): void
```

- `initDivination`：初始化占卜面板，创建龟甲纹样和文字容器
- `performDivination`：根据七政经度匹配规则，生成解读文本与吉凶签，逐字动画输出

### 4.3 audio.ts

```typescript
export function initAudio(): void
export function playCrackSound(): void
```

- `initAudio`：初始化 Web Audio API 上下文
- `playCrackSound`：播放龟甲咔嗒音效（短促低频噪声）

### 4.4 数据流

```typescript
type PlanetLongitudes = [number, number, number, number, number, number, number]
// 顺序：太阳、月亮、火星、金星、木星、土星、（水星预留位）
```

滑块 input 事件 → 读取7个经度值 → 同步调用 updatePlanets + performDivination + playCrackSound

## 5. 星占规则引擎

基于《开元占经》的核心规则，以七政经度关系（合相、冲相、入宫）为判断依据：

| 规则 | 条件 | 解读 | 吉凶 |
|-----|------|------|------|
| 火土合相 | 火星与土星经度差 < 15° | 兵乱之兆，边疆不宁 | 下下签 |
| 木日合相 | 木星与太阳经度差 < 15° | 祥瑞降临，国泰民安 | 上上签 |
| 金月合相 | 金星与月亮经度差 < 15° | 风调雨顺，五谷丰登 | 上上签 |
| 火金冲相 | 火星与金星经度差 165°-195° | 刑伐之象，当慎行事 | 下下签 |
| 木土合相 | 木星与土星经度差 < 15° | 土木兴作，基建有利 | 中平签 |
| 日月冲相 | 太阳与月亮经度差 165°-195° | 阴阳失序，君臣不和 | 下下签 |
| 水星入太阳 | 水星与太阳经度差 < 10° | 文运亨通，科考有利 | 上上签 |
| 火日合相 | 火星与太阳经度差 < 15° | 天火之象，谨防灾厄 | 中平签 |
| 金木合相 | 金星与木星经度差 < 15° | 仁德之兆，和气致祥 | 上上签 |
| 土月冲相 | 土星与月亮经度差 165°-195° | 民怨之象，施政当宽 | 下下签 |

默认无匹配规则时：星象平和，宜静守以待时变——中平签

## 6. 性能策略

- Canvas 重绘使用 `requestAnimationFrame` 节流，避免冗余绘制
- 占卜文本更新使用 300ms 防抖，减少规则匹配频率
- 光晕动画使用径向渐变 + globalCompositeOperation 实现，避免逐帧复杂计算
- 星座图背景（恒星+黄道带）仅在初始化时绘制一次，存储为离屏 Canvas，星体更新时仅重绘前景层
