import React, { useState } from 'react';
import Dashboard from '@/Dashboard';
import LogForm from '@/LogForm';
import RecordList from '@/RecordList';
import Toast from '@/components/Toast';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
  const [formCollapsed, setFormCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-coffee-50">
      <Toast />

      <header className="border-b border-coffee-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="32" cy="50" rx="18" ry="6" fill="#8D6E63" opacity="0.3" />
              <path d="M20 20h24l-3 26H23L20 20z" stroke="#3E2723" strokeWidth="2.5" fill="#F5E6D3" />
              <path d="M44 24h4c3 0 5 3 4 6s-6 2-6 2" stroke="#FFBF00" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M20 16h24" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <div>
              <h1 className="font-display text-xl font-bold text-coffee-900 leading-tight">Coffee Brew Log</h1>
              <p className="text-xs text-coffee-500">记录每一杯，精进每一次</p>
            </div>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-amber text-coffee-900 font-semibold'
                  : 'text-coffee-600 hover:bg-coffee-100'
              }`}
            >
              看板
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                activeTab === 'list'
                  ? 'bg-amber text-coffee-900 font-semibold'
                  : 'text-coffee-600 hover:bg-coffee-100'
              }`}
            >
              记录
            </button>
            <button
              onClick={() => setFormCollapsed(!formCollapsed)}
              className="ml-2 w-9 h-9 rounded-lg bg-coffee-100 text-coffee-700 flex items-center justify-center hover:bg-coffee-200 transition-colors"
              aria-label={formCollapsed ? '展开表单' : '收起表单'}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ transform: formCollapsed ? 'rotate(180deg)' : '', transition: 'transform 200ms' }}
              >
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3 space-y-6">
            <div className="hidden md:block">
              <Dashboard />
            </div>

            {activeTab === 'dashboard' && (
              <div className="md:hidden animate-fade_in">
                <Dashboard />
              </div>
            )}
            {activeTab === 'list' && (
              <div className="md:hidden animate-fade_in">
                <RecordList />
              </div>
            )}

            <div className="hidden md:block">
              <RecordList />
            </div>
          </div>

          <div className="md:col-span-2">
            <div className={`md:sticky md:top-20 transition-all duration-300 ${formCollapsed && 'hidden md:block'}`}>
              {formCollapsed && (
                <div className="md:hidden mb-3">
                  <button
                    onClick={() => setFormCollapsed(false)}
                    className="w-full py-2.5 bg-coffee-100 hover:bg-coffee-200 text-coffee-700 rounded-xl font-medium text-sm transition-colors"
                  >
                    ▲ 展开冲煮表单
                  </button>
                </div>
              )}
              <LogForm />
              {formCollapsed && (
                <div className="hidden md:hidden mt-3">
                  <button
                    onClick={() => setFormCollapsed(true)}
                    className="w-full py-2 text-coffee-500 hover:text-coffee-700 text-sm transition-colors"
                  >
                    收起表单
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
