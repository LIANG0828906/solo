import React, { useState, useRef, useCallback, useEffect } from 'react';
import ControlPanel from './ControlPanel';
import WordCloud, { WordCloudHandle } from './WordCloud';
import { ThemeType, CloudConfig, AnalyzeResult } from './types';

const SAMPLE_TEXT = `数据可视化是将数据转化为图形的艺术和科学。在大数据时代，数据可视化帮助我们从海量信息中发现规律和洞察。词云作为一种直观的文本可视化方式，能够快速展示文本中关键词的重要程度。

交互式词云不仅美观，更具实用价值。用户可以通过点击、拖拽、筛选等操作深入探索数据。D3.js 是数据可视化领域最强大的 JavaScript 库之一，它提供了丰富的布局算法和渲染能力。

React 组件化开发让复杂的交互界面变得可维护和可扩展。TypeScript 的类型系统进一步提升了代码质量和开发效率。前后端分离架构使得系统更加灵活，Node.js 后端可以高效处理文本分词和词频统计任务。

中文分词是中文自然语言处理的基础任务，nodejieba 提供了高性能的中文分词解决方案。结合英文正则分词，可以实现中英文混合文本的准确分析。

优秀的用户体验来自细节的打磨：流畅的动画过渡、合理的交互反馈、响应式的布局设计、无障碍的操作流程。每一个视觉元素都应该服务于信息传达，每一次交互都应该有明确的反馈。`;

const App: React.FC = () => {
  const [text, setText] = useState<string>(SAMPLE_TEXT);
  const [theme, setTheme] = useState<ThemeType>('light');
  const [config, setConfig] = useState<CloudConfig>({
    maxWords: 80,
    fontStyle: 'sans-serif',
    rotation: 30,
    compactness: 0.85,
  });
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showPreview, setShowPreview] = useState<{ type: 'png' | 'svg' } | null>(null);
  
  const wordcloudRef = useRef<WordCloudHandle>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analyzedTextRef = useRef<string>('');

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 720;
      setIsMobile(mobile);
      if (mobile) setPanelOpen(false);
      else setPanelOpen(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const analyzeText = useCallback(async (textToAnalyze: string) => {
    if (!textToAnalyze.trim()) {
      setResult(null);
      analyzedTextRef.current = '';
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/cloud-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textToAnalyze }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = (await response.json()) as AnalyzeResult;
      setResult(data);
      analyzedTextRef.current = textToAnalyze;
    } catch (error) {
      console.error('Error analyzing text:', error);
      const stopwords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', 'the', 'a', 'an', 'is', 'are', 'to', 'of', 'in', 'for', 'on', 'and'];
      const tokens = textToAnalyze
        .toLowerCase()
        .match(/[\u4e00-\u9fa5]+|[a-zA-Z']+|\d+/g) || [];
      
      const freqMap = new Map<string, { freq: number; indices: number[] }>();
      tokens.forEach((token, idx) => {
        if (token.length < 2 || stopwords.includes(token)) return;
        const existing = freqMap.get(token);
        if (existing) {
          existing.freq++;
          if (existing.indices.length < 10) existing.indices.push(idx);
        } else {
          freqMap.set(token, { freq: 1, indices: [idx] });
        }
      });

      const words = Array.from(freqMap.entries())
        .sort((a, b) => b[1].freq - a[1].freq)
        .slice(0, 200)
        .map(([t, info]) => ({
          text: t,
          frequency: info.freq,
          indices: info.indices,
        }));

      setResult({ words, totalWords: tokens.length });
      analyzedTextRef.current = textToAnalyze;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (text !== analyzedTextRef.current) {
        analyzeText(text);
      }
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text, analyzeText]);

  const handleWordRemove = useCallback((wordText: string) => {
    setResult(prev => {
      if (!prev) return prev;
      const filteredWords = prev.words.filter(w => w.text !== wordText);
      return {
        ...prev,
        words: filteredWords,
      };
    });
  }, []);

  const handleExportPNG = useCallback(() => {
    setShowPreview({ type: 'png' });
  }, []);

  const handleExportSVG = useCallback(() => {
    setShowPreview({ type: 'svg' });
  }, []);

  const confirmExport = useCallback(() => {
    if (!showPreview || !wordcloudRef.current) return;
    if (showPreview.type === 'png') {
      wordcloudRef.current.exportPNG();
    } else {
      wordcloudRef.current.exportSVG();
    }
    setShowPreview(null);
  }, [showPreview]);

  const themeBgColors = {
    light: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    dark: 'linear-gradient(135deg, #0c1220 0%, #1e1b4b 100%)',
    retro: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
    minimal: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
  };

  return (
    <div 
      className="app-container"
      style={{ background: themeBgColors[theme] }}
    >
      {isMobile && (
        <button 
          className="mobile-toggle"
          onClick={() => setPanelOpen(true)}
        >
          ☰
        </button>
      )}

      <ControlPanel
        text={text}
        onTextChange={setText}
        theme={theme}
        onThemeChange={setTheme}
        config={config}
        onConfigChange={setConfig}
        result={result}
        isLoading={isLoading}
        onExportPNG={handleExportPNG}
        onExportSVG={handleExportSVG}
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
      />

      <main className="main-view">
        <WordCloud
          ref={wordcloudRef}
          words={result?.words || []}
          theme={theme}
          config={config}
          sourceText={text}
          onWordRemove={handleWordRemove}
        />
      </main>

      {showPreview && (
        <div className="modal-backdrop" onClick={() => setShowPreview(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              {showPreview.type === 'png' ? '导出为 PNG 图片' : '导出为 SVG 矢量图'}
            </div>
            <div className="modal-desc">
              {showPreview.type === 'png'
                ? '将导出 2x 分辨率的高清 PNG 图片，适合在报告和网页中使用。'
                : '将导出可无限缩放的 SVG 矢量图，适合打印和二次编辑。'}
            </div>
            <div className="preview-container">
              <div style={{ 
                padding: '24px 32px', 
                background: theme === 'dark' ? '#0f172a' 
                  : theme === 'retro' ? '#faf6ed' 
                  : theme === 'minimal' ? '#f5f5f7'
                  : '#f8f9fc',
                borderRadius: 12,
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: 32, 
                  fontWeight: 700,
                  background: theme === 'dark' 
                    ? 'linear-gradient(135deg, #4dabf7, #9775fa)'
                    : theme === 'retro'
                    ? 'linear-gradient(135deg, #8b4513, #b8860b)'
                    : theme === 'minimal'
                    ? 'linear-gradient(135deg, #343a40, #868e96)'
                    : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: 8,
                }}>
                  词云预览
                </div>
                <div style={{ 
                  fontSize: 13, 
                  color: theme === 'dark' ? '#94a3b8' : '#64748b' 
                }}>
                  {result?.words.length || 0} 个词语 · {showPreview.type.toUpperCase()} 格式
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="modal-btn cancel"
                onClick={() => setShowPreview(null)}
              >
                取消
              </button>
              <button 
                className="modal-btn confirm"
                onClick={confirmExport}
              >
                确认导出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
