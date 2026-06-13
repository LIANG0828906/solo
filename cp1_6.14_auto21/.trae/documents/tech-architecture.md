## 1. 架构设计

```mermaid
flowchart TB
    "Frontend[前端 Vue 3 + TypeScript + Vite]" --> "Components[组件层]"
    "Components" --> "EditorPanel[编辑面板]"
    "Components" --> "ResumePreview[简历预览]"
    "Components" --> "RadarChart[雷达图]"
    "Components" --> "PhotoGallery[作品集]"
    "EditorPanel" -->|"emit 数据更新"| "App[App.vue 状态管理]"
    "App" -->|"props 传递"| "ResumePreview"
    "App" -->|"props 传递"| "RadarChart"
    "App" -->|"props 传递"| "PhotoGallery"
    "Utils[工具模块]" --> "ThemeModule[主题配置 theme.ts]"
    "ThemeModule" -->|"提供配色/字体映射"| "ResumePreview"
    "ThemeModule" -->|"提供渐变色配置"| "RadarChart"
```

## 2. 技术说明

- 前端：Vue 3@3 + TypeScript + Vite
- 初始化工具：vite-init（vue-ts 模板）
- UI样式：Tailwind CSS
- 图表：D3.js@7 绘制SVG雷达图
- 工具库：@vueuse/core（拖拽调节、响应式判断等）
- 图标：lucide-vue-next
- 无后端，纯前端项目

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 简历编辑器主页面（编辑+预览） |

## 4. 数据模型

### 4.1 核心数据结构

```typescript
interface PersonalInfo {
  name: string
  title: string
  email: string
  phone: string
  location: string
  bio: string
}

interface WorkExperience {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  description: string
  expanded: boolean
}

interface Education {
  id: string
  school: string
  major: string
  startDate: string
  endDate: string
  description: string
}

interface Skill {
  name: string
  level: number
}

interface ProjectPhoto {
  id: string
  original: string
  thumbnail: string
}

interface ResumeData {
  personalInfo: PersonalInfo
  workExperience: WorkExperience[]
  education: Education[]
  skills: Skill[]
  photos: ProjectPhoto[]
}

interface ThemeConfig {
  id: string
  name: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  bgColor: string
  textColor: string
  headingFont: string
  bodyFont: string
  radarGradient: [string, string]
}
```

### 4.2 文件结构

```
├── package.json
├── index.html
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── App.vue
│   ├── main.ts
│   ├── components/
│   │   ├── EditorPanel.vue
│   │   ├── ResumePreview.vue
│   │   ├── RadarChart.vue
│   │   └── PhotoGallery.vue
│   └── utils/
│       └── theme.ts
```

## 5. 组件职责

| 组件 | 职责 |
|------|------|
| App.vue | 管理简历数据状态、当前主题选择、左右分栏布局 |
| EditorPanel.vue | 编辑器侧栏，处理用户输入并emit数据更新，支持宽度拖拽调节 |
| ResumePreview.vue | 根据数据和主题渲染简历，监听数据变化触发动画，工作经历折叠展开，时间倒序排列 |
| RadarChart.vue | 使用D3绘制SVG雷达图，渐变色填充，接收技能数据并增量更新 |
| PhotoGallery.vue | 瀑布流布局展示缩略图，内置Canvas裁剪压缩逻辑，灯箱预览与左右滑动切换 |
| theme.ts | 定义三套主题配色和样式映射（雾霾蓝专业风、暖橙创意风、墨绿学术风） |

## 6. 关键技术方案

### 6.1 模板切换性能优化

- 使用CSS transition实现淡入淡出（opacity + transform），避免JavaScript动画
- D3雷达图使用enter/update/exit模式增量更新
- 模板切换仅改变CSS变量，不重新创建DOM

### 6.2 图片裁剪压缩

- 使用Canvas API将上传图片裁剪为16:9比例
- 先缩放再压缩，通过quality参数控制输出质量
- 递归压缩直到文件大小 < 500KB
- 使用requestAnimationFrame分帧处理避免UI卡顿

### 6.3 瀑布流布局

- 使用CSS columns或JavaScript计算列高度实现瀑布流
- 缩略图使用object-fit: cover保持16:9比例

### 6.4 拖拽调节宽度

- 使用@vueuse/core的useDraggable或自定义拖拽逻辑
- 限制侧栏最小/最大宽度
