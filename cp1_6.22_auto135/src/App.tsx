import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { FieldProvider, useFieldContext } from './modules/field/FieldPanel';
import FieldPanel from './modules/field/FieldPanel';
import { RuleProvider } from './modules/rules/RuleConfigPanel';
import RuleConfigPanel from './modules/rules/RuleConfigPanel';
import PreviewPanel from './modules/preview/PreviewPanel';
import { exportToJSON } from './modules/rules/validationEngine';
import { PreviewMode } from './types';

const AppContent: React.FC = () => {
  const [mode, setMode] = useState<PreviewMode>('config');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const { fields, selectedFieldId } = useFieldContext();

  useEffect(() => {
    setMode('config');
  }, [selectedFieldId]);

  const handleExportJSON = () => {
    const json = exportToJSON(fields);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    saveAs(blob, 'validation-rules.json');
  };

  return (
    <div className="app-container">
      <nav className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileDrawerOpen(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            菜单
          </button>
          <h1>智能表单验证规则配置器</h1>
        </div>
      </nav>

      <div className="main-layout">
        <FieldPanel
          isMobileOpen={isMobileDrawerOpen}
          onMobileClose={() => setIsMobileDrawerOpen(false)}
        />

        {isMobileDrawerOpen && (
          <div
            className={`mobile-drawer-overlay ${isMobileDrawerOpen ? 'open' : ''}`}
            onClick={() => setIsMobileDrawerOpen(false)}
          />
        )}

        <div className="main-content">
          {mode === 'config' ? (
            <RuleConfigPanel />
          ) : (
            <PreviewPanel onBack={() => setMode('config')} />
          )}

          <div className="bottom-bar">
            {mode === 'config' && (
              <button
                className="preview-toggle-btn"
                onClick={() => setMode('preview')}
                disabled={!selectedFieldId}
                title={!selectedFieldId ? '请先选择一个字段' : '预览校验效果'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                预览校验
              </button>
            )}
            {mode === 'preview' && (
              <button
                className="preview-toggle-btn"
                onClick={() => setMode('config')}
                style={{ background: '#64748B' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                返回配置
              </button>
            )}
            <button
              className="export-btn"
              onClick={handleExportJSON}
              disabled={fields.length === 0}
              title={fields.length === 0 ? '请先添加字段' : '导出JSON配置'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              导出JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <FieldProvider>
      <RuleProvider>
        <AppContent />
      </RuleProvider>
    </FieldProvider>
  );
};

export default App;
