## 1. 架构设计

```mermaid
graph TD
    subgraph "前端应用"
        A["App.tsx (主应用组件)"] --> B["ColorInput.tsx (颜色输入模块)"]
        A --> C["ColorDisplay.tsx (颜色展示模块)"]
        B --> D["parser.ts (颜色解析工具)"]
        C --> E["export.ts (导出工具)"]
        A --> F["ThemeContext (主题状态)"]
        A --> G["FavoritesContext (收藏状态)"]
    end
    subgraph "工具层
        D --> H["css-tree (CSS解析库)"]
        E --> I["file-saver (文件下载)"]
    end
```

## 2. 技术描述
- **前端框架**：React@18 + TypeScript
- **构建工具**：Vite
- **状态管理**：React Context API
- **CSS解析**：css-tree
- **文件下载**：file-saver
- **唯一ID**：uuid
- **HTTP请求**：axios（预留）

## 3. 文件结构
```
src/
├── App.tsx              # 主应用组件，主题和收藏状态管理
├── modules/
│   ├── ColorInput.tsx  # 颜色输入模块
│   └── ColorDisplay.tsx # 颜色展示与收藏模块
└── utils/
    ├── parser.ts       # 颜色解析工具
    └── export.ts       # 导出工具
```

## 4. 数据模型

### 4.1 颜色对象
```typescript
interface ColorItem {
  id: string;
  value: string;
  format: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla';
}
```

### 4.2 主题类型
```typescript
type ThemeType = 'light' | 'dark' | 'high-contrast';
```

## 5. 核心功能实现方案

### 5.1 颜色解析
- 使用 css-tree 解析CSS字符串为AST
- 遍历AST提取所有颜色节点
- 支持十六进制、rgb、rgba、hsl、hsla格式
- 去重处理
- 使用 requestIdleCallback 保证不阻塞UI

### 5.2 主题系统
- 通过 Context 提供主题状态
- 三套主题配色方案
- CSS变量实现主题切换
- 0.3s过渡动画

### 5.3 收藏功能
- 多选颜色添加到收藏
- 拖拽排序（原生拖拽API）
- 导出为CSS变量字符串
- 导出为JSON文件下载

### 5.4 性能优化
- 颜色解析使用 requestIdleCallback
- 组件 memo 优化重渲染
- 大文件分片处理
