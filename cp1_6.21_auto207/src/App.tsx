import React from 'react';
import { SelectionProvider } from './contexts/SelectionContext';
import { CollectionProvider } from './contexts/CollectionContext';
import SelectionTool from './components/SelectionTool';
import FloatingPanel from './components/FloatingPanel';
import CollectionList from './components/CollectionList';
import ToastContainer from './components/Toast';
import './styles/variables.css';
import './styles/global.css';

const DemoContent: React.FC = () => (
  <div
    style={{
      maxWidth: 900,
      margin: '0 auto',
      padding: '40px 32px',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      lineHeight: 1.75,
    }}
  >
    <header style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 20, marginBottom: 28 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1D4ED8', marginBottom: 8 }}>
        现代 Web 开发最佳实践指南（示例内容）
      </h2>
      <p style={{ color: '#6B7280', fontSize: 14 }}>
        尝试用鼠标拖拽选择下面任意区域来体验片段捕捉功能
      </p>
    </header>

    <section style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
        1. 前端性能优化策略
      </h3>
      <p style={{ fontSize: 15, color: '#374151', marginBottom: 12 }}>
        性能是用户体验的核心组成部分。根据 Google 的研究，页面加载时间超过 3 秒时，
        <strong style={{ color: '#1D4ED8' }}>53% 的移动用户会放弃访问</strong>。
        因此我们需要从以下几个维度进行系统性优化：
      </p>
      <ul style={{ paddingLeft: 24, color: '#374151', fontSize: 14, marginBottom: 16 }}>
        <li style={{ marginBottom: 6 }}><strong>代码分割：</strong>使用 React.lazy 和动态 import 按需加载路由</li>
        <li style={{ marginBottom: 6 }}><strong>图片优化：</strong>WebP/AVIF 格式 + 响应式 srcset + lazy loading</li>
        <li style={{ marginBottom: 6 }}><strong>缓存策略：</strong>HTTP 缓存头 + Service Worker 离线缓存</li>
        <li style={{ marginBottom: 6 }}><strong>渲染优化：</strong>虚拟滚动避免大数据列表卡顿</li>
      </ul>

      <blockquote style={{
        borderLeft: '4px solid #3B82F6',
        padding: '12px 16px',
        backgroundColor: '#EFF6FF',
        borderRadius: '0 8px 8px 0',
        color: '#1E40AF',
        fontStyle: 'italic',
        fontSize: 14,
      }}>
        "性能优化不是一次性任务，而是需要持续关注和监控的日常工作。"
      </blockquote>
    </section>

    <section style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
        2. 设计系统与组件库
      </h3>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <img
            src="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=300&fit=crop"
            alt="设计系统图示"
            style={{ width: '100%', borderRadius: 10, display: 'block' }}
            loading="lazy"
          />
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <p style={{ fontSize: 14, color: '#374151', marginBottom: 10 }}>
            一个成熟的设计系统需要包含以下核心要素：
          </p>
          <table style={{
            width: '100%',
            fontSize: 13,
            borderCollapse: 'collapse',
            background: '#FAFBFC',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            <thead>
              <tr style={{ backgroundColor: '#E0E7FF' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #D1D5DB' }}>要素</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #D1D5DB' }}>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #E5E7EB', fontWeight: 500 }}>设计令牌</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #E5E7EB', color: '#6B7280' }}>颜色、间距、字号等基础变量</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #E5E7EB', fontWeight: 500 }}>原子组件</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #E5E7EB', color: '#6B7280' }}>Button、Input、Card 等</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', fontWeight: 500 }}>模式文档</td>
                <td style={{ padding: '8px 12px', color: '#6B7280' }}>使用场景和最佳实践说明</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
        3. TypeScript 代码示例
      </h3>
      <p style={{ fontSize: 14, color: '#374151', marginBottom: 10 }}>
        使用泛型约束提高类型安全性：
      </p>
      <pre style={{
        backgroundColor: '#1F2937',
        color: '#E5E7EB',
        padding: '16px 20px',
        borderRadius: 10,
        fontSize: 13,
        lineHeight: 1.6,
        overflowX: 'auto',
        fontFamily: "'SF Mono', Consolas, monospace",
      }}>
{`type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
  timestamp: number;
};

async function fetchData<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json: ApiResponse<T> = await res.json();
  if (res.ok) return json.data;
  throw new Error(json.message);
}

// 使用
const user = await fetchData<User>('/api/user/me');`}
      </pre>
    </section>

    <footer style={{
      borderTop: '1px solid #F3F4F6',
      paddingTop: 20,
      textAlign: 'center',
      color: '#9CA3AF',
      fontSize: 13,
    }}>
      🎯 提示：将鼠标放在上面任意文字或图片区域，按住左键拖动试试！
    </footer>
  </div>
);

const App: React.FC = () => {
  return (
    <CollectionProvider>
      <SelectionProvider>
        <div
          style={{
            minHeight: '100vh',
            width: '100%',
            backgroundColor: '#F9FAFB',
          }}
        >
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 40px' }}>
            <SelectionTool>
              <div style={{ padding: '8px 0 32px' }}>
                <DemoContent />
              </div>
            </SelectionTool>

            <CollectionList />
          </div>

          <FloatingPanel />
          <ToastContainer />
        </div>
      </SelectionProvider>
    </CollectionProvider>
  );
};

export default App;
