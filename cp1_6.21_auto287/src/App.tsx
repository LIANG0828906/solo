import { useState, useCallback } from 'react';
import EditorPanel from './components/EditorPanel';
import CanvasPreview from './components/CanvasPreview';
import BackgroundPicker from './components/BackgroundPicker';
import { PoemLine, PRESET_GRADIENTS } from './types';
import './App.css';

function App() {
  const [poemLines, setPoemLines] = useState<PoemLine[]>([
    { id: '1', text: '床前明月光', x: 50, y: 35 },
    { id: '2', text: '疑是地上霜', x: 50, y: 45 },
    { id: '3', text: '举头望明月', x: 50, y: 55 },
    { id: '4', text: '低头思故乡', x: 50, y: 65 },
  ]);
  const [fontFamily, setFontFamily] = useState('KaiTi, STKaiti, serif');
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [particleEnabled, setParticleEnabled] = useState(true);
  const [customColors, setCustomColors] = useState<string[]>(['#667EEA', '#764BA2']);
  const [noiseIntensity, setNoiseIntensity] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isCustomTexture, setIsCustomTexture] = useState(false);

  const handleTextChange = useCallback((text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    setPoemLines(prev => {
      const newLines: PoemLine[] = lines.map((line, index) => {
        const existing = prev[index];
        return {
          id: existing?.id || String(Date.now() + index),
          text: line,
          x: existing?.x ?? 50,
          y: existing?.y ?? 35 + index * 10,
        };
      });
      return newLines;
    });
  }, []);

  const handleLinePositionChange = useCallback((id: string, x: number, y: number) => {
    setPoemLines(prev =>
      prev.map(line => (line.id === id ? { ...line, x, y } : line))
    );
  }, []);

  const handleExportStart = useCallback(() => {
    setIsExporting(true);
    setExportProgress(0);
    const startTime = Date.now();
    const duration = 500;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setExportProgress(progress * 100);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, []);

  const handleExportComplete = useCallback(() => {
    setTimeout(() => {
      setIsExporting(false);
      setExportProgress(0);
    }, 300);
  }, []);

  const currentColors = isCustomTexture ? customColors : PRESET_GRADIENTS[backgroundIndex] || PRESET_GRADIENTS[0];

  return (
    <div className="app-container">
      <div className="glass-panel">
        <div className="panel-header">
          <h1 className="app-title">一页诗画</h1>
          <button className="export-btn" onClick={handleExportStart}>
            导出 PNG
          </button>
        </div>

        <div className="main-content">
          <div className="editor-section">
            <EditorPanel
              poemLines={poemLines}
              fontFamily={fontFamily}
              onTextChange={handleTextChange}
              onFontChange={setFontFamily}
            />
          </div>

          <div className="canvas-section">
            <CanvasPreview
              poemLines={poemLines}
              fontFamily={fontFamily}
              backgroundColors={currentColors}
              noiseIntensity={noiseIntensity}
              particleEnabled={particleEnabled}
              onLinePositionChange={handleLinePositionChange}
              isExporting={isExporting}
              onExportComplete={handleExportComplete}
            />
          </div>
        </div>

        <BackgroundPicker
          selectedIndex={backgroundIndex}
          onSelect={setBackgroundIndex}
          particleEnabled={particleEnabled}
          onParticleToggle={setParticleEnabled}
          customColors={customColors}
          onCustomColorsChange={setCustomColors}
          noiseIntensity={noiseIntensity}
          onNoiseIntensityChange={setNoiseIntensity}
          isCustomTexture={isCustomTexture}
          onCustomTextureToggle={setIsCustomTexture}
        />
      </div>

      {isExporting && (
        <div className="export-progress-overlay">
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
          <p className="progress-text">正在生成海报... {Math.round(exportProgress)}%</p>
        </div>
      )}
    </div>
  );
}

export default App;
