import React, { useState, useEffect } from 'react';
import { GardenDashboard } from './modules/garden/GardenDashboard';
import { ReportGenerator } from './modules/report/ReportGenerator';

type TabKey = 'garden' | 'report';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('garden');
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 10);
    return () => clearTimeout(timer);
  }, [activeTab]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F6F0' }}>
      <nav
        className="sticky top-0 z-40 bg-white shadow-sm"
        style={{ height: '56px' }}
      >
        <div className="max-w-6xl mx-auto h-full px-4 flex items-center">
          <div className="flex items-center gap-2 mr-8">
            <span className="text-2xl">🌱</span>
            <span className="font-bold text-gray-800 text-lg">虚拟菜畦</span>
          </div>
          <div className="flex h-full">
            {([
              { key: 'garden', label: '菜畦', icon: '🌿' },
              { key: 'report', label: '报告', icon: '📊' },
            ] as { key: TabKey; label: string; icon: string }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative h-full px-5 text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.key ? 'text-gray-800' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.key && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t"
                    style={{ backgroundColor: '#4CAF50' }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div
          style={{
            opacity: animate ? 1 : 0,
            transform: animate ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
          }}
        >
          {activeTab === 'garden' ? <GardenDashboard /> : <ReportGenerator />}
        </div>
      </main>
    </div>
  );
}
