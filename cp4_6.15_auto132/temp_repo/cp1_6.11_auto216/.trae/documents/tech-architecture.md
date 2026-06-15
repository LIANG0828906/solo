## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        "index.html[入口页面]"
        "GuaRenderer[GuaRenderer Canvas渲染器]"
        "DivinationEngine[DivinationEngine 占卜引擎]"
        "IChingData[IChingData 卦辞数据]"
    end
    subgraph "构建层"
        "Vite[Vite构建工具]"
        "TypeScript[TypeScript编译器]"
    end
    subgraph "服务层"
        "Express[Express静态服务]"
    end

    "index.html" --> "GuaRenderer"
    "index.html" --> "DivinationEngine"
    "DivinationEngine" --> "IChingData"
    "GuaRenderer" --> "DivinationEngine"
    "Vite" --> "index.html"
    "TypeScript" --> "Vite"
    "Express" --> "Vite"
```

## 2. 技术说明

- 前端：TypeScript + 原生JavaScript（不使用框架），Canvas 2D渲染
- 构建工具：Vite，入口index.html，端口3000
- 后端：Express（仅提供静态服务）
- 语言：TypeScript 严格模式，target ES2020
- 无数据库需求

## 3. 文件结构

| 文件路径 | 用途 |
|----------|------|
| package.json | 项目依赖(typescript, vite, express)与启动脚本(npm run dev) |
| index.html | 入口页面，竹简色主背景#D2B48C，全屏居中，仿古字体 |
| vite.config.js | 构建配置，入口index.html，端口3000 |
| tsconfig.json | TypeScript严格模式，target ES2020 |
| src/DivinationEngine.ts | 核心占卜逻辑：随机抛掷龟甲生成卦象，六十四卦映射表和变爻计算 |
| src/GuaRenderer.ts | Canvas渲染器：绘制龟甲抛掷动画和六爻卦象排列 |
| src/IChingData.ts | 卦辞数据模块：六十四卦卦名、卦辞、爻辞和变爻解读 |

## 4. 模块接口定义

### DivinationEngine

```typescript
interface YaoResult {
  type: 'oldYang' | 'oldYin' | 'youngYang' | 'youngYin';
  label: string;
  isChanging: boolean;
  value: number;
}

interface HexagramResult {
  yaoList: YaoResult[];
  hexagramIndex: number;
  hexagramName: string;
  changingYaoIndices: number[];
  changedHexagramIndex: number | null;
  changedHexagramName: string | null;
}
```

### IChingData

```typescript
interface HexagramInfo {
  number: number;
  name: string;
  symbol: string;
  judgment: string;
  yaoTexts: string[];
  changingTexts: string[];
}
```

### GuaRenderer

```typescript
interface RenderOptions {
  canvas: HTMLCanvasElement;
  yaoList: YaoResult[];
  changingYaoIndices: number[];
}
```

## 5. 性能要求

- Canvas绘制帧率不低于55FPS
- 龟甲翻转动画(90帧)和爻线绘制(30帧)单次总计算时间不超过150ms
- 历史记录切换DOM更新16ms内完成
- 初始加载预加载六十四卦数据(约2KB JSON)
- 内存占用不超过50MB
