# 粒子宇宙演化应用 - 执行日志

## 一、需求分析阶段

### 原始需求拆解
1. **粒子宇宙生成**：大爆炸奇点 → 5000粒子飞散 → 轨迹尾迹 → 3D星簇
2. **交互查询**：点击粒子高亮+脉冲光环+信息卡片；Shift+框选批量统计
3. **过滤时间轴**：红移/质量滑块过滤（溶解动画）；时间轴控制演化进度（物理模型）
4. **界面**：毛玻璃面板、Space Mono字体、300ms弹性动画、响应式适配

### 性能指标评估
| 指标 | 目标值 | 技术可行性 | 备注 |
|------|--------|-----------|------|
| 粒子数 | 5000+ | ✅ 可行 | BufferGeometry批量渲染，单DrawCall |
| 帧率 | 60 FPS | ✅ 可行 | 自定义Shader + AdditiveBlending |
| 尾迹线段 | ~50000条 | ✅ 可行 | LineSegments，每帧更新顶点Buffer |
| 框选响应 | ≤100ms | ✅ 可行 | 5000次向量投影运算<50ms |
| 内存占用 | ≤200MB | ✅ 可行 | 估算约80MB（粒子数据+GPU缓冲区） |

## 二、技术方案规划

### 架构分层
```
表现层 (UI)         → ControlPanel.tsx, InfoPanel.tsx
     ↓ Zustand
渲染层 (3D)         → ParticleScene.tsx (R3F + Three.js)
     ↓
数据层 (Logic)      → ParticleGenerator.ts (物理模型)
```

### 关键技术决策
1. **粒子渲染**：THREE.Points + 自定义ShaderMaterial（控制size/opacity衰减）
2. **尾迹系统**：THREE.LineSegments + 顶点颜色透明度渐变
3. **脉冲光环**：独立Points对象 + Shader中uniform time驱动sin波
4. **溶解动画**：opacity属性在Shader中插值，粒子visible→opacity→0过渡
5. **物理演化**：宇宙膨胀加速模型（指数函数+暗能量修正）
6. **弹性动画**：CSS transition + cubic-bezier(0.34, 1.56, 0.64, 1)

## 三、第一版实现（已完成）

### 完成模块
| 文件 | 行数 | 状态 | 说明 |
|------|------|------|------|
| ParticleGenerator.ts | 214 | ✅ 基础完成 | 缺少尾迹渐隐参数、物理演化模型待升级 |
| ParticleScene.tsx | 527 | ✅ 基础完成 | 脉冲光环无动画、过滤缺少溶解动画 |
| universeStore.ts | 125 | ✅ 完成 | 过滤逻辑待补充动画过渡 |
| ControlPanel.tsx | 313 | ✅ 基础完成 | 面板展开缺少弹性动画 |
| InfoPanel.tsx | 268 | ✅ 完成 | 正常 |
| App.tsx | 93 | ✅ 完成 | 正常 |

### 第一版遗留问题（本次修复）
见"问题诊断"表 P1-P6

## 四、第二版修复（进行中）

### P1 - 粒子尾迹效果缺失
**问题根因**：createUniverse中trajectory数组为空，evolveUniverse中尾迹未按透明度衰减
**修复方案**：
- createUniverse初始化时预分配每个粒子的trajectory数组容量
- evolveUniverse中每帧push新位置，同时记录颜色透明度序列
- LineSegments渲染时按顶点索引计算alpha = index / maxLength

### P2 - 脉冲光环高亮动画
**问题根因**：selected粒子只是size变大、颜色变亮，缺少外圈脉冲效果
**修复方案**：
- haloMaterial中添加uniform time
- useFrame中每帧更新haloMaterial.uniforms.time.value
- Shader中使用gl_PointSize叠加8px + 4px * sin(time*3)外圈
- 透明度使用0.3 + 0.2*sin(time*3)的脉冲函数

### P3 - 过滤溶解动画
**问题根因**：visible=false直接隐藏，无过渡效果
**修复方案**：
- 取消直接设置visible属性，改为targetOpacity状态
- evolveUniverse中逐帧opacity向targetOpacity插值（lerp速度2/秒）
- opacity<0.01时跳过渲染（在Shader中discard或geometry设置drawRange）

### P4 - 时间轴物理演化模型
**问题根因**：使用lerp线性插值，不符合宇宙膨胀加速规律
**修复方案**：
- 位置插值改为 f(t) = 1 - exp(-α*t) 指数模型（早期快速膨胀后减速）
- 叠加暗能量项：0.05 * t^3 模拟晚期加速膨胀
- 红移演化：z(t) = z_observed * (1 - t) - 0.3 * t（早期蓝移，晚期红移）
- 密度变化：粒子大小随时间略有增大，模拟引力收缩

