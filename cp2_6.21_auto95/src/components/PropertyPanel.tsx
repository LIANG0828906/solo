import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCard } from '../App';
import type { Layer, TextProperties, AnimationConfig, MusicConfig } from '../types/card';
import { createAudioAnalyzer, getFrequencyData, drawWaveform, getWaveformColors, parseCSV } from '../utils/audio';

type AccordionKey = 'element' | 'text' | 'animation' | 'music';

export function PropertyPanel() {
  const {
    state, selectedLayer,
    updateLayer, updateTextProps, addTextLayer, removeLayer,
    updateAnimation, updateMusic, setRecipients, generatePreviews,
    exportCurrentPng, exportAllAsZip, playAnimation,
  } = useCard();

  const [openSections, setOpenSections] = useState<Set<AccordionKey>>(
    new Set(['element', 'text', 'animation', 'music'])
  );
  const [exportProgress, setExportProgress] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [csvText, setCsvText] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyzerRef = useRef<ReturnType<typeof createAudioAnalyzer> | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef(0);

  const toggleSection = (key: AccordionKey) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateMusic({ file, url: URL.createObjectURL(file) });
    }
  };

  const handlePlayMusic = () => {
    if (!state.music.url) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(state.music.url);
    audio.volume = state.music.volume / 100;
    audio.loop = state.music.loop;
    audioRef.current = audio;

    if (!analyzerRef.current || analyzerRef.current.context.state === 'closed') {
      analyzerRef.current = createAudioAnalyzer(audio);
    }
    audio.play();
    startWaveformAnimation();
  };

  const handleStopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
  };

  const startWaveformAnimation = useCallback(() => {
    const draw = () => {
      if (analyzerRef.current && waveformCanvasRef.current) {
        const data = getFrequencyData(analyzerRef.current);
        const colors = getWaveformColors(data);
        drawWaveform(waveformCanvasRef.current, data, colors);
      }
      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      cancelAnimationFrame(animFrameRef.current);
      analyzerRef.current?.context.close();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.music.volume / 100;
      audioRef.current.loop = state.music.loop;
    }
  }, [state.music.volume, state.music.loop]);

  const handleImportCSV = () => {
    const recipients = parseCSV(csvText);
    setRecipients(recipients);
  };

  const handleExportPng = async () => {
    setExporting(true);
    setExportProgress(20);
    const blob = await exportCurrentPng();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '贺卡.png';
      a.click();
      URL.revokeObjectURL(url);
    }
    setExportProgress(100);
    setTimeout(() => { setExporting(false); setExportProgress(0); }, 500);
  };

  const handleExportZip = async () => {
    setExporting(true);
    await exportAllAsZip(pct => setExportProgress(pct));
    setExporting(false);
    setExportProgress(0);
  };

  const textCount = state.layers.filter(l => l.type === 'text').length;

  return (
    <div className="property-panel">
      <Accordion title="🎯 元素属性" open={openSections.has('element')} onToggle={() => toggleSection('element')}>
        {selectedLayer ? (
          <div className="prop-group">
            <PropRow label="类型">
              <span className="prop-tag">{selectedLayer.type === 'background' ? '背景' : selectedLayer.type === 'decoration' ? '装饰' : '文字'}</span>
            </PropRow>
            {selectedLayer.type !== 'background' && (
              <>
                <PropRow label="X">
                  <NumInput value={selectedLayer.x} onChange={v => updateLayer(selectedLayer.id, { x: v })} />
                </PropRow>
                <PropRow label="Y">
                  <NumInput value={selectedLayer.y} onChange={v => updateLayer(selectedLayer.id, { y: v })} />
                </PropRow>
                <PropRow label="宽度">
                  <NumInput value={selectedLayer.width} min={30} onChange={v => updateLayer(selectedLayer.id, { width: v })} />
                </PropRow>
                <PropRow label="高度">
                  <NumInput value={selectedLayer.height} min={30} onChange={v => updateLayer(selectedLayer.id, { height: v })} />
                </PropRow>
                <PropRow label="旋转">
                  <RangeInput value={selectedLayer.rotation} min={-180} max={180} onChange={v => updateLayer(selectedLayer.id, { rotation: v })} />
                </PropRow>
                <PropRow label="透明度">
                  <RangeInput value={Math.round(selectedLayer.opacity * 100)} min={0} max={100} onChange={v => updateLayer(selectedLayer.id, { opacity: v / 100 })} />
                </PropRow>
              </>
            )}
            {selectedLayer.type === 'background' && (
              <PropRow label="背景色">
                <input type="color" value={selectedLayer.color || '#FFFFFF'} onChange={e => updateLayer(selectedLayer.id, { color: e.target.value })} />
              </PropRow>
            )}
            {selectedLayer.type !== 'background' && (
              <button className="btn-danger" onClick={() => removeLayer(selectedLayer.id)}>删除元素</button>
            )}
          </div>
        ) : (
          <div className="prop-empty">点击画布元素以编辑</div>
        )}
      </Accordion>

      <Accordion title="✏️ 文字设置" open={openSections.has('text')} onToggle={() => toggleSection('text')}>
        <div className="prop-group">
          {textCount < 3 && (
            <button className="btn-primary btn-sm" onClick={addTextLayer}>+ 添加文字框 ({textCount}/3)</button>
          )}
          {selectedLayer?.text && (
            <>
              <PropRow label="内容">
                <textarea
                  className="prop-textarea"
                  maxLength={50}
                  value={selectedLayer.text.content}
                  onChange={e => updateTextProps(selectedLayer.id, { content: e.target.value })}
                />
              </PropRow>
              <PropRow label="字体">
                <select
                  className="prop-select"
                  value={selectedLayer.text.fontFamily}
                  onChange={e => updateTextProps(selectedLayer.id, { fontFamily: e.target.value as TextProperties['fontFamily'] })}
                >
                  <option value="noto-sans">思源黑体</option>
                  <option value="noto-serif">思源宋体</option>
                  <option value="zhanku-kuaile">站酷快乐体</option>
                </select>
              </PropRow>
              <PropRow label="字号">
                <RangeInput value={selectedLayer.text.fontSize} min={12} max={72} onChange={v => updateTextProps(selectedLayer.id, { fontSize: v })} />
              </PropRow>
              <PropRow label="行高">
                <RangeInput value={Math.round(selectedLayer.text.lineHeight * 10)} min={10} max={20} onChange={v => updateTextProps(selectedLayer.id, { lineHeight: v / 10 })} />
              </PropRow>
              <PropRow label="颜色">
                <input type="color" value={selectedLayer.text.color} onChange={e => updateTextProps(selectedLayer.id, { color: e.target.value })} />
              </PropRow>
              <PropRow label="对齐">
                <div className="align-group">
                  {(['left', 'center', 'right'] as const).map(a => (
                    <button key={a} className={`align-btn ${selectedLayer.text!.textAlign === a ? 'active' : ''}`}
                      onClick={() => updateTextProps(selectedLayer.id, { textAlign: a })}>
                      {a === 'left' ? '左' : a === 'center' ? '中' : '右'}
                    </button>
                  ))}
                </div>
              </PropRow>
              <div className="prop-subsection">
                <span className="prop-subtitle">描边</span>
                <PropRow label="颜色">
                  <input type="color" value={selectedLayer.text.strokeColor} onChange={e => updateTextProps(selectedLayer.id, { strokeColor: e.target.value })} />
                </PropRow>
                <PropRow label="宽度">
                  <RangeInput value={selectedLayer.text.strokeWidth} min={0} max={5} onChange={v => updateTextProps(selectedLayer.id, { strokeWidth: v })} />
                </PropRow>
              </div>
              <div className="prop-subsection">
                <span className="prop-subtitle">投影</span>
                <PropRow label="偏移X">
                  <NumInput value={selectedLayer.text.shadowOffsetX} min={-20} max={20} onChange={v => updateTextProps(selectedLayer.id, { shadowOffsetX: v })} />
                </PropRow>
                <PropRow label="偏移Y">
                  <NumInput value={selectedLayer.text.shadowOffsetY} min={-20} max={20} onChange={v => updateTextProps(selectedLayer.id, { shadowOffsetY: v })} />
                </PropRow>
                <PropRow label="模糊">
                  <RangeInput value={selectedLayer.text.shadowBlur} min={0} max={20} onChange={v => updateTextProps(selectedLayer.id, { shadowBlur: v })} />
                </PropRow>
                <PropRow label="颜色">
                  <input type="color" value={rgbaToHex(selectedLayer.text.shadowColor)} onChange={e => updateTextProps(selectedLayer.id, { shadowColor: e.target.value })} />
                </PropRow>
              </div>
            </>
          )}
          {!selectedLayer?.text && <div className="prop-empty">选中文字框以编辑</div>}
        </div>
      </Accordion>

      <Accordion title="🎬 动画配置" open={openSections.has('animation')} onToggle={() => toggleSection('animation')}>
        <div className="prop-group">
          <PropRow label="进入效果">
            <select className="prop-select" value={state.animation.enterEffect}
              onChange={e => updateAnimation({ enterEffect: e.target.value as AnimationConfig['enterEffect'] })}>
              <option value="fade-in">淡入</option>
              <option value="slide-up">从底部滑入</option>
              <option value="zoom-in">缩放放大</option>
            </select>
          </PropRow>
          <PropRow label="持续效果">
            <select className="prop-select" value={state.animation.continuousEffect}
              onChange={e => updateAnimation({ continuousEffect: e.target.value as AnimationConfig['continuousEffect'] })}>
              <option value="petals">飘落花瓣</option>
              <option value="stars">闪烁星光</option>
              <option value="particles">旋转粒子</option>
            </select>
          </PropRow>
          <PropRow label="时长">
            <RangeInput value={state.animation.duration} min={1} max={5} step={0.5} onChange={v => updateAnimation({ duration: v })} />
            <span className="range-label">{state.animation.duration}s</span>
          </PropRow>
          <button className="btn-primary btn-sm" onClick={playAnimation}>▶ 预览动画</button>
        </div>
      </Accordion>

      <Accordion title="🎵 音乐管理" open={openSections.has('music')} onToggle={() => toggleSection('music')}>
        <div className="prop-group">
          <label className="file-upload-btn">
            📎 选择MP3
            <input type="file" accept="audio/mp3" hidden onChange={handleFileUpload} />
          </label>
          {state.music.file && (
            <div className="music-info">
              <span className="music-filename">{state.music.file.name}</span>
              <canvas ref={waveformCanvasRef} width={260} height={40} className="waveform-canvas" />
              <div className="music-controls">
                <button className="btn-icon" onClick={handlePlayMusic}>▶</button>
                <button className="btn-icon" onClick={handleStopMusic}>⏹</button>
              </div>
            </div>
          )}
          <PropRow label="音量">
            <RangeInput value={state.music.volume} min={0} max={100} onChange={v => updateMusic({ volume: v })} />
            <span className="range-label">{state.music.volume}%</span>
          </PropRow>
          <PropRow label="播放模式">
            <div className="align-group">
              <button className={`align-btn ${state.music.loop ? 'active' : ''}`} onClick={() => updateMusic({ loop: true })}>循环</button>
              <button className={`align-btn ${!state.music.loop ? 'active' : ''}`} onClick={() => updateMusic({ loop: false })}>单次</button>
            </div>
          </PropRow>
        </div>
      </Accordion>

      <Accordion title="👥 批量生成" open={true} onToggle={() => {}}>
        <div className="prop-group">
          <textarea
            className="prop-textarea csv-input"
            placeholder="粘贴CSV格式数据：&#10;姓名,祝福语&#10;张三,新年快乐&#10;李四,万事如意"
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            rows={4}
          />
          <div className="btn-row">
            <button className="btn-secondary btn-sm" onClick={handleImportCSV}>导入名单</button>
            <button className="btn-primary btn-sm" onClick={generatePreviews} disabled={state.recipients.length === 0}>
              生成预览 ({state.recipients.length}人)
            </button>
          </div>
        </div>
      </Accordion>

      <div className="export-section">
        <h3 className="export-title">📦 导出</h3>
        <div className="btn-row">
          <button className="btn-primary" onClick={handleExportPng} disabled={exporting}>导出PNG</button>
          <button className="btn-primary" onClick={handleExportZip} disabled={exporting || state.previews.length === 0}>打包ZIP</button>
        </div>
        {exporting && (
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${exportProgress}%` }} />
            <span className="progress-text">{exportProgress}%</span>
          </div>
        )}
      </div>

      <style>{`
        .property-panel {
          width: 300px;
          min-width: 300px;
          background: var(--color-surface);
          border-left: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .accordion { border-bottom: 1px solid var(--color-border); }
        .accordion-header {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          color: var(--color-primary);
          background: var(--color-bg);
          transition: background var(--transition-fast);
          user-select: none;
        }
        .accordion-header:hover { background: var(--color-bg-dark); }
        .accordion-arrow {
          transition: transform var(--transition-normal);
          font-size: 10px;
        }
        .accordion-arrow.open { transform: rotate(180deg); }
        .accordion-body {
          padding: 12px 16px;
          max-height: 0;
          overflow: hidden;
          transition: max-height var(--transition-normal), padding var(--transition-normal);
        }
        .accordion-body.open {
          max-height: 800px;
          padding: 12px 16px;
        }
        .prop-group { display: flex; flex-direction: column; gap: 8px; }
        .prop-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .prop-label {
          font-size: 12px;
          color: var(--color-text-light);
          min-width: 50px;
          flex-shrink: 0;
        }
        .prop-value { flex: 1; display: flex; align-items: center; gap: 6px; }
        .prop-tag {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 10px;
          background: var(--color-secondary);
          color: var(--color-text);
          font-weight: 600;
        }
        .prop-empty {
          font-size: 12px;
          color: var(--color-text-light);
          text-align: center;
          padding: 12px;
        }
        .prop-textarea {
          width: 100%;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 8px;
          font-size: 13px;
          resize: vertical;
          min-height: 36px;
          transition: border-color var(--transition-fast);
        }
        .prop-textarea:focus { border-color: var(--color-primary); outline: none; }
        .prop-select {
          flex: 1;
          padding: 4px 8px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 12px;
          background: var(--color-surface);
        }
        .prop-num {
          width: 60px;
          padding: 4px 6px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 12px;
          text-align: center;
        }
        .prop-num:focus { border-color: var(--color-primary); outline: none; }
        .prop-range { flex: 1; }
        .range-label {
          font-size: 11px;
          color: var(--color-text-light);
          min-width: 28px;
          text-align: right;
        }
        .align-group { display: flex; gap: 4px; }
        .align-btn {
          padding: 4px 10px;
          font-size: 11px;
          border-radius: var(--radius-sm);
          background: var(--color-bg);
          color: var(--color-text-light);
          transition: all var(--transition-fast);
          border: 1px solid var(--color-border);
        }
        .align-btn.active {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }
        .prop-subsection {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed var(--color-border);
        }
        .prop-subtitle {
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text);
          display: block;
          margin-bottom: 6px;
        }
        .btn-primary {
          background: var(--color-primary);
          color: white;
          padding: 8px 16px;
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 600;
        }
        .btn-primary:hover { background: var(--color-primary-dark); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-secondary {
          background: var(--color-bg);
          color: var(--color-text);
          padding: 8px 16px;
          border-radius: var(--radius-md);
          font-size: 13px;
          border: 1px solid var(--color-border);
        }
        .btn-danger {
          background: #FEE2E2;
          color: #DC2626;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 12px;
        }
        .btn-sm { padding: 6px 12px; font-size: 12px; }
        .btn-icon {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--color-primary);
          color: white;
          font-size: 14px;
          display: flex; align-items: center; justify-content: center;
        }
        .btn-icon:hover { background: var(--color-primary-dark); }
        .btn-row { display: flex; gap: 8px; }
        .file-upload-btn {
          display: inline-block;
          padding: 8px 16px;
          background: var(--color-secondary);
          color: var(--color-text);
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
          transition: all var(--transition-normal);
        }
        .file-upload-btn:hover { background: var(--color-secondary-dark); transform: scale(1.05); }
        .music-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 8px;
          background: var(--color-bg);
          border-radius: var(--radius-sm);
        }
        .music-filename { font-size: 11px; color: var(--color-text-light); word-break: break-all; }
        .waveform-canvas {
          width: 100%;
          height: 40px;
          border-radius: 4px;
          background: rgba(0,0,0,0.05);
        }
        .music-controls { display: flex; gap: 6px; }
        .csv-input { font-size: 11px; }
        .export-section {
          padding: 16px;
          border-top: 2px solid var(--color-border);
        }
        .export-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-primary);
          margin-bottom: 10px;
        }
        .progress-bar-container {
          margin-top: 8px;
          height: 20px;
          background: var(--color-bg-dark);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
          border-radius: 10px;
          transition: width 0.3s ease;
        }
        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text);
        }
        @media (max-width: 768px) {
          .property-panel {
            position: fixed;
            bottom: 0; left: 0; right: 0;
            width: 100%; min-width: unset;
            max-height: 50vh;
            border-left: none;
            border-top: 1px solid var(--color-border);
            border-radius: var(--radius-xl) var(--radius-xl) 0 0;
            transform: translateY(calc(100% - 48px));
            transition: transform var(--transition-normal);
            z-index: 100;
          }
          .property-panel:hover,
          .property-panel:focus-within {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function Accordion({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="accordion">
      <div className="accordion-header" onClick={onToggle}>
        <span>{title}</span>
        <span className={`accordion-arrow ${open ? 'open' : ''}`}>▼</span>
      </div>
      <div className={`accordion-body ${open ? 'open' : ''}`}>
        {children}
      </div>
    </div>
  );
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="prop-row">
      <span className="prop-label">{label}</span>
      <div className="prop-value">{children}</div>
    </div>
  );
}

function NumInput({ value, min, max, onChange }: {
  value: number; min?: number; max?: number; onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      className="prop-num"
      value={value}
      min={min}
      max={max}
      onChange={e => onChange(Number(e.target.value))}
    />
  );
}

function RangeInput({ value, min, max, step, onChange }: {
  value: number; min: number; max: number; step?: number; onChange: (v: number) => void;
}) {
  return (
    <input
      type="range"
      className="prop-range"
      value={value}
      min={min}
      max={max}
      step={step || 1}
      onChange={e => onChange(Number(e.target.value))}
    />
  );
}

function rgbaToHex(rgba: string): string {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return rgba.startsWith('#') ? rgba : '#000000';
}
