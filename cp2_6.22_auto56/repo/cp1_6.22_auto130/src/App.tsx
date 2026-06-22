import React, { useState, useCallback } from 'react';
import { SandboxRenderer } from './moduleA/sandbox/SandboxRenderer';
import { PropsEditor } from './moduleA/components/PropsEditor';
import { MockDataEditor } from './moduleB/mock/MockDataEditor';
import { EventLogPanel } from './moduleC/components/EventLogPanel';
import type { ActiveTab } from './types';

const tabs: { key: ActiveTab; label: string }[] = [
  { key: 'props', label: '组件属性' },
  { key: 'mock', label: 'Mock数据源' },
  { key: 'logs', label: '事件日志' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('props');

  const getTabTransform = useCallback(() => {
    const index = tabs.findIndex((t) => t.key === activeTab);
    return `translateX(-${index * 33.333}%)`;
  }, [activeTab]);

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        padding: '16px',
        backgroundColor: 'var(--bg-page)',
      }}
    >
      <SandboxRenderer />

      <div
        className="custom-scrollbar"
        style={{
          width: 'var(--panel-width)',
          height: '100%',
          flexShrink: 0,
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content-wrapper">
          <div
            className="tab-content"
            style={{ transform: getTabTransform() }}
          >
            <div className="tab-panel custom-scrollbar">
              <PropsEditor />
            </div>
            <div className="tab-panel custom-scrollbar">
              <MockDataEditor />
            </div>
            <div className="tab-panel custom-scrollbar">
              <EventLogPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
