import { useState, useCallback } from 'react';
import {
  analyzeSentiment,
  getColorTheme,
  generateArt,
} from './ArtGenerator';
import type { PoemLine } from './ArtGenerator';
import PoetryScroll from './PoetryScroll';

const SAMPLE_POEM = `春风又绿江南岸
明月何时照我还
落花人独立
微雨燕双飞
大漠孤烟直
长河落日圆
寒蝉凄切时
对长亭晚骤`;

export default function App() {
  const [poemText, setPoemText] = useState<string>(SAMPLE_POEM);
  const [lines, setLines] = useState<PoemLine[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [error, setError] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ripplePos, setRipplePos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleGenerate = useCallback(() => {
    const rawLines = poemText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (rawLines.length < 6) {
      setError('诗歌至少需要6行');
      return;
    }
    if (rawLines.length > 20) {
      setError('诗歌最多支持20行');
      return;
    }

    const tooLong = rawLines.find((l) => l.length > 30);
    if (tooLong) {
      setError(`诗句过长（超过30字符）："${tooLong.slice(0, 10)}..."`);
      return;
    }

    setError('');
    setIsGenerating(true);
    setIsPlaying(false);
    setCurrentLine(0);

    const poemLines: PoemLine[] = rawLines.map((text, index) => {
      const sentiment = analyzeSentiment(text);
      const colorTheme = getColorTheme(sentiment);
      return { text, sentiment, colorTheme, index };
    });

    const artImages: string[] = poemLines.map((line) =>
      generateArt(line.text, line.colorTheme, line.index)
    );

    requestAnimationFrame(() => {
      setLines(poemLines);
      setImages(artImages);
      setIsGenerating(false);
    });
  }, [poemText]);

  const handlePlayToggle = useCallback(() => {
    setIsPlaying((prev) => {
      if (!prev) {
        setCurrentLine(0);
      }
      return !prev;
    });
  }, []);

  const handlePlayEnd = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleGenerateClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setRipplePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setTimeout(() => setRipplePos(null), 600);
      handleGenerate();
    },
    [handleGenerate]
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">诗画卷</h1>
        <p className="app-subtitle">输入诗歌，生成独一无二的抽象艺术画卷</p>
      </header>

      <section className="input-section">
        <div className="glass-card">
          <label htmlFor="poem-input" className="input-label">
            在此输入或粘贴诗歌（6-20行，每行不超过30字符）
          </label>
          <textarea
            id="poem-input"
            className="poem-textarea"
            value={poemText}
            onChange={(e) => setPoemText(e.target.value)}
            placeholder="在此输入你的诗歌..."
            rows={10}
          />
          {error && <p className="error-text">{error}</p>}
          <div className="button-row">
            <button
              className="generate-btn"
              onClick={handleGenerateClick}
              disabled={isGenerating}
            >
              {isGenerating ? '生成中...' : '生成画卷'}
              {ripplePos && (
                <span
                  className="ripple"
                  style={{ left: ripplePos.x, top: ripplePos.y }}
                />
              )}
            </button>
          </div>
        </div>
      </section>

      <PoetryScroll
        lines={lines}
        images={images}
        isPlaying={isPlaying}
        currentLine={currentLine}
        onPlayToggle={handlePlayToggle}
        onCurrentLineChange={setCurrentLine}
        onPlayEnd={handlePlayEnd}
      />
    </div>
  );
}
