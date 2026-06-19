# 技术架构文档

## 架构设计

前端单页应用，采用模块化结构设计。

## 技术栈

- **TypeScript**：类型安全的 JavaScript 超集
- **Three.js**：3D 渲染引擎
- **Vite**：前端构建工具

## 项目结构

```
/
├── package.json          # 项目依赖配置
├── index.html            # 入口 HTML 文件
├── vite.config.js        # Vite 配置文件
├── tsconfig.json         # TypeScript 配置（严格模式）
└── src/
    ├── main.ts           # 场景初始化、动画循环
    ├── scene.ts          # 纸面、折痕管理
    ├── foldEngine.ts     # 折叠引擎核心
    ├── ui.ts             # UI 管理（原生 DOM）
    └── screenshot.ts     # 截图功能
```

### 文件说明

- **package.json**：包含 three、@types/three、typescript、vite 等依赖
- **index.html**：应用入口页面
- **vite.config.js**：Vite 构建配置
- **tsconfig.json**：TypeScript 编译配置，启用严格模式
- **src/main.ts**：负责场景初始化、渲染循环、事件绑定
- **src/scene.ts**：管理纸面几何体、折痕数据、网格线
- **src/foldEngine.ts**：折叠动画核心引擎，驱动折痕角度变化
- **src/ui.ts**：原生 DOM 实现的 UI 控制面板与信息面板
- **src/screenshot.ts**：实现 1920x1080 PNG 截图导出

## 数据流向

1. **用户点击** → UI 层接收用户交互
2. **scene 生成折痕** → 场景模块创建折痕数据与视觉元素
3. **foldEngine 驱动折叠** → 折叠引擎计算并驱动动画
4. **main 更新渲染** → 主循环更新 Three.js 场景并渲染
5. **ui 更新显示** → UI 层同步展示当前状态信息
