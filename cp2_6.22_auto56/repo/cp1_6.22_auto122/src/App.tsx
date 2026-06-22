import { useState, useCallback } from 'react';
import TokenPanel from './TokenPanel';
import PreviewArea from './PreviewArea';
import { useTokenStore } from './store/tokenStore';
import { exportJson, exportCss } from './utils/export';
import type { ValidationError } from './types';

export default function App() {
  const tokens = useTokenStore((state) => state.tokens);
  const [error, setError] = useState<string | null>(null);

  const showError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 3000);
  }, []);

  const handleExportJson = useCallback(() => {
    const result = exportJson(tokens) as ValidationError | null;
    if (result) {
      showError(result.message);
    }
  }, [tokens, showError]);

  const handleExportCss = useCallback(() => {
    const result = exportCss(tokens) as ValidationError | null;
    if (result) {
      showError(result.message);
    }
  }, [tokens, showError]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#E0E0F0' }}>
          设计令牌管理工具
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleExportJson}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6366F1',
              color: '#fff',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#818CF8')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6366F1')}
          >
            导出JSON
          </button>
          <button
            onClick={handleExportCss}
            style={{
              padding: '8px 16px',
              backgroundColor: '#8B5CF6',
              color: '#fff',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#A78BFA')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#8B5CF6')}
          >
            导出CSS
          </button>
        </div>
      </header>

      <div className="app-main">
        <div className="token-panel-wrapper">
          <TokenPanel />
        </div>
        <div className="preview-area-wrapper">
          <PreviewArea tokens={tokens} />
        </div>
      </div>

      {error && (
        <div className="error-toast">
          {error}
        </div>
      )}
    </div>
  );
}
