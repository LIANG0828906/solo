## 1. 架构设计

```mermaid
graph TD
    App["App.tsx 主组件<br/>全局状态/路由/数据流协调"]
    App --> Editor["DialogueEditor.tsx<br/>编辑器：节点树/拖拽/连线/布局"]
    App --> Preview["PreviewPanel.tsx<br/>预览器：播放/打字机/分支/控制"]
    Editor --> NodeCard["NodeCard.tsx<br/>单个节点卡片UI"]
    App --> Types["types.ts<br/>数据类型定义"]
    App --> Utils["exportImport.ts<br/>JSON序列化/反序列化"]
    
    State["React Context + useState<br/>全局状态:角色/节点/连线"]
    DnD["@dnd-kit/core + @dnd-kit/utilities<br/>节点拖拽引擎"]
    Canvas["SVG Canvas<br/>贝塞尔曲线连线渲染"]
    
    App --> State
    Editor --> DnD
    Editor --> Canvas
```

## 2. 技术说明

- **前端框架**：React 18 + TypeScript 5（严格模式）
- **构建工具**：Vite 5（ESNext模块）
- **路由管理**：react-router-dom 6（单页工作台）
- **拖拽引擎**：@dnd-kit/core + @dnd-kit/utilities（高性能节点拖拽与排序）
- **样式方案**：CSS Modules + CSS Variables（深色主题变量系统）
- **动画实现**：
  - CSS Transitions/Keyframes（悬停/情绪渐变/按钮反馈）
  - requestAnimationFrame（打字机/连线弹性动画，60fps目标）
- **连线渲染**：原生SVG `<path>` + 三次贝塞尔曲线(Cubic Bezier)
- **数据持久化**：JSON文件导入导出（Blob + FileReader API）

## 3. 路由定义

| 路由 | 用途 |
|-------|---------|
| / | 主工作台（编辑器+预览器双栏布局） |

## 4. 数据模型

### 4.1 核心类型定义

```mermaid
erDiagram
    CHARACTER {
        string id "PK, UUID"
        string name "角色名称"
        string avatar "头像URL或emoji"
        Emotion defaultEmotion "初始情绪"
    }
    
    DIALOGUE_NODE {
        string id "PK, UUID"
        string characterId "FK -> CHARACTER.id"
        string text "对话文本内容"
        Emotion emotion "说话时情绪"
        number x "画布X坐标"
        number y "画布Y坐标"
        string[] branchLabels "分支选项标签(最多3个)"
    }
    
    CONNECTION {
        string id "PK, UUID"
        string sourceId "FK -> DIALOGUE_NODE.id"
        string targetId "FK -> DIALOGUE_NODE.id"
        number sourcePort "源节点端口索引(0/1/2)"
    }
    
    CHARACTER ||--o{ DIALOGUE_NODE : "说话"
    DIALOGUE_NODE ||--o{ CONNECTION : "源节点"
    DIALOGUE_NODE ||--o{ CONNECTION : "目标节点"
```

### 4.2 枚举与接口结构

- **Emotion 枚举**：`neutral | angry | happy` → 映射边框颜色
- **DialogueTree 根对象**：`{ characters: Character[], nodes: DialogueNode[], connections: Connection[], rootNodeId: string }`

## 5. 性能优化策略

| 优化点 | 策略 |
|-------|------|
| 100节点拖拽流畅度 | @dnd-kit硬件加速 + transform定位 + React.memo节点卡片 |
| 连线渲染性能 | SVG path局部更新（仅变更被拖拽节点相关连线）+ rAF节流 |
| 自动布局算法 | 力导向布局的简化版：层级网格布局，O(n)复杂度 |
| 打字机动画 | rAF逐帧更新 + 文本分片渲染 + 避免reflow |
| 分隔条拖拽 | CSS transform + will-change + 节流resize事件 |
| 情绪切换动画 | CSS transition border-color 0.3s ease |

## 6. 文件组织结构

```
auto41/
├── package.json          # 依赖+脚本配置
├── vite.config.ts        # Vite构建+代理配置
├── tsconfig.json         # TS严格模式+ESNext
├── index.html            # 入口页面(含深色主题背景)
└── src/
    ├── App.tsx                      # 主组件:全局状态/布局/数据流
    ├── types.ts                     # 类型定义(Character/Node/Connection/Emotion)
    ├── utils/exportImport.ts        # JSON序列化/反序列化/自动布局适配
    ├── components/
    │   ├── DialogueEditor.tsx       # 左侧编辑器:画布/节点/连线/角色管理
    │   ├── PreviewPanel.tsx         # 右侧预览:播放/打字机/分支/控制条
    │   └── NodeCard.tsx             # 节点卡片UI组件(可拖拽)
    └── styles/
        ├── globals.css              # CSS变量+深色主题+重置样式
        └── animations.css           # 关键帧动画定义
```
