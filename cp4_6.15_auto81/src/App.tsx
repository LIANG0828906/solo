import React, { useState, useEffect } from 'react';
import { PasswordProvider, usePassword } from './context/PasswordContext';
import { StrengthMeter } from './components/StrengthMeter';
import { DimensionRings } from './components/DimensionRings';
import { CharFrequencyChart } from './components/CharFrequencyChart';
import { CrackTimeChart } from './components/CrackTimeChart';
import './index.css';

const PasswordInput: React.FC = () => {
  const { password, setPassword, loadRandomCommonPassword } = usePassword();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (password) {
      const perfTime = performance.now();
      console.log(`[性能监控] 分析耗时: ${(performance.now() - perfTime).toFixed(2)}ms`);
    }
  }, [password]);

  const handleCommonPasswordClick = () => {
    setIsAnimating(true);
    setTimeout(() => {
      loadRandomCommonPassword();
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }, 150);
  };

  return (
    <div className="password-input-section">
      <div className="input-wrapper">
        <button
          className="common-password-btn"
          onClick={handleCommonPasswordClick}
          title="从常见密码库随机选择"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0110 0v4"></path>
          </svg>
          <span>常见密码库</span>
        </button>
        <div className={`input-container ${isAnimating ? 'flip-in' : ''}`}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码进行分析..."
            className="password-input"
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="button"
            className="toggle-visibility"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? '隐藏密码' : '显示密码'}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            )}
          </button>
        </div>
      </div>
      {password && (
        <div className="password-preview">
          <span className="preview-label">当前密码:</span>
          <span className="preview-value">{showPassword ? password : '•'.repeat(password.length)}</span>
          <span className="preview-length">({password.length} 字符)</span>
        </div>
      )}
    </div>
  );
};

const AnalysisPanel: React.FC = () => {
  const { result } = usePassword();

  if (!result) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0110 0v4"></path>
          </svg>
        </div>
        <h2>开始分析您的密码</h2>
        <p>在上方输入框中输入密码，或点击"常见密码库"按钮查看示例</p>
      </div>
    );
  }

  return (
    <div className="analysis-panel">
      <div className="top-section">
        <div className="meter-section">
          <StrengthMeter
            entropy={result.entropy}
            strengthLevel={result.strengthLevel}
            strengthText={result.strengthText}
          />
        </div>
        <div className="rings-section">
          <DimensionRings
            scores={result.dimensionScores}
            entropy={result.entropy}
          />
        </div>
      </div>
      <div className="charts-section">
        <div className="chart-wrapper">
          <CharFrequencyChart data={result.charFrequencies} />
        </div>
        <div className="chart-wrapper">
          <CrackTimeChart data={result.crackTimes} />
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>
          <span className="title-icon">🔐</span>
          密码强度可视化分析仪
        </h1>
        <p className="subtitle">实时分析密码熵值、字符构成与暴力破解时间</p>
      </header>
      <main className="app-main">
        <PasswordInput />
        <AnalysisPanel />
      </main>
      <footer className="app-footer">
        <p>© 2026 密码强度分析仪 · 所有分析均在本地执行，密码不会上传</p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <PasswordProvider>
      <AppContent />
    </PasswordProvider>
  );
};

export default App;
