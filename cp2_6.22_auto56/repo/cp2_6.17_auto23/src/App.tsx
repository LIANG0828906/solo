import { useState, useRef, useEffect } from 'react';
import MindMap from './components/MindMap';
import { useMindMapStore } from './store/mindMapStore';

const DEFAULT_MARKDOWN = `# 现代前端开发实践指南

## 一、项目架构设计

### 1.1 模块化组织原则
### 1.2 目录结构最佳实践
### 1.3 状态管理方案选择

## 二、组件开发规范

### 2.1 函数组件与类组件
### 2.2 Props接口类型定义
### 2.3 组合式组件设计模式
### 2.4 性能优化关键点

## 三、样式体系建设

### 3.1 CSS-in-JS方案对比
### 3.2 设计系统与主题变量
### 3.3 响应式布局实现

## 四、测试与质量保障

### 4.1 单元测试策略
### 4.2 端到端测试流程
### 4.3 代码规范与Lint配置

## 五、构建与部署

### 5.1 Vite构建优化技巧
### 5.2 持续集成流水线
### 5.3 线上监控与错误追踪
`;

export default function App() {
  const [inputText, setInputText] = useState(DEFAULT_MARKDOWN);
  const setText = useMindMapStore((state) => state.setText);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasGeneratedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasGeneratedRef.current && containerRef.current) {
        const rightPanel = containerRef.current.querySelector('[data-canvas-panel]') as HTMLElement;
        if (rightPanel) {
          const rect = rightPanel.getBoundingClientRect();
          const center = {
            x: rect.width / 2,
            y: rect.height / 2,
          };
          setText(DEFAULT_MARKDOWN, center);
          hasGeneratedRef.current = true;
        }
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [setText]);

  const handleGenerate = () => {
    if (!containerRef.current) return;

    const rightPanel = containerRef.current.querySelector('[data-canvas-panel]') as HTMLElement;
    if (!rightPanel) return;

    const rect = rightPanel.getBoundingClientRect();
    const center = {
      x: rect.width / 2,
      y: rect.height / 2,
    };

    setText(inputText, center);
    hasGeneratedRef.current = true;
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF',
      }}
    >
      <div
        style={{
          width: 360,
          flexShrink: 0,
          borderRight: '1px solid #E0E0E0',
          display: 'flex',
          flexDirection: 'column',
          padding: 24,
          backgroundColor: '#FFFFFF',
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#1a1a1a',
              marginBottom: 6,
              letterSpacing: '-0.3px',
            }}
          >
            MindMapper
          </h1>
          <p
            style={{
              fontSize: 13,
              color: '#888888',
              lineHeight: 1.5,
            }}
          >
            粘贴 Markdown 文章，自动生成交互式思维导图
          </p>
        </div>

        <label
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#555555',
            marginBottom: 8,
          }}
        >
          Markdown 文本
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="在此粘贴Markdown文章..."
          style={{
            width: '100%',
            height: 400,
            resize: 'none',
            padding: 12,
            borderRadius: 4,
            border: '1px solid #CCC',
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            fontSize: 12.5,
            lineHeight: 1.7,
            color: '#333333',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            marginBottom: 16,
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#4A90D9';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74, 144, 217, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#CCC';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />

        <button
          onClick={handleGenerate}
          style={{
            width: '100%',
            height: 42,
            borderRadius: 6,
            backgroundColor: '#4A90D9',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#357ABD';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4A90D9';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.98)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M4.93 4.93l2.83 2.83" />
            <path d="M16.24 16.24l2.83 2.83" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
            <path d="M4.93 19.07l2.83-2.83" />
            <path d="M16.24 7.76l2.83-2.83" />
          </svg>
          生成导图
        </button>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: 24,
            borderTop: '1px solid #F0F0F0',
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: '#AAAAAA',
              lineHeight: 1.8,
            }}
          >
            <div style={{ marginBottom: 8, fontWeight: 500, color: '#888888' }}>
              使用说明
            </div>
            <div>• 支持 H1/H2/H3 三级标题结构</div>
            <div>• 拖拽节点可自由排列位置</div>
            <div>• 点击节点可折叠或展开子节点</div>
            <div>• 鼠标悬停查看完整标题文本</div>
          </div>
        </div>
      </div>

      <div
        data-canvas-panel
        style={{
          flex: 1,
          position: 'relative',
          minWidth: 0,
        }}
      >
        <MindMap />
      </div>
    </div>
  );
}
