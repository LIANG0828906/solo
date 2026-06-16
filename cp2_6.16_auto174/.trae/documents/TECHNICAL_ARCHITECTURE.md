## 1. 架构设计

```mermaid
graph TD
    A["React App.tsx"] --> B["Zustand Store (musicStore)"]
    A --> C["ControlBar 控制栏组件
    A --> D["StaffView 五线谱组件
    A --> E["PianoKeyboard 钢琴键盘组件
    A --> F["SavedList 收藏列表组件
    B --> G["parser.ts 乐谱解析工具
    B --> H["audioEngine.ts 音频引擎
    G --> I["音符对象数组"]
    H --> J["Web Audio API"]
    B --> K["LocalStorage 收藏持久化
```

## 2. 技术描述

- **前端框架**：React@18 + TypeScript
- **构建工具**：Vite@5 (es2020 目标
- **状态管理**：Zustand
- **音频处理**：Web Audio API (原生)
- **图标库**：无第三方图标库，使用纯SVG和CSS
- **数据持久化**：LocalStorage存储收藏数据

## 3. 文件结构

| 文件路径 | 说明 |
|-------|---------|
| package.json | 项目依赖与脚本 |
| index.html | 入口HTML，引入Google Fonts Inter |
| vite.config.js | Vite配置，React插件 |
| tsconfig.json | TypeScript strict模式 |
| src/main.tsx | ReactDOM渲染入口 |
| src/App.tsx | 主应用组件 |
| src/store/musicStore.ts | Zustand状态仓库 |
| src/utils/parser.ts | 乐谱文本解析纯函数 |
| src/utils/audioEngine.ts | Web Audio API封装 |
| src/components/StaffView.tsx | 五线谱SVG渲染 |
| src/components/PianoKeyboard.tsx | 88键虚拟钢琴 |
| src/components/ControlBar.tsx | 控制栏组件 |
| src/components/SavedList.tsx | 收藏列表组件 |

## 4. 数据模型

### 4.1 音符数据类型

```typescript
interface Note {
  note: string;      // 音名，如 'C4', 'D#5'
  duration: number;  // 节拍数，1=四分音符
  octave: number;     // 八度
  pitch: string;     // 音高类别 (C, D, E...)
  isSharp?: boolean;   // 是否升降号
}

interface SavedFragment {
  id: string;         // UUID
  title: string;     // 片段标题
  scoreText: string;   // 原始乐谱文本
  notes: Note[];    // 解析后的音符
  bpm: number;       // BPM
  noteCount: number;  // 音符数量
  createdAt: number; // 创建时间戳
}
```

### 4.2 Zustand Store状态

```typescript
interface MusicState {
  // 乐谱数据
  scoreText: string;
  notes: Note[];
  parseError: string | null;

  // 播放状态
  isPlaying: boolean;
  isPaused: boolean;
  currentNoteIndex: number;
  playProgress: number;  // 0-1

  // 节拍参数
  bpm: number;
  metronomeEnabled: boolean;
  currentBeat: number;
  isStrongBeat: boolean;

  // 收藏
  savedFragments: SavedFragment[];

  // Actions
  parseScore: (text: string) => void;
  togglePlay: () => void;
  stopPlay: () => void;
  setBpm: (bpm: number) => void;
  toggleMetronome: () => void;
  saveFragment: (title: string) => void;
  loadFragment: (id: string) => void;
  deleteFragment: (id: string) => void;
}
```

## 5. 核心算法

### 5.1 乐谱解析
- 输入格式：`C4,1 D4,1 E4,2`（音符名,节拍数 空格分隔
- 正则表达式匹配音符名+数字
- 验证音高范围 A0-C8

### 5.2 五线谱渲染
- 高音谱号：中央C(C4)以下为低音谱号区域
- 符头Y坐标计算：基于五线谱线间距，根据音高计算位置
- 符干方向：中央线以上朝下，以下朝上

### 5.3 音频引擎
- Web Audio API：正弦波+三角波混合（各50%
- ADSR包络：Attack 0.02s, Decay 0.3s
- 节拍器：高频5000Hz强拍，1000Hz弱拍
- requestAnimationFrame驱动播放调度

### 5.4 钢琴键位
- 88键：A0到C8
- 白键52个，黑键36个
- 黑白键布局计算
