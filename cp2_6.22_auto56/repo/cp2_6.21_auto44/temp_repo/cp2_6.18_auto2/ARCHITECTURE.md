# StellarSandbox 架构说明

## 模块概览

```
src/
├── main.ts                 # 应用入口：初始化 EventBus + 所有模块
├── utils/
│   └── types.ts            # 共享类型定义：CelestialBody, PhysicsParams
├── core/
│   ├── bus.ts              # 数据总线：IDataBus 接口 + EventBus 实现
│   ├── engine.ts           # 物理引擎：引力计算、固定步长更新
│   └── renderer.ts         # 3D渲染器：场景/相机/光照/交互/GSAP动画
├── ui/
│   ├── panel.ts            # 控制面板：dat.gui 参数滑块
│   └── infoCard.ts         # 信息卡片：GSAP 弹出动画
└── styles/
    └── main.css            # 全局样式：暗色主题/响应式适配
```

## 数据总线 (EventBus)

所有模块间通信必须通过 `src/core/bus.ts` 中的 `EventBus` 实例，禁止模块间直接调用。

`EventBus` 实现 `IDataBus` 接口，提供 `on()` / `emit()` / `off()` / `clear()` 方法，基于发布-订阅模式。

### 事件定义

| 事件名 | 数据类型 | 发布者 | 订阅者 | 说明 |
|--------|---------|--------|--------|------|
| `params:update` | `PhysicsParams` | panel.ts | engine.ts | 控制面板下发引力常数G、恒星质量 |
| `bodies:update` | `CelestialBody[]` | engine.ts | renderer.ts, panel.ts, infoCard.ts | 引擎每帧发布星体状态数组 |
| `body:hover` | `{ bodyId: string \| null }` | renderer.ts | (外部可订阅) | 鼠标悬停行星时触发 |
| `body:click` | `{ body: CelestialBody }` | renderer.ts | infoCard.ts, panel.ts | 点击行星时携带星体数据 |
| `camera:rotate` | `{ azimuthAngle: number }` | renderer.ts | (外部可订阅) | 相机方位角变化时触发 |

## 数据流向图

```
┌──────────────────────────────────────────────────────────────┐
│                        main.ts                               │
│  创建 EventBus 实例，注入到所有模块构造函数                     │
└────────┬──────────┬──────────┬──────────┬───────────────────┘
         │          │          │          │
         ▼          ▼          ▼          ▼
   ┌──────────┐ ┌────────┐ ┌──────┐ ┌──────────┐
   │ engine.ts│ │renderer│ │panel │ │infoCard  │
   └────┬─────┘ └───┬────┘ └──┬───┘ └────┬─────┘
        │           │         │          │
        │  params:update      │          │
        │◄──────────┤─────────┘          │
        │  (用户调节滑块→总线→引擎)       │
        │                               │
        │  bodies:update                │
        ├──────────►├──────────────────►│
        │  (引擎每帧→总线→渲染器/面板/卡片缓存)
        │                               │
        │           │  body:click       │
        │           ├──────────────────►│
        │           │  (点击行星→总线→卡片弹出/面板更新)
        │                               │
        │           │  body:hover       │
        │           ├──►(GSAP动画)      │
        │           │  (悬停→发光环变色)  │
        │                               │
        │           │  camera:rotate    │
        │           ├──►(背景色渐变)     │
        │           │  (方位角→深紫↔深蓝) │
```

## 关键数据流说明

### 1. 参数调节流
```
用户拖动 dat.gui 滑块
  → panel.ts 检测 onChange
  → bus.emit('params:update', { G, starMass })
  → engine.ts 订阅 params:update
  → 重新计算轨道速度 orbitSpeed
  → 下一次 loop 时新速度生效
```

### 2. 星体状态同步流
```
engine.ts 固定步长 loop (1/60s)
  → update(FIXED_STEP) 计算新位置
  → bus.emit('bodies:update', bodies[])
  → renderer.ts 订阅 → 更新 Mesh.position
  → panel.ts 订阅 → 缓存 bodies 到 Map
  → infoCard.ts 订阅 → 缓存 bodies 到 Map
```

### 3. 行星点击流
```
用户点击 canvas
  → renderer.ts Raycaster 检测碰撞
  → bus.emit('body:click', { body })
  → infoCard.ts 订阅 → 从缓存查找完整数据 → GSAP 弹出卡片
  → panel.ts 订阅 → 从缓存查找完整数据 → 更新选中信息显示
```

### 4. 悬停交互流
```
鼠标移动
  → renderer.ts Raycaster 检测
  → 检测到新悬停目标
  → GSAP Timeline 动画：发光环 #00FFAA→#00CCFF，放大1.4x
  → bus.emit('body:hover', { bodyId })
```

### 5. 视角背景联动流
```
OrbitControls 'change' 事件
  → renderer.ts 获取 getAzimuthalAngle()
  → 计算归一化角度 normalizedAngle = |azimuth| / π
  → targetBgColor = deepPurple.lerp(deepBlue, normalizedAngle)
  → 渲染循环中 backgroundColor.lerp(targetBgColor, delta * 0.5)
  → bus.emit('camera:rotate', { azimuthAngle })
```

## 物理引擎固定步长

```
engine.ts loop:
  frameTime = min((now - lastTime) / 1000, 0.1)  // 限制最大帧时间
  accumulator += frameTime

  while (accumulator >= FIXED_STEP):              // FIXED_STEP = 1/60
    update(FIXED_STEP)                            // 固定步长物理计算
    accumulator -= FIXED_STEP

  bus.emit('bodies:update', bodies)               // 每帧只发布一次
```

这确保无论帧率如何波动，物理模拟始终以 60Hz 稳定计算，保证帧率在 50FPS 以上。
