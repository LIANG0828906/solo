# 企业团队内部活动投票与决策工具 - 技术架构文档

## 1. 技术栈选型

| 类别 | 技术选择 | 版本要求 | 说明 |
|------|----------|----------|------|
| 构建工具 | Vite | ^5.0.0 | 极速冷启动、HMR，适配现代前端开发 |
| UI框架 | React | ^18.2.0 | 函数式组件 + Hooks |
| 类型系统 | TypeScript | ^5.0.0 | 严格模式（strict: true） |
| React插件 | @vitejs/plugin-react | ^4.2.0 | Vite React 支持 |
| 类型声明 | @types/react, @types/react-dom | ^18.2.0 | React 类型定义 |
| 撒花动画 | canvas-confetti | ^1.9.2 | 投票成功、结束投票等庆祝效果 |

---

## 2. 项目结构

```
auto19/
├── .trae/documents/          # 项目文档
│   ├── PRD.md               # 产品需求文档
│   └── ARCHITECTURE.md      # 技术架构文档
├── src/
│   ├── App.tsx              # 主应用组件：路由管理 + 全局状态
│   ├── CreatePoll.tsx       # 投票创建模块
│   ├── VotePage.tsx         # 投票参与模块
│   ├── ResultsPanel.tsx     # 结果展示模块
│   └── types.ts             # 类型定义（可选，App.tsx 内联也可）
├── index.html               # 入口页面
├── package.json             # 依赖管理
├── vite.config.js           # Vite 构建配置
└── tsconfig.json            # TypeScript 配置
```

---

## 3. 核心模块设计

### 3.1 App.tsx - 主应用组件

**职责**：
- 管理全局路由状态（首页 / 创建页 / 投票页）
- 提供全局 Poll 数据的增删改查方法（基于 LocalStorage）
- 管理当前用户设备标识（deviceId，存于 LocalStorage）

**路由状态设计**：
```typescript
type View = 
  | { name: 'home' }
  | { name: 'create' }
  | { name: 'vote'; pollId: string };
```

**全局数据管理**：
- Poll 存储：`LocalStorage['polls']` → JSON 字符串 → `Record<string, Poll>`
- 投票记录：`LocalStorage['votes']` → JSON 字符串 → `VoteRecord[]`
- 设备标识：`LocalStorage['deviceId']` → 首次访问时生成 UUID

---

### 3.2 CreatePoll.tsx - 投票创建模块

**状态**：
- `title` / `description` / `deadline`：表单输入
- `options`：选项数组（默认2个空选项）

**核心逻辑**：
1. 校验：标题非空、选项至少2个且非空、不超过10个
2. 生成投票码：`Math.random().toString(36).substring(2, 8).toUpperCase()`（6位字母数字），确保唯一
3. 保存到 LocalStorage，跳转投票页

---

### 3.3 VotePage.tsx - 投票参与模块

**状态**：
- `poll`：当前投票数据
- `votedOptionId`：当前用户已投选项（未投则 null）
- `hasVoted`：是否已投票

**核心逻辑**：
1. 加载投票数据：根据 pollId 从 LocalStorage 读取
2. 校验投票状态：检查是否已投票、是否已截止、是否已结束
3. 投票交互：
   - 点击选项卡片 → scale(0.95) 动画 → 立即写入 LocalStorage
   - 触发 canvas-confetti 庆祝效果
   - 调用 ResultsPanel 重绘条形图
4. 防重复投票：按 deviceId 校验

---

### 3.4 ResultsPanel.tsx - 结果展示模块

**核心逻辑**：
1. **Canvas 条形图绘制**：
   - 计算最大票数，按比例绘制条形宽度
   - 入场动画：使用 `requestAnimationFrame`，每条延迟 100ms，从 0 宽度增长到目标宽度（ease-out）
   - 显示选项文本、票数、百分比
   - 最高票选项顶部绘制金色皇冠图标
   
2. **分享图生成**：
   - 创建独立 Canvas，尺寸：800x600（或根据选项数自适应）
   - 绘制标题、条形图、最高票标记、品牌标识
   - 导出为 base64 PNG，用户可右键保存

3. **实时更新**：
   - 接收父组件传入的 poll 数据
   - 使用 useEffect 监听 poll 变化，重绘条形图

---

## 4. 样式规范

### 4.1 CSS 变量
```css
:root {
  --bg-primary: #0f172a;
  --bg-card: #1e293b;
  --accent-orange: #f97316;
  --accent-blue: #3b82f6;
  --success-gradient: linear-gradient(135deg, #10b981, #059669);
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
}
```

### 4.2 全局样式
- body：`background: var(--bg-primary)`, `color: var(--text-primary)`, `font-family: ...`
- 所有卡片：`background: var(--bg-card)`, `border-radius: 12px`, `padding: 20px`
- 按钮：`background: var(--accent-orange)`, `color: white`, `transition: all 200ms ease`
- 按钮 hover：`transform: translateY(-1px)`, `box-shadow: 0 4px 12px rgba(249,115,22,0.3)`

### 4.3 关键动画

**输入框呼吸光晕**：
```css
@keyframes breathe {
  from { box-shadow: 0 2px 4px rgba(59,130,246,0.3); }
  to   { box-shadow: 0 2px 16px rgba(59,130,246,0.8); }
}
input:focus {
  animation: breathe 2s infinite alternate;
  border-bottom-color: var(--accent-blue);
}
```

**选项卡片缩放**：
```css
.option-card {
  transition: transform 200ms ease, background 200ms ease;
}
.option-card:active {
  transform: scale(0.95);
}
.option-card.selected {
  background: var(--success-gradient);
}
```

---

## 5. 性能优化策略

### 5.1 Canvas 渲染优化
- 使用 `requestAnimationFrame` 控制动画帧
- 避免在动画回调中创建新对象，复用离屏 Canvas
- 条形图入场动画仅执行一次，后续更新直接绘制最终状态

### 5.2 React 渲染优化
- 使用 `React.memo` 包裹 ResultsPanel、选项卡片等子组件
- 使用 `useCallback` 缓存事件处理函数
- 拆分大组件，避免不必要的重渲染

### 5.3 数据更新策略
- 投票提交后直接更新内存中状态 + 异步写入 LocalStorage
- 结果面板通过 state/props 更新触发重绘，控制在 200ms 内完成

---

## 6. 响应式设计

| 断点 | 卡片布局 | 条形图宽度 |
|------|----------|------------|
| ≥ 768px (桌面) | 2 列网格 | 500px |
| < 768px (移动端) | 1 列 | 100% - 40px |

使用 CSS Media Queries 实现：
```css
@media (max-width: 768px) {
  .options-grid { grid-template-columns: 1fr; }
  .results-canvas { width: 100%; }
}
```

---

## 7. 数据持久化方案

由于是前端纯实现，使用 LocalStorage 模拟后端存储：

| Key | 数据结构 | 说明 |
|-----|----------|------|
| `deviceId` | `string` | 用户设备唯一标识（UUID） |
| `polls` | `Record<string, Poll>` | 所有投票数据，key 为投票码 |
| `votes` | `VoteRecord[]` | 所有投票记录，用于防重复校验 |

数据访问封装在 App.tsx 中提供的 hooks / 工具函数中，便于未来替换为真实 API。

---

## 8. 构建与部署

### 8.1 开发命令
```bash
npm install    # 安装依赖
npm run dev    # 启动开发服务器
```

### 8.2 构建产物
```bash
npm run build  # 构建生产版本到 dist/
```

### 8.3 环境要求
- Node.js ≥ 16
- npm ≥ 8