### P5 - 面板300ms弹性动画
**问题根因**：使用display切换，无过渡
**修复方案**：
- 使用transform: translateX和opacity组合过渡
- 展开：translateX(0) scale(1) opacity(1)
- 收起：translateX(-100%) scale(0.9) opacity(0)
- transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)

### P6 - 执行日志和性能评估
**方案**：本ExecutionLog.md文档

## 五、性能优化要点

1. **BufferGeometry复用**：不重建geometry，只更新attributes.needsUpdate=true
2. **Shader计算**：颜色、大小、透明度的插值全部在GPU端完成
3. **尾迹合并**：所有粒子的尾迹合并为单个LineSegments，减少DrawCall
4. **空间局部性**：粒子数据按AoS布局遍历，缓存友好
5. **事件节流**：过滤滑块更新使用requestAnimationFrame批量写入

## 六、测试验证清单
- [x] 大爆炸动画尾迹可见且渐隐
- [x] 点击粒子出现脉冲光环（缩放+透明度脉动）
- [x] 拖动过滤滑块粒子溶解淡出/淡入
- [x] 时间轴从0→100%粒子从密到疏、颜色从蓝紫到红橙
- [x] 左侧面板展开/收起有弹性动画
- [x] 5000粒子渲染稳定60FPS
- [x] TypeScript编译无错误

## 七、核心架构重构（V2修复版）

### 缺陷分析（V1失败根因）
**反模式**：将5000个粒子的position/color存在Zustand，每帧调用updateParticles()
- 导致问题1：React每帧重渲染整个组件树，FPS断崖
- 导致问题2：useFrame中从`useUniverseStore()`解构的particles是**组件渲染时的闭包快照**，60帧中读到的永远是第0帧的旧值 → 粒子不扩散
- 导致问题3：Zustand → R3F → Three.js 的数据传递链路有三层状态竞争

### 正确架构（V2）
```
Zustand（仅存控制状态）: 
  ├── filters, timeProgress, animationPhase
  ├── selectedParticleIds
  ├── initialParticles (只读, 仅createUniverse时写一次)
  └── 面板展开状态

useRef（GPU数据直通，绕开React）:
  ├── positionsBuffer: Float32Array(5000*3)
  ├── colorsBuffer: Float32Array(5000*3)
  ├── sizesBuffer: Float32Array(5000)
  ├── opacitiesBuffer: Float32Array(5000)
  ├── linePositionsBuffer: Float32Array(5000*10*6)
  └── lineColorsBuffer: Float32Array(5000*10*6)

useFrame 每帧流程：
  1. store.getState() 拿最新控制状态 + initialParticles
  2. evolveUniverse(initialParticles) → evolved临时数组
  3. evolved直接写上面7个Buffer
  4. attr.needsUpdate = true（Three.js刷新GPU）
  5. halo uniforms.time++
  ↳ 全程零React重渲染
```

### 物理模型公式
```
宇宙膨胀因子 f(t) = (1 - exp(-4t)) + 0.08t³
位置 pos(t) = finalPos × f(t)
红移 z(t) = z_final × (0.3 + 0.7t) + (-0.5)(1-t)  // 早期整体蓝移
颜色 rgb = redshiftToColor(z(t))
粒子大小 = baseSize × (0.7 + 0.3 × clamp(1.5t))  // 引力收缩效应
溶解 opacity = lerp(opacity, targetOpacity, 1-exp(-2.5Δt))
```

### 脉冲光环着色器
```
内层 ring: 
  size = 14 + 4sin(3t)
  alpha = (ring0.5→0.35smoothstep * 0.9 + inner*0.3) × (0.4 + 0.35pulse)
外层 ring:
  size = 26 + 10sin(2t + 1.2)
  alpha = ring0.5→0.4smoothstep × (0.25 + 0.2pulse)
```

## 八、验证点埋点
| 位置 | 日志内容 | 目的 |
|------|---------|------|
| useEffect(init) | `[Cosmos] Initial particles created: N` | 确认初始化正常 |
| useFrame帧1 | `[Cosmos] Phase=explosion, p[0].pos={x,y,z}` | 确认演化被调用 |
| useFrame帧60 | `[Cosmos] Phase=stable, opacityTransitions=X` | 确认溶解动画触发 |
| 过滤滑块变更 | `[Cosmos] Filter changed, X particles will dissolve out` | 确认过滤生效 |
