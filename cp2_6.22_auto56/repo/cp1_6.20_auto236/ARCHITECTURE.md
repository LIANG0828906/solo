# 智能合同生成器 - 架构说明

## 文件结构与职责

```
auto236/
├── package.json                    # 项目依赖和脚本配置
├── vite.config.js                  # Vite构建配置
├── tsconfig.json                   # TypeScript配置
├── tsconfig.node.json              # Node环境TypeScript配置
├── index.html                      # 单页应用入口
└── src/
    ├── main.tsx                    # React应用入口，挂载App组件
    ├── App.tsx                     # 主路由组件，管理页面切换
    ├── types/
    │   └── index.ts                # TypeScript类型定义
    ├── data/
    │   └── templates.ts            # 合同模板数据（3个预设模板）
    ├── utils/
    │   └── pdfGenerator.ts         # PDF生成工具函数
    ├── backend/
    │   └── server.ts               # Express后端服务器
    ├── pages/
    │   ├── Dashboard.tsx           # 模板列表+历史记录页面
    │   ├── Editor.tsx              # 合同编辑器页面
    │   └── HistoryPreview.tsx      # 历史记录PDF预览页面
    └── styles/
        └── global.css              # 全局样式
```

## 数据流向与调用关系

### 1. 启动流程
```
index.html → main.tsx → App.tsx → Dashboard.tsx
```

### 2. Dashboard页面数据流
```
Dashboard.tsx ──GET /api/templates──→ server.ts
            ←──模板列表JSON───
            ──GET /api/history────→ server.ts
            ←──历史记录JSON───
```

### 3. 编辑器页面数据流
```
Editor.tsx ──GET /api/templates/:id──→ server.ts
         ←──模板详情JSON──────
         
用户填写变量 → 点击"生成PDF"
         ↓
Editor.tsx ──POST /api/generate──→ server.ts
         │                        │
         │                        ├─ validateVariables() 校验
         │                        ├─ generatePDFBase64() 生成PDF
         │                        └─ 保存到内存history
         ↓
         ←──PDF Base64 + historyId──
         │
         ├─ 显示PDF预览（iframe）
         └─ 点击下载 → downloadPDF() 触发浏览器下载
```

### 4. PDF生成流程
```
server.ts / Editor.tsx
         ↓
generatePDFBase64(templateId, variables)
         ↓
generatePDF() 调用jspdf
         ↓
替换模板变量 {{variable}} → 格式化金额中文大写
         ↓
设置字体（Helvetica）、标题（16pt加粗）、正文（12pt，行距1.5）
         ↓
返回PDF文档对象 / Base64字符串
```

### 5. 历史记录预览
```
HistoryPreview.tsx ──GET /api/history/:id──→ server.ts
                 ←──历史记录（含PDF Base64）──
                 │
                 └─ 显示PDF预览 + 下载按钮
```

## API接口说明

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/templates | 获取所有模板列表 |
| GET | /api/templates/:id | 获取单个模板详情 |
| POST | /api/generate | 生成PDF并保存历史记录 |
| GET | /api/history | 获取历史记录列表（按时间倒序） |
| GET | /api/history/:id | 获取单条历史记录详情 |
| GET | /api/health | 健康检查 |

## 性能优化点

1. **PDF生成性能**：使用jspdf同步生成，性能<500ms
2. **内存存储**：历史记录最多50条，超出自动删除最早记录
3. **前端状态管理**：局部状态，避免不必要的重渲染
4. **输入校验**：实时清除错误，提升用户体验

## 验证规则

- 必填项：非空校验
- 金额字段：正浮点数，>0
- 日期字段：不早于当前日期
- 格式错误：边框变红+错误提示
