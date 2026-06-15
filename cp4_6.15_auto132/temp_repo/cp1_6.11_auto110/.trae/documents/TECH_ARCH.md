## 1. 架构设计

```mermaid
flowchart TD
    A["浏览器 (React + Vite)"] --> B["App.tsx 路由与状态管理"]
    B --> C["Dashboard 仪表盘"]
    B --> D["ScoreEditor 曲谱编辑"]
    B --> E["Tuner 调音器"]
    C --> F["REST API (Express)"]
    D --> F
    F --> G["内存数据存储"]
    E --> H["Web Audio API (麦克风输入)"]
    D --> I["Web Audio API (节拍器音频)"]
```

## 2. 技术说明

- **前端**：React@18 + TypeScript@5 + Vite@5
- **构建工具**：Vite，端口3000，入口index.html
- **后端**：Express@4，提供REST API
- **音频处理**：Web Audio API（AnalyserNode、OscillatorNode）
- **路由**：React客户端内部分发（useState状态切换，无需react-router）
- **数据存储**：服务端内存存储（开发模式），使用uuid生成唯一ID
- **Markdown渲染**：react-markdown

## 3. 路由定义
| 页面标识 | 目的 |
|-------|---------|
| dashboard | 乐队仪表盘，成员列表、曲目管理 |
| score-editor | 曲谱查看编辑，Markdown分谱、节拍器 |
| tuner | 实时调音器，麦克风频率检测 |

## 4. API定义

### 4.1 类型定义
```typescript
interface Song {
  id: string;
  title: string;
  content: string;
  bpm: number;
  lastModified: string;
}
```

### 4.2 接口列表
| 方法 | 路径 | 请求体 | 响应 |
|------|------|--------|------|
| GET | /api/songs | - | Song[] |
| POST | /api/songs | { title: string } | Song |
| DELETE | /api/songs/:id | - | { success: boolean } |

## 5. 服务器架构图

```mermaid
flowchart TD
    A["Express Server (server.ts)"] --> B["GET /api/songs"]
    A --> C["POST /api/songs"]
    A --> D["DELETE /api/songs/:id"]
    B --> E["读取内存曲目列表"]
    C --> F["生成UUID + 创建曲目对象"]
    D --> G["根据ID删除曲目"]
    E --> H["返回 JSON 响应"]
    F --> H
    G --> H
```

## 6. 数据模型

### 6.1 数据模型定义
```mermaid
erDiagram
    SONG {
        string id PK "UUID"
        string title "曲目标题"
        string content "Markdown分谱内容"
        number bpm "节拍速度"
        string lastModified "ISO时间戳"
    }
```

### 6.2 初始数据
服务端启动时预置3首示例曲目，便于首次展示。

## 7. 文件结构
```
project/
├── package.json
├── index.html
├── vite.config.js
├── tsconfig.json
└── src/
    ├── App.tsx          # 主应用组件，路由与状态
    ├── server.ts        # Express后端服务
    └── pages/
        ├── Dashboard.tsx      # 仪表盘
        ├── ScoreEditor.tsx    # 曲谱编辑
        └── Tuner.tsx          # 调音器
```
