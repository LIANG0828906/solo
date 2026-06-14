import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StoryPanel from './modules/cooperation/StoryPanel';
import StoryboardGrid from './modules/storyboard/StoryboardGrid';
import ExportPanel from './modules/export/ExportPanel';
import { StoryParagraph, StoryboardPanel } from './types';

function WorkspacePage() {
  const [storyboards, setStoryboards] = useState<StoryboardPanel[]>([]);
  const [paragraphs, setParagraphs] = useState<StoryParagraph[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [title] = useState('未命名创意故事');
  const [participants] = useState(['作者 1', '作者 2']);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const check = () => setIsTablet(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 40%, #334155 100%)',
        padding: '72px 20px 32px',
      }}
    >
      <ExportPanel title={title} participants={participants} panels={storyboards} />

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 16px',
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.35)',
              borderRadius: 999,
              color: '#c4b5fd',
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 14,
              letterSpacing: 0.5,
            }}
          >
            ✨ COLLABORATIVE STORYBOARD STUDIO
          </div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: 8,
              letterSpacing: -0.5,
            }}
          >
            故事接龙 <span style={{ color: '#c4b5fd' }}>×</span> 分镜脚本生成器
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 14, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            像玩桌游一样和伙伴轮流写故事，让 AI 自动为你生成专业漫画分镜脚本，
            <br />
            帮助独立漫画作者快速获取画面灵感
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: isTablet ? 'column' : 'row',
            gap: 20,
          }}
        >
          <div
            style={{
              flex: isTablet ? 'none' : 1,
              width: '100%',
              minWidth: 0,
            }}
          >
            <StoryPanel
              onStoryboardsChange={setStoryboards}
              onParagraphsChange={setParagraphs}
              onGeneratingChange={setIsGenerating}
            />
          </div>
          <div
            style={{
              flex: isTablet ? 'none' : 1.1,
              width: '100%',
              minWidth: 0,
            }}
          >
            <StoryboardGrid panels={storyboards} isGenerating={isGenerating} />
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            padding: '14px 20px',
            background: 'rgba(30,41,59,0.7)',
            border: '1px solid rgba(148,163,184,0.2)',
            borderRadius: 12,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 20,
            justifyContent: 'center',
            fontSize: 12,
            color: '#94a3b8',
          }}
        >
          <div>📊 段落数: <span style={{ color: '#38bdf8', fontWeight: 700 }}>{paragraphs.length}</span></div>
          <div>🎞️ 分镜数: <span style={{ color: '#a78bfa', fontWeight: 700 }}>{storyboards.length}</span></div>
          <div>⚡ 生成状态: <span style={{ color: isGenerating ? '#fbbf24' : '#4ade80', fontWeight: 700 }}>{isGenerating ? 'AI 创作中' : '就绪'}</span></div>
          <div>👥 参与者: <span style={{ color: '#f472b6', fontWeight: 700 }}>{participants.join('、')}</span></div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkspacePage />} />
      </Routes>
    </BrowserRouter>
  );
}
