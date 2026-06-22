import { useState, useCallback, useEffect } from 'react';
import PoemEditor from './components/PoemEditor';
import VisualCanvas from './components/VisualCanvas';
import { generatePoem } from './utils/poemGenerator';
import { PoemLine, MoodMode, moodSchemes, detectSentiment, Sentiment } from './types';

export default function App() {
  const [theme, setTheme] = useState<string>('月色');
  const [poem, setPoem] = useState<PoemLine[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [moodMode, setMoodMode] = useState<MoodMode>('calm');
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editedLineText, setEditedLineText] = useState<string>('');
  const [updatedLineIds, setUpdatedLineIds] = useState<Set<string>>(new Set());
  const [sentiment, setSentiment] = useState<Sentiment>('melancholy');

  const colorScheme = moodSchemes[moodMode];
  const animationSpeed = moodMode === 'passionate' ? 1.6 : 1;

  const handleGenerate = useCallback(async () => {
    if (!theme.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const detected = detectSentiment(theme);
      setSentiment(detected);
      const lines = await generatePoem(theme, detected);
      setPoem(lines);
      setUpdatedLineIds(new Set());
    } finally {
      setIsGenerating(false);
    }
  }, [theme, isGenerating]);

  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditLine = useCallback((lineId: string, newText: string) => {
    setPoem((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, text: newText } : line))
    );
    setUpdatedLineIds((prev) => {
      const next = new Set(prev);
      next.add(lineId);
      return next;
    });
  }, []);

  const handleLineClick = useCallback((lineId: string) => {
    const line = poem.find((l) => l.id === lineId);
    if (line) {
      setEditingLineId(lineId);
      setEditedLineText(line.text);
    }
  }, [poem]);

  const handleEditChange = useCallback((text: string) => {
    setEditedLineText(text);
  }, []);

  const handleEditConfirm = useCallback(() => {
    if (editingLineId && editedLineText.trim()) {
      handleEditLine(editingLineId, editedLineText.trim());
    }
    setEditingLineId(null);
    setEditedLineText('');
  }, [editingLineId, editedLineText, handleEditLine]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'row',
        background: `linear-gradient(135deg, ${colorScheme.bgGradient[0]} 0%, ${colorScheme.bgGradient[1]} 50%, ${colorScheme.bgGradient[2]} 100%)`,
        transition: 'background 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}
    >
      <div style={styles.modeSelector}>
        <button
          onClick={() => setMoodMode('calm')}
          style={{
            ...styles.modeBtn,
            ...(moodMode === 'calm' ? styles.modeBtnActive : {})
          }}
        >
          <span style={styles.modeIcon}>☾</span>
          <span style={styles.modeLabel}>宁静风</span>
        </button>
        <button
          onClick={() => setMoodMode('passionate')}
          style={{
            ...styles.modeBtn,
            ...(moodMode === 'passionate' ? styles.modeBtnActivePassionate : {})
          }}
        >
          <span style={styles.modeIcon}>✧</span>
          <span style={styles.modeLabel}>热烈风</span>
        </button>
      </div>

      <div style={styles.editorContainer}>
        <PoemEditor
          theme={theme}
          onThemeChange={setTheme}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          poem={poem}
          onEditLine={handleEditLine}
        />
      </div>

      <div style={styles.canvasContainer}>
        <VisualCanvas
          poem={poem}
          colorScheme={colorScheme}
          sentiment={sentiment}
          animationSpeed={animationSpeed}
          onLineClick={handleLineClick}
          editingLineId={editingLineId}
          editedLineText={editedLineText}
          onEditChange={handleEditChange}
          onEditConfirm={handleEditConfirm}
          updatedLineIds={updatedLineIds}
        />
        {poem.length > 0 && (
          <div style={styles.themeBadge}>
            <span style={styles.themeLabel}>主题</span>
            <span style={styles.themeValue}>{theme}</span>
            <span style={styles.sentimentTag}>
              {sentiment === 'sad' && '忧伤'}
              {sentiment === 'joyful' && '喜悦'}
              {sentiment === 'neutral' && '悠远'}
              {sentiment === 'romantic' && '浪漫'}
              {sentiment === 'melancholy' && '思念'}
            </span>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          #app-root {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  modeSelector: {
    position: 'fixed',
    top: '20px',
    left: 'calc(380px + 32px)',
    zIndex: 100,
    display: 'flex',
    gap: '10px',
    padding: '6px',
    background: 'rgba(15, 15, 35, 0.6)',
    backdropFilter: 'blur(14px)',
    borderRadius: '14px',
    border: '1.5px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.35)'
  },
  modeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '9px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '10px',
    color: 'rgba(255, 255, 255, 0.5)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    letterSpacing: '0.5px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: `Georgia, 'Noto Serif SC', serif`
  },
  modeBtnActive: {
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(59, 130, 246, 0.3))',
    color: 'white',
    boxShadow: '0 2px 12px rgba(59, 130, 246, 0.3)'
  },
  modeBtnActivePassionate: {
    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.35), rgba(239, 68, 68, 0.3))',
    color: 'white',
    boxShadow: '0 2px 12px rgba(249, 115, 22, 0.3)'
  },
  modeIcon: {
    fontSize: '15px',
    lineHeight: 1
  },
  modeLabel: {
    fontSize: '12.5px'
  },
  editorContainer: {
    width: '380px',
    minWidth: '320px',
    padding: '24px 20px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10,
    position: 'relative'
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    minWidth: 0
  },
  themeBadge: {
    position: 'absolute',
    bottom: '28px',
    right: '32px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 18px',
    background: 'rgba(15, 15, 35, 0.55)',
    backdropFilter: 'blur(12px)',
    borderRadius: '30px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 18px rgba(0, 0, 0, 0.3)'
  },
  themeLabel: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    fontFamily: 'monospace'
  },
  themeValue: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: 500,
    fontFamily: `Georgia, 'Noto Serif SC', serif`
  },
  sentimentTag: {
    padding: '3px 10px',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(59, 130, 246, 0.2))',
    borderRadius: '20px',
    fontSize: '11px',
    color: '#c4b5fd',
    letterSpacing: '0.5px',
    fontWeight: 500,
    border: '1px solid rgba(139, 92, 246, 0.3)'
  }
};
