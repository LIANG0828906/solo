## 1. 架构设计

```mermaid
graph TD
    subgraph "客户端 (浏览器)"
        A["React App.tsx - 主容器"]
        A --> B["Canvas.tsx - 画布模块"]
        A --> C["ScriptPanel.tsx - 剧本面板"]
        A --> D["Toolbox.tsx - 镜头工具箱"]
        A --> E["Zustand Store - 全局状态"]
    end
    
    subgraph "服务端 (Express)"
        F["pdfService.ts - PDF生成路由"]
        G["shareService.ts - 分享链接逻辑"]
    end
    
    E -->|POST /api/export-pdf| F
    E -->|POST /api/share| G
    F -->|返回PDF Buffer| E
    G -->|返回分享URL| E
```

## 2. 技术描述

- **前端框架**: React 18 + TypeScript 5
- **构建工具**: Vite 5 + @vitejs/plugin-react
- **状态管理**: Zustand 4
- **图标库**: lucide-react
- **后端框架**: Express 4 + TypeScript
- **PDF生成**: PDFKit (Node.js服务端)
- **唯一标识**: uuid
- **跨域处理**: cors
- **样式方案**: 原生CSS + CSS变量，无Tailwind依赖
- **包管理器**: npm

## 3. 路由定义
| 路由 | 方法 | 用途 |
|------|------|------|
| / | GET | 编辑器主页 (Vite SPA) |
| /api/export-pdf | POST | 接收分镜数据生成并返回PDF文件 |
| /api/share | POST | 生成分享链接并存入临时存储 |
| /s/:token | GET | 通过分享链接查看只读版分镜脚本 |

## 4. API 定义

### 4.1 导出PDF接口
```typescript
// POST /api/export-pdf
interface ExportPdfRequest {
  panels: Panel[];
  scriptLines: ScriptLine[];
}

interface ExportPdfResponse {
  success: boolean;
  pdfUrl?: string;
  error?: string;
}
```

### 4.2 分享链接接口
```typescript
// POST /api/share
interface ShareRequest {
  panels: Panel[];
  scriptLines: ScriptLine[];
  expireHours?: number;
}

interface ShareResponse {
  success: boolean;
  shareUrl?: string;
  token?: string;
  error?: string;
}

// GET /s/:token
interface ShareViewResponse {
  valid: boolean;
  panels?: Panel[];
  scriptLines?: ScriptLine[];
  error?: string;
}
```

## 5. 服务器架构图

```mermaid
graph TD
    A["Express App"] --> B["PDF路由 (pdfService.ts)"]
    A --> C["分享路由 (shareService.ts)"]
    B --> D["PDFKit 渲染引擎"]
    D --> E["A4横向布局算法"]
    E --> F["流式返回PDF Buffer"]
    C --> G["内存存储 Map<token, Data>"]
    G --> H["定时清理过期分享数据"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    PANEL {
        string id PK "格子唯一标识"
        number x "左上角X坐标"
        number y "左上角Y坐标"
        number width "宽度 100-800px"
        number height "高度 100-800px"
        number borderRadius "圆角 0-20px"
        string backgroundColor "背景色或transparent"
        string cameraType "镜头类型 8种之一"
        string cameraNote "拍摄说明 最多50字"
        Layer[] layers "图层列表"
    }
    
    LAYER {
        string id PK "图层唯一标识"
        string type "image/text"
        number x "图层相对格子X坐标"
        number y "图层相对格子Y坐标"
        number rotation "旋转角度"
        number scale "缩放比例"
        string content "图片URL或文字内容"
        TextStyle style "文字样式(type=text时)"
    }
    
    TEXT_STYLE {
        string fontFamily "思源黑体/思源宋体/站酷快乐体"
        number fontSize "12-48pt"
        string color "十六进制颜色"
        string textAlign "left/center/right"
    }
    
    SCRIPT_LINE {
        string id PK "句子唯一标识"
        string content "文本内容"
        boolean assigned "是否已分配到格子"
        string targetPanelId "关联格子ID"
    }
```

### 6.2 Zustand Store 状态定义
```typescript
interface EditorState {
  // 分镜格子
  panels: Panel[];
  selectedPanelIds: string[];
  
  // 剧本句子
  scriptLines: ScriptLine[];
  scriptInput: string;
  
  // 选中的图层
  selectedLayerId: string | null;
  selectedPanelIdForCamera: string | null;
  
  // Actions
  addPanel: (panel: Partial<Panel>) => void;
  updatePanel: (id: string, updates: Partial<Panel>) => void;
  deletePanel: (id: string) => void;
  selectPanels: (ids: string[]) => void;
  batchUpdatePanels: (ids: string[], updates: Partial<Panel>) => void;
  
  addLayerToPanel: (panelId: string, layer: Layer) => void;
  updateLayer: (panelId: string, layerId: string, updates: Partial<Layer>) => void;
  removeLayer: (panelId: string, layerId: string) => void;
  
  setScriptInput: (text: string) => void;
  splitScriptToLines: () => void;
  assignScriptLineToPanel: (lineId: string, panelId: string) => void;
  
  setCameraType: (panelId: string, cameraType: string) => void;
  setCameraNote: (panelId: string, note: string) => void;
  
  exportPdf: () => Promise<void>;
  generateShareLink: () => Promise<string | null>;
}
```
