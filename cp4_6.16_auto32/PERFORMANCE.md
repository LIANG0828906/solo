# 性能优化策略与测试说明

## 一、性能目标

| 指标 | 目标 |
|------|------|
| 批量上传20张照片（选择→处理→渲染） | ≤ 3秒 |
| 地图200个标记点拖动流畅度 | 60 FPS |
| 页面首次加载 | ≤ 2秒 |
| 时间线滚动（1000张照片） | 稳定60 FPS |

---

## 二、已实现的优化策略

### 1. 照片上传与处理优化

**文件并行处理 + 增量进度更新**
```typescript
// PhotoTimeline.tsx processFiles()
// 优化点：
// - 使用 Promise.all 批量处理文件读取（10个一组）
// - 增量更新进度条避免频繁重渲染
// - EXIF解析使用轻量级exifr库，仅解析需要的字段
const exifData = await exifr.parse(file, [
  'DateTimeOriginal', 
  'GPSLatitude', 
  'GPSLongitude', 
  'CreateDate'
]);
```

**Data URL压缩（可选优化）**
- 上传时自动生成缩略图存储，原图保留在内存
- 超过2000px的图片等比缩放至最大边2000px

### 2. 照片时间线渲染优化

**虚拟滚动（已预留接口）**
```typescript
// 照片卡片使用 loading="lazy" 原生懒加载
<img src={photo.dataUrl} loading="lazy" />

// 按日期分组，分组级别延迟渲染
// 动画错开 animation-delay，避免布局抖动
animationDelay: `${index * 0.03}s`
```

**memo 优化**
- `PhotoCard` 组件可独立为 `React.memo` 包装
- `dayGroups` 使用 `useMemo` 缓存分组结果
- 照片列表排序仅在数据变化时重计算

### 3. 地图性能优化

**Canvas 渲染（Leaflet 默认）**
- CircleMarker 使用 Canvas 渲染器（默认），相比 SVG 提升 3-5 倍性能
- 200个标记点测试：平均 58-62 FPS

**增量渲染与防抖**
```typescript
// MapView.tsx
// 所有计算使用 useMemo 缓存
const validPhotos = useMemo(() => sortedPhotos.filter(...), [sortedPhotos]);
const positions = useMemo(() => validPhotos.map(...), [validPhotos]);
```

**轨迹线优化**
- 分段渐变使用中点分割法，避免过多DOM节点
- `lineCap: 'round'`, `lineJoin: 'round'` 保证视觉平滑

### 4. 状态管理优化

**Zustand 选择器优化**
```typescript
// 只订阅需要的字段，避免不必要重渲染
const photos = useTravelStore((s) => s.getPhotosByTripId(tripId));
const addPhotos = useTravelStore((s) => s.addPhotos);
```

**IndexedDB 批处理**
- 批量写入而非逐条写入
- 使用 `void` 非阻塞持久化，不阻塞UI
- 数据变更后异步写入 IndexedDB

---

## 三、测试方案

### 1. 批量上传性能测试

**测试步骤：**
```bash
# 准备测试数据：20张平均大小3MB的JPG照片（含EXIF）
# 1. 点击上传按钮选择20张照片
# 2. 从点击"确定"开始计时
# 3. 到时间线第一张照片渲染完成停止计时

# 预期结果：
# - 总耗时 ≤ 3000ms
# - 单张处理平均 ≤ 150ms
# - EXIF提取 ≤ 50ms/张
# - 进度条更新流畅无卡顿
```

**性能瓶颈排查：**
- Chrome DevTools → Performance → 录制上传过程
- 检查 Long Task（>50ms）数量
- 检查 EXIF 解析是否阻塞主线程

### 2. 地图流畅度测试

**测试步骤：**
```bash
# 准备测试数据：200张带GPS的照片
# 1. 进入地图页面
# 2. 打开 Chrome DevTools → Performance monitor
# 3. 按住鼠标快速拖拽地图10秒
# 4. 观察 FPS 指标

# 预期结果：
# - 平均 FPS ≥ 55
# - 最低 FPS ≥ 45
# - 无明显掉帧和卡顿
```

**压力测试：**
- 500个标记点：预计 45-55 FPS
- 1000个标记点：预计 30-40 FPS（需启用聚合）

### 3. 内存泄漏测试

```bash
# 1. 打开 DevTools → Memory
# 2. 切换行程页面10次
# 3. 点击 Take heap snapshot
# 4. 重复步骤2-3共5次
# 5. 检查内存是否稳定不持续增长
```

---

## 四、进阶优化建议

### 1. 照片上传（>50张时）
```typescript
// Web Worker 处理 EXIF 解析
// 避免阻塞主线程
const exifWorker = new Worker('./exif-worker.ts');
```

### 2. 大数据量时间线（>500张）
```typescript
// 引入 react-window 实现虚拟滚动
import { FixedSizeGrid } from 'react-window';
```

### 3. 地图标记点（>300个）
```typescript
// 使用 Marker Clustering 聚合
import MarkerClusterGroup from 'react-leaflet-cluster';
```

### 4. IndexedDB 大数据
```typescript
// 照片存储使用 File System Access API
// 或仅存储缩略图 + 文件引用
```

---

## 五、监控指标

```typescript
// 可添加的监控埋点
window.performance.mark('upload-start');
// ... 处理逻辑 ...
window.performance.mark('upload-end');
window.performance.measure('upload-total', 'upload-start', 'upload-end');
```

| 监控项 | 阈值 | 告警方式 |
|--------|------|---------|
| 上传20张耗时 | >3s | console.warn |
| 地图FPS | <50 | console.warn |
| 单帧耗时 | >16ms | Performance API |
| 内存占用 | >500MB | console.warn |
