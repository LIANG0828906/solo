import { useCallback, useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import MosaicGrid from './MosaicGrid';
import { Mood, colorSchemes, moodsList } from './colorSchemes';

function App() {
  const [currentMood, setCurrentMood] = useState<Mood>('happy');
  const [intensity, setIntensity] = useState<number>(78);
  const [animKey, setAnimKey] = useState<string>(`init-${Date.now()}`);
  const [downloading, setDownloading] = useState<boolean>(false);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const scheme = colorSchemes[currentMood];

  useEffect(() => {
    const interval = setInterval(() => {
      setIntensity(Math.floor(60 + Math.random() * 41));
    }, 200);
    return () => clearInterval(interval);
  }, [currentMood]);

  const handleMoodChange = useCallback((mood: Mood) => {
    if (mood === currentMood) return;
    setCurrentMood(mood);
    setAnimKey(`${mood}-${Date.now()}`);
  }, [currentMood]);

  const handleDownload = useCallback(async () => {
    if (!gridRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(gridRef.current, {
        backgroundColor: '#0f0f1a',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `MoodMosaic_${scheme.id}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('导出图片失败:', err);
    } finally {
      setTimeout(() => setDownloading(false), 600);
    }
  }, [downloading, scheme.id]);

  return (
    <div className="app">
      <h1 className="app-title">MoodMosaic</h1>
      <p className="app-subtitle">情感马赛克画板 · 用几何拼贴描绘你的心情</p>

      <div className="mood-tabs">
        {moodsList.map((mood) => {
          const ms = colorSchemes[mood];
          const isActive = mood === currentMood;
          return (
            <button
              key={mood}
              className={`mood-tab${isActive ? ' active' : ''}`}
              onClick={() => handleMoodChange(mood)}
              style={{
                backgroundColor: ms.buttonColor,
                color: isActive ? '#0f0f1a' : '#0f0f1a',
              }}
            >
              {ms.name}
            </button>
          );
        })}
      </div>

      <div className="main-layout">
        <aside className="mood-panel">
          <div className="mood-panel-label">当前情绪</div>
          <div
            className="mood-panel-name"
            style={{
              background: `linear-gradient(135deg, ${scheme.progressColors[0]}, ${scheme.progressColors[1]})`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              textShadow: `0 0 20px ${scheme.progressColors[0]}55`,
            }}
          >
            {scheme.name}
          </div>
          <div className="mood-panel-desc">{scheme.description}</div>

          <div className="mood-intensity-label">
            <span>情绪强度</span>
            <span className="mood-intensity-value">{intensity}%</span>
          </div>
          <div className="mood-progress">
            <div
              className="mood-progress-fill"
              style={{
                width: `${intensity}%`,
                background: `linear-gradient(90deg, ${scheme.progressColors[0]}, ${scheme.progressColors[1]})`,
                boxShadow: `0 0 12px ${scheme.progressColors[0]}99`,
              }}
            />
          </div>
        </aside>

        <div className="grid-wrapper" ref={gridRef}>
          <MosaicGrid scheme={scheme} animKey={animKey} />
        </div>
      </div>

      <button
        className={`download-btn${downloading ? ' loading' : ''}`}
        onClick={handleDownload}
        aria-label="下载马赛克画板"
        title="下载为PNG图片"
      >
        {downloading ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default App;
