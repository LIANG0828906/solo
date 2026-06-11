## 1. 架构设计

```mermaid
flowchart LR
    "index.html" --> "main.ts"
    "main.ts" --> "editor.ts"
    "main.ts" --> "renderer.ts"
    "editor.ts -->|序列数据| renderer.ts"
    "renderer.ts -->|请求判定| combat.ts"
    "combat.ts -->|伤害状态| renderer.ts"
```

**数据流向**：
1. 用户交互 → editor.ts 更新技能序列数组
2. editor.ts 通知 renderer.ts 序列变更
3. renderer.ts 在动画循环中调用 combat.ts 获取当前帧伤害状态
4. combat.ts 返回判定结果给 renderer.ts 绘制

## 2. 技术方案

- **前端**：TypeScript + 原生Canvas API + gsap动画库
- **构建工具**：Vite（入口index.html，端口3000）
- **动画库**：gsap（用于连招标签弹入等DOM动画）
- **无框架**：纯TypeScript + 原生DOM操作，不使用React/Vue
- **状态管理**：editor.ts内部管理技能序列数组，通过回调通知renderer

### 文件结构

```
├── package.json          # 依赖：typescript, vite, gsap; 启动脚本: npm run dev
├── vite.config.js        # 构建配置，入口index.html，端口3000
├── tsconfig.json         # 严格模式，target ES2020，module ESNext
├── index.html            # 入口HTML
├── src/
│   ├── main.ts           # 应用入口，初始化编辑器界面、Canvas和事件绑定
│   ├── editor.ts         # 连招编辑器模块，管理技能序列列表
│   ├── renderer.ts       # Canvas渲染与动画回放模块
│   └── combat.ts         # 连招逻辑与伤害计算模块
```

### 模块职责与调用关系

| 文件 | 职责 | 调用关系 |
|------|------|---------|
| main.ts | 初始化UI、创建全局app实例、绑定事件 | 调用editor.ts和renderer.ts |
| editor.ts | 管理技能序列、拖拽排序、属性编辑 | 被main.ts调用，通知renderer.ts |
| renderer.ts | Canvas逐帧绘制角色/特效/伤害、动画回放 | 被main.ts调用，调用combat.ts |
| combat.ts | 技能数据接口、伤害计算、连击判定 | 被renderer.ts调用 |

## 3. 路由定义

单页应用，无路由。所有功能在一个页面内完成。

## 4. 核心数据接口

```typescript
interface Skill {
  name: string;
  damage: number;
  startupFrames: number;
  activeFrames: number;
  recoveryFrames: number;
  type: 'normal' | 'fire' | 'ice';
}

interface ComboState {
  currentFrame: number;
  totalFrames: number;
  currentSkillIndex: number;
  phase: 'startup' | 'active' | 'recovery' | 'idle';
  totalDamage: number;
  comboCount: number;
}

interface DamageResult {
  damage: number;
  isComboHit: boolean;
  comboCount: number;
  dps: number;
}
```

## 5. 动画帧计算逻辑

- 每个技能总帧数 = 前摇帧 + 判定帧 + 后摇帧
- 连招总帧数 = 所有技能帧数之和
- 假设60帧 = 1秒
- DPS = 累计伤害 / (当前帧 / 60)
- 连击判定：连续技能在判定帧内无中断（即自然顺序播放）
- 前摇：角色缩放0.95倍（后仰）
- 判定：角色恢复+释放技能特效粒子
- 后摇：角色后仰缓慢收回

## 6. 性能约束

- Canvas动画60FPS，每帧绘制≤12ms
- requestAnimationFrame驱动
- 拖拽响应≤50ms
- 技能卡片上限8个
