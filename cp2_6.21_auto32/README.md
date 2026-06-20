# 品牌情绪板视觉设计工具

一款面向创意设计师的在线品牌情绪板制作工具，支持图片/图形拖拽编辑、智能色彩提取和多种图层混合模式。

## 功能特性

- **画布自由编辑**：支持拖拽移动、8点缩放、旋转手柄控制，双击删除元素
- **智能色彩提取**：基于 K-Means 聚类算法从图片中提取 5 种主题色
- **颜色手动编辑**：点击色块弹出拾色器，支持 HEX 输入和命名
- **图层混合模式**：正常、正片叠底、滤色、叠加、变亮、变暗 6 种模式
- **历史记录**：最多 20 步撤销/重做，支持键盘快捷键
- **导出 PNG**：一键导出完整情绪板为 PNG 图片
- **响应式布局**：支持桌面端与小屏自适应

## 快速开始

```bash
npm install
npm run dev
```

访问浏览器中显示的本地地址即可使用。

## 项目结构

```
src/
├── App.tsx                     # 根组件，布局容器 + 全局键盘事件
├── components/
│   ├── Toolbar.tsx             # 左侧工具栏（添加图形/导入图片/导出/撤销重做）
│   ├── Canvas.tsx              # 主画布（交互逻辑 + Canvas 渲染）
│   └── ColorPalette.tsx        # 右侧调色板（色块 + 编辑 + 拾色器）
├── core/
│   └── canvasEngine.ts         # 画布渲染引擎：drawLayers / 选择手柄 / 命中检测
├── utils/
│   └── colorExtractor.ts       # 色彩提取：K-Means 聚类算法
├── store/
│   └── useStore.ts             # Zustand 全局状态管理（图层、颜色、历史）
└── index.css                   # 全局样式（毛玻璃、渐变、响应式）
```

## 数据流向

```
Toolbar ──操作指令──▶ useStore ──图层变化──▶ Canvas ──▶ canvasEngine 渲染
                                                         │
ColorPalette ◀──颜色样本── useStore ◀──提取结果── colorExtractor ◀── 选中图片
```

## 技术栈

- React 18 + TypeScript
- Vite 构建
- Zustand 状态管理
- react-colorful 拾色器
- react-dropzone 文件上传
- react-icons 图标库
- HTML5 Canvas 2D 渲染
- K-Means++ 聚类算法

## 快捷键

| 操作 | 快捷键 |
|------|--------|
| 撤销 | Ctrl + Z |
| 重做 | Ctrl + Shift + Z (或 Ctrl + Y) |
| 删除图层 | 双击图层 |

## 混合模式说明

| 模式 | 说明 |
|------|------|
| 正常 | 默认叠加效果 |
| 正片叠底 | 结果颜色变暗，适合叠加阴影 |
| 滤色 | 结果颜色变亮，适合叠加高光 |
| 叠加 | 增强对比度，保留明暗关系 |
| 变亮 | 取两者较亮颜色 |
| 变暗 | 取两者较暗颜色 |
