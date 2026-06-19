import { Routes, Route } from 'react-router-dom';
import DocumentPanel from './components/DocumentPanel';
import TranslationPanel from './components/TranslationPanel';
import { useDocumentStore } from './store/useDocumentStore';
import ExportDialog from './components/ExportDialog';
import { useState } from 'react';

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default function App() {
  const { paragraphs, translations, currentUser, meta } = useDocumentStore();
  const [showExport, setShowExport] = useState(false);

  const translatedCount = paragraphs.filter((p) => translations[p.id]?.trim()).length;
  const progress = paragraphs.length > 0 ? (translatedCount / paragraphs.length) * 100 : 0;

  const avatarStyle: React.CSSProperties = currentUser.avatarUrl
    ? {
        backgroundImage: `url(${currentUser.avatarUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: `linear-gradient(135deg, ${currentUser.color} 0%, ${adjustColor(currentUser.color, -25)} 100%)`,
      };

  return (
    <div className="app-root">
      <header className="navbar">
        <div className="nav-left">
          <div className="logo">📜 译云协作</div>
          <span className="nav-subtitle">多语言文档翻译与协作平台</span>
        </div>
        <div className="nav-progress">
          <div className="progress-label">
            翻译进度：{translatedCount} / {paragraphs.length || 0}（{progress.toFixed(0)}%）
            {meta?.fileName && <span className="progress-filename"> · {meta.fileName}</span>}
          </div>
          <div className="progress-bar-wrapper">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="nav-right">
          <button
            className="btn btn-export"
            onClick={() => setShowExport(true)}
            disabled={paragraphs.length === 0}
          >
            📤 导出
          </button>
          <button className="btn-icon" title="设置">
            ⚙️
          </button>
          <div
            className="avatar"
            title={`当前用户：${currentUser.name}`}
            style={avatarStyle}
          >
            {!currentUser.avatarUrl && currentUser.initials}
          </div>
        </div>
      </header>

      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <div className="panels-container">
                <DocumentPanel />
                <TranslationPanel />
              </div>
            }
          />
        </Routes>
      </main>

      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
    </div>
  );
}
