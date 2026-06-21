## 1. 架构设计

```mermaid
graph TD
    A["用户界面层"] --> B["状态管理层"]
    B --> C["工具函数层"]
    A --> C
    
    subgraph "用户界面层"
        A1["App.tsx 主布局
        左侧令牌面板 + 右侧预览区"]
        A2["TokenPanel.tsx 令牌编辑
        分组展示/新增/编辑/删除"]
        A3["PreviewArea.tsx 组件预览
        按钮/卡片/标题/输入框"]
    end
    
    subgraph "状态管理层"
        B1["tokenStore.ts
        Zustand 全局状态
        令牌数据管理"]
    end
    
    subgraph "工具函数层"
        C1["export.ts
        JSON/CSS导出
        数据校验"]
        C2["types.ts
        类型定义"]
    end
```

## 2. 技术描述

- 前端：React@18 + TypeScript@5 + Vite@5
- 状态管理：Zustand（轻量级状态管理）
- 构建工具：Vite + @vitejs/plugin-react
- 依赖库：uuid（唯一ID生成）、file-saver（文件下载）
- 无后端，数据存储在内存中

## 3. 目录结构

```
d:\Pro\tasks\auto122
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx          # React应用入口
    ├── App.tsx         # 主布局组件
    ├── TokenPanel.tsx  # 左侧令牌编辑面板
    ├── PreviewArea.tsx # 右侧组件预览区
    ├── store/
    │   └── tokenStore.ts  # 令牌状态管理
    ├── types/
    │   └── index.ts     # TypeScript类型定义
    └── utils/
        └── export.ts    # 导出工具函数
```

## 4. 数据流向

```mermaid
flowchart LR
    A["用户操作
    (新增/编辑/删除)"] --> B["TokenPanel.tsx"]
    B --> C["tokenStore
    更新状态"]
    C --> D["App.tsx
    接收新状态"]
    D --> E["PreviewArea.tsx
    重新渲染"]
    F["导出按钮"] --> G["export.ts
    校验+格式化"]
    C --> G
    G --> H["下载文件"]
```

## 5. 数据模型

### 5.1 数据模型定义

```mermaid
erDiagram
    TOKEN {
        string id "PK, 唯一标识"
        string name "令牌名称"
        string group "所属分组"
        string type "类型: color/spacing/font"
        string value "令牌值"
    }
```

### 5.2 类型定义

```typescript
type TokenType = 'color' | 'spacing' | 'font';

interface Token {
  id: string;
  name: string;
  group: string;
  type: TokenType;
  value: string;
}

interface TokenStore {
  tokens: Token[];
  addToken: (token: Omit<Token, 'id'>) => void;
  updateToken: (id: string, updates: Partial<Token>) => void;
  deleteToken: (id: string) => void;
}
```

### 5.3 初始数据

- 6个颜色令牌（主色、次色、背景色、文字色、边框色、成功色
- 4个间距令牌（xs、sm、md、lg）
- 2个字体令牌（字体族、字号）
