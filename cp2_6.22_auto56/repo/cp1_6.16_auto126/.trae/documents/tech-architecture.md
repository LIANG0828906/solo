## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        "App.tsx 主组件"
        "LetterEditor 信笺编辑"
        "HandwritingAnimator 动画生成"
        "ControlPanel 控制面板"
        "Zustand Store 状态管理"
    end
    subgraph "渲染层"
        "Canvas 2D 帧渲染"
        "gif.js GIF编码"
        "captureStream 视频录制"
    end
    subgraph "导出层"
        "GIF文件下载"
        "WebM视频下载"
    end
    "App.tsx 主组件" --> "LetterEditor 信笺编辑"
    "App.tsx 主组件" --> "HandwritingAnimator 动画生成"
    "App.tsx 主组件" --> "ControlPanel 控制面板"
    "LetterEditor 信笺编辑" --> "Zustand Store 状态管理"
    "ControlPanel 控制面板" --> "Zustand Store 状态管理"
    "HandwritingAnimator 动画生成" --> "Canvas 2D 帧渲染"
    "Canvas 2D 帧渲染" --> "gif.js GIF编码"
    "Canvas 2D 帧渲染" --> "captureStream 视频录制"
    "gif.js GIF编码" --> "GIF文件下载"
    "captureStream 视频录制" --> "WebM视频下载"
```

## 2. 技术说明
- 前端：React@18 + TypeScript + Vite
- 状态管理：Zustand
- GIF导出：gif.js
- 文件下载：file-saver
- 视频导出：canvas.captureStream + MediaRecorder
- 样式：CSS-in-JS（内联样式+CSS模块）
- 初始化工具：vite-init（react-ts模板）

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 单页应用，包含信笺编辑、动画预览和导出功能 |

## 4. 状态管理设计（Zustand Store）

```typescript
interface LetterStore {
  text: string
  fontFamily: 'xingshu' | 'italic'
  fontSize: number
  fontColor: string
  lineSpacing: number
  paperStyle: 'kraft' | 'watermark' | 'floral'
  showDateStamp: boolean
  dateStamp: string
  signature: string
  signaturePreset: string
  isPlaying: boolean
  playbackSpeed: 0.5 | 1 | 2
  currentCharIndex: number
  exportProgress: number
}
```

## 5. 核心模块说明

### 5.1 LetterEditor
- 文本输入区域，支持中英文换行
- 字体选择（潇洒行书/优雅斜体）
- 复古色板选择（墨黑/深棕/锈红/靛蓝）
- 字体大小滑块（16-32px）
- 实时渲染手写体预览到信纸上

### 5.2 HandwritingAnimator
- 逐字拆分文本为渲染单元
- 每个字符按书写路径顺序渲染（贝塞尔曲线模拟）
- 墨迹晕染扩散效果（radial-gradient动画）
- 钢笔图标沿轨迹移动
- 播放/暂停/速度控制
- 帧序列输出供导出使用

### 5.3 ControlPanel
- 背景纸样切换（牛皮纸/水纹纸/花草纸）
- 日期戳开关及显示
- 签名输入/预设签名选择
- GIF导出（gif.js，12fps循环）
- 视频导出（canvas.captureStream，webm）
- 导出进度条与剩余时间估算
