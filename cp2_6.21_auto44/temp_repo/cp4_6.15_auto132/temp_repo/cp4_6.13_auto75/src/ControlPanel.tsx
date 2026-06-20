import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WaveformStyle } from './WaveformRenderer';
import { TextItem, FontFamily } from './TextOverlay';
import { BackgroundConfig, BASE_COLORS } from './BackgroundManager';
import { ExportScale } from './ExportManager';

type TextStylePartial = {
  [K in keyof TextItem['style']]?: TextItem['style'][K] extends object
    ? Partial<TextItem['style'][K]> | TextItem['style'][K]
    : TextItem['style'][K];
};
type TextItemUpdate = Omit<Partial<TextItem>, 'style'> & {
  style?: TextStylePartial;
};

interface ControlPanelProps {
  waveformStyle: WaveformStyle;
  onWaveformStyleChange: (style: Partial<WaveformStyle>) => void;
  texts: TextItem[];
  selectedTextId: string | null;
  onSelectText: (id: string | null) => void;
  onTextUpdate: (id: string, updates: TextItemUpdate) => void;
  backgroundConfig: BackgroundConfig;
  onBackgroundConfigChange: (config: BackgroundConfig) => void;
  onUploadAudio: (file: File) => void;
  onUploadImage: (file: File) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  onExport: (scale: ExportScale) => void;
  onGenerateShare: () => void;
  shareLink: string | null;
  error: string | null;
}

const FONT_OPTIONS: { value: FontFamily; label: string; sample: string }[] = [
  { value: 'serif', label: '衬线体', sample: 'Aa 字体' },
  { value: 'sans-serif', label: '无衬线', sample: 'Aa 字体' },
  { value: 'handwriting', label: '手写体', sample: 'Aa 字体' },
  { value: 'decorative', label: '装饰体', sample: 'Aa 字体' },
  { value: 'monospace', label: '等宽体', sample: 'Aa 字体' }
];

const Card: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title, children, defaultOpen = true
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: 12,
      padding: open ? '14px' : '10px 14px',
      transition: 'all 0.25s ease',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    }}
    >
      <div onClick={() => setOpen(!open)} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: open ? 12 : 0,
        userSelect: 'none',
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          {title}
        </span>
        <span style={{
          color: 'var(--accent)',
          fontSize: 14,
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          transition: 'transform 0.2s'
        }}>▼</span>
      </div>
      {open && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} onClick={e => e.stopPropagation()}>{children}</div>}
    </div>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode; valueText?: string }> = ({ label, children, valueText }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      {valueText !== undefined && <span style={{ fontSize: 11, color: 'var(--accent)' }}>{valueText}</span>}
    </div>
    {children}
  </div>
);

const ControlPanel: React.FC<ControlPanelProps> = ({
  waveformStyle, onWaveformStyleChange,
  texts, selectedTextId, onSelectText, onTextUpdate,
  backgroundConfig, onBackgroundConfigChange,
  onUploadAudio, onUploadImage,
  onStartRecording, onStopRecording, isRecording,
  onExport, onGenerateShare, shareLink, error
}) => {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(() => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareLink]);

  const selectedText = texts.find(t => t.id === selectedTextId) || null;
  const activeTab = selectedText?.id || 'title';

  return (
    <div style={{
      width: 280,
      flexShrink: 0,
      height: '100%',
      padding: '16px 12px',
      overflowY: 'auto',
      overflowX: 'hidden',
      background: 'var(--bg-panel)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRight: '1px solid var(--card-border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{
        textAlign: 'center',
        padding: '8px 0 4px',
        borderBottom: '1px solid var(--card-border)',
        marginBottom: 4,
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, background: 'linear-gradient(135deg, #00d4ff, #9d4edd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🎵 WaveWall
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
          音乐波形墙海报生成器
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(233, 69, 96, 0.15)',
          border: '1px solid rgba(233,69,96,0.4)',
          color: '#ff8fa3',
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 12,
        }}>{error}</div>
      )}

      <Card title="📥 音频导入">
        <input ref={audioInputRef} type="file" accept="audio/*" hidden
          onChange={e => {
            if (e.target.files?.[0]) onUploadAudio(e.target.files[0]);
            e.target.value = '';
          }} />
        <button onClick={() => audioInputRef.current?.click()}
          style={{ width: '100%', padding: '10px' }}>
          📁 上传音频文件
        </button>
        <button
          className={isRecording ? 'secondary' : ''}
          onClick={isRecording ? onStopRecording : onStartRecording}
          style={{
            width: '100%',
            padding: '10px',
            background: isRecording
              ? 'linear-gradient(135deg, #e94560, #c73659)'
              : undefined,
          }}>
          {isRecording ? '⏹ 停止录音' : '🎙 麦克风录音'}
        </button>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center' }}>
          支持 MP3 / WAV，最长5分钟
        </div>
      </Card>

      <Card title="🌊 波形设置">
        <Row label="起始颜色">
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="color" value={waveformStyle.startColor}
              onChange={e => onWaveformStyleChange({ startColor: e.target.value })} />
            <input type="text" value={waveformStyle.startColor}
              onChange={e => onWaveformStyleChange({ startColor: e.target.value })}
              style={{ flex: 1, fontFamily: 'monospace', fontSize: 11 }} />
          </div>
        </Row>
        <Row label="结束颜色">
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="color" value={waveformStyle.endColor}
              onChange={e => onWaveformStyleChange({ endColor: e.target.value })} />
            <input type="text" value={waveformStyle.endColor}
              onChange={e => onWaveformStyleChange({ endColor: e.target.value })}
              style={{ flex: 1, fontFamily: 'monospace', fontSize: 11 }} />
          </div>
        </Row>
        <Row label="波形样式">
          <select value={waveformStyle.style}
            onChange={e => onWaveformStyleChange({ style: e.target.value as any })}
            style={{ width: '100%' }}>
            <option value="mirror">镜像柱状</option>
            <option value="bars">柱状</option>
            <option value="line">曲线</option>
          </select>
        </Row>
        <Row label="圆角大小" valueText={String(waveformStyle.cornerRadius)}>
          <input type="range" min="0" max="6" step="0.5" value={waveformStyle.cornerRadius}
            onChange={e => onWaveformStyleChange({ cornerRadius: parseFloat(e.target.value) })} />
        </Row>
        <Row label="柱间距" valueText={String(waveformStyle.barGap)}>
          <input type="range" min="0" max="8" step="0.5" value={waveformStyle.barGap}
            onChange={e => onWaveformStyleChange({ barGap: parseFloat(e.target.value) })} />
        </Row>
        <Row label="垂直缩放" valueText={waveformStyle.verticalScale.toFixed(1) + 'x'}>
          <input type="range" min="0.3" max="2" step="0.05" value={waveformStyle.verticalScale}
            onChange={e => onWaveformStyleChange({ verticalScale: parseFloat(e.target.value) })} />
        </Row>
      </Card>

      <Card title="✏️ 文字编辑">
        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
          {['title', 'subtitle', 'tag'].map((id, idx) => {
            const labels = ['标题', '副标题', '标签'];
            return (
              <button key={id}
                onClick={() => onSelectText(id)}
                style={{
                  flex: 1,
                  padding: '6px 4px',
                  fontSize: 11,
                  background: activeTab === id
                    ? 'linear-gradient(135deg, #00d4ff, #0088aa)'
                    : 'rgba(60, 60, 100, 0.4)',
                  color: activeTab === id ? '#0a0a14' : 'var(--text-primary)',
                }}>
                {labels[idx]}
              </button>
            );
          })}
        </div>

        {selectedText && (
          <>
            <Row label="内容">
              <textarea value={selectedText.content}
                onChange={e => onTextUpdate(selectedText.id, { content: e.target.value })}
                rows={2}
                style={{ width: '100%', resize: 'vertical', minHeight: 48 }}
                placeholder="输入文字内容..." />
            </Row>
            <Row label="字体">
              <select value={selectedText.style.fontFamily}
                onChange={e => onTextUpdate(selectedText.id, { style: { fontFamily: e.target.value as FontFamily } })}
                style={{ width: '100%' }}>
                {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label} - {f.sample}</option>)}
              </select>
            </Row>
            <Row label="字号" valueText={`${selectedText.style.fontSize}px`}>
              <input type="range" min="12" max="80" value={selectedText.style.fontSize}
                onChange={e => onTextUpdate(selectedText.id, { style: { fontSize: parseInt(e.target.value) } })} />
            </Row>
            <Row label="颜色">
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="color" value={selectedText.style.color.startsWith('#') ? selectedText.style.color : '#ffffff'}
                  onChange={e => onTextUpdate(selectedText.id, { style: { color: e.target.value } })} />
                <input type="text" value={selectedText.style.color}
                  onChange={e => onTextUpdate(selectedText.id, { style: { color: e.target.value } })}
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: 11 }} />
              </div>
            </Row>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => onTextUpdate(selectedText.id, { style: { fontWeight: selectedText.style.fontWeight === 'bold' ? 'normal' : 'bold' } })}
                className={selectedText.style.fontWeight === 'bold' ? '' : 'secondary'}
                style={{ flex: 1, padding: '6px' }}>
                <b>B</b>
              </button>
              <button
                onClick={() => onTextUpdate(selectedText.id, { style: { italic: !selectedText.style.italic } })}
                className={selectedText.style.italic ? '' : 'secondary'}
                style={{ flex: 1, padding: '6px' }}>
                <i>I</i>
              </button>
              <select value={selectedText.style.alignment}
                onChange={e => onTextUpdate(selectedText.id, { style: { alignment: e.target.value as any } })}
                style={{ flex: 1.2, fontSize: 11 }}>
                <option value="left">左对齐</option>
                <option value="center">居中</option>
                <option value="right">右对齐</option>
              </select>
            </div>
            <div style={{
              borderTop: '1px solid var(--card-border)',
              paddingTop: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>阴影效果</div>
              <Row label="X偏移" valueText={`${selectedText.style.textShadow.offsetX}px`}>
                <input type="range" min="-20" max="20" value={selectedText.style.textShadow.offsetX}
                  onChange={e => onTextUpdate(selectedText.id, { style: { textShadow: { offsetX: parseInt(e.target.value) } } })} />
              </Row>
              <Row label="Y偏移" valueText={`${selectedText.style.textShadow.offsetY}px`}>
                <input type="range" min="-20" max="20" value={selectedText.style.textShadow.offsetY}
                  onChange={e => onTextUpdate(selectedText.id, { style: { textShadow: { offsetY: parseInt(e.target.value) } } })} />
              </Row>
              <Row label="模糊半径" valueText={`${selectedText.style.textShadow.blur}px`}>
                <input type="range" min="0" max="30" value={selectedText.style.textShadow.blur}
                  onChange={e => onTextUpdate(selectedText.id, { style: { textShadow: { blur: parseInt(e.target.value) } } })} />
              </Row>
              <Row label="阴影颜色">
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="color"
                    value={(selectedText.style.textShadow.color.match(/#[0-9a-fA-F]{6}/)?.[0]) || '#000000'}
                    onChange={e => onTextUpdate(selectedText.id, {
                      style: {
                        textShadow: {
                          color: selectedText.style.textShadow.color.startsWith('rgba')
                            ? `rgba(0,0,0,${parseFloat(selectedText.style.textShadow.color.split(',')[3] || '0.5')})`
                            : e.target.value
                        }
                      }
                    })} />
                  <input type="text" value={selectedText.style.textShadow.color}
                    onChange={e => onTextUpdate(selectedText.id, { style: { textShadow: { color: e.target.value } } })}
                    style={{ flex: 1, fontFamily: 'monospace', fontSize: 10 }} />
                </div>
              </Row>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 4 }}>
              💡 在画布上可直接拖动文字位置
            </div>
          </>
        )}
      </Card>

      <Card title="🎨 背景配置">
        <Row label="背景模式">
          <div style={{ display: 'flex', gap: 4 }}>
            {(['solid', 'gradient', 'image'] as const).map(m => (
              <button key={m}
                onClick={() => {
                  if (m === 'solid') onBackgroundConfigChange({ mode: 'solid', color: '#1a1a2e' });
                  else if (m === 'gradient') onBackgroundConfigChange({
                    mode: 'gradient', type: 'linear',
                    startColor: '#1a1a2e', endColor: '#16213e',
                    startX: 0, startY: 0, endX: 1, endY: 1
                  });
                  else imageInputRef.current?.click();
                }}
                className={backgroundConfig.mode === m ? '' : 'secondary'}
                style={{ flex: 1, fontSize: 11, padding: '6px 2px' }}>
                {m === 'solid' ? '纯色' : m === 'gradient' ? '渐变' : '图片'}
              </button>
            ))}
          </div>
        </Row>

        <input ref={imageInputRef} type="file" accept="image/*" hidden
          onChange={e => {
            if (e.target.files?.[0]) onUploadImage(e.target.files[0]);
            e.target.value = '';
          }} />

        {backgroundConfig.mode === 'solid' && (
          <>
            <Row label="颜色选择">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 6
              }}>
                {BASE_COLORS.map(c => (
                  <div key={c}
                    onClick={() => onBackgroundConfigChange({ mode: 'solid', color: c })}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: 6,
                      background: c,
                      cursor: 'pointer',
                      border: backgroundConfig.color === c ? '2px solid var(--accent)' : '2px solid transparent',
                      boxSizing: 'border-box',
                      transition: 'transform 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                ))}
              </div>
            </Row>
            <Row label="自定义颜色">
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="color" value={(backgroundConfig as any).color || '#1a1a2e'}
                  onChange={e => onBackgroundConfigChange({ mode: 'solid', color: e.target.value })} />
                <input type="text" value={(backgroundConfig as any).color || '#1a1a2e'}
                  onChange={e => onBackgroundConfigChange({ mode: 'solid', color: e.target.value })}
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: 11 }} />
              </div>
            </Row>
          </>
        )}

        {backgroundConfig.mode === 'gradient' && (
          <>
            <Row label="渐变类型">
              <select value={(backgroundConfig as any).type || 'linear'}
                onChange={e => onBackgroundConfigChange({
                  ...backgroundConfig,
                  mode: 'gradient',
                  type: e.target.value as any,
                } as BackgroundConfig)}
                style={{ width: '100%' }}>
                <option value="linear">线性渐变</option>
                <option value="radial">径向渐变</option>
              </select>
            </Row>
            <Row label="起始颜色">
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="color" value={(backgroundConfig as any).startColor || '#1a1a2e'}
                  onChange={e => onBackgroundConfigChange({
                    ...backgroundConfig,
                    mode: 'gradient',
                    startColor: e.target.value,
                  } as BackgroundConfig)} />
                <input type="text" value={(backgroundConfig as any).startColor || '#1a1a2e'}
                  onChange={e => onBackgroundConfigChange({
                    ...backgroundConfig,
                    mode: 'gradient',
                    startColor: e.target.value,
                  } as BackgroundConfig)}
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: 11 }} />
              </div>
            </Row>
            <Row label="结束颜色">
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="color" value={(backgroundConfig as any).endColor || '#16213e'}
                  onChange={e => onBackgroundConfigChange({
                    ...backgroundConfig,
                    mode: 'gradient',
                    endColor: e.target.value,
                  } as BackgroundConfig)} />
                <input type="text" value={(backgroundConfig as any).endColor || '#16213e'}
                  onChange={e => onBackgroundConfigChange({
                    ...backgroundConfig,
                    mode: 'gradient',
                    endColor: e.target.value,
                  } as BackgroundConfig)}
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: 11 }} />
              </div>
            </Row>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center' }}>
              💡 在画布上可拖动渐变端点调整方向
            </div>
          </>
        )}

        {backgroundConfig.mode === 'image' && (
          <>
            <button onClick={() => imageInputRef.current?.click()}
              className="secondary"
              style={{ width: '100%' }}>
              📷 上传背景图片
            </button>
            <Row label="模糊强度" valueText={`${(backgroundConfig as any).blur || 0}px`}>
              <input type="range" min="0" max="20" step="0.5" value={(backgroundConfig as any).blur || 0}
                onChange={e => {
                  const blur = parseFloat(e.target.value);
                  if (backgroundConfig.mode === 'image') {
                    onBackgroundConfigChange({ ...backgroundConfig, mode: 'image', blur } as BackgroundConfig);
                  }
                }} />
            </Row>
            <Row label="遮罩透明度" valueText={`${Math.round(((backgroundConfig as any).overlayOpacity || 0) * 100)}%`}>
              <input type="range" min="0" max="1" step="0.05"
                value={(backgroundConfig as any).overlayOpacity || 0}
                onChange={e => {
                  const overlayOpacity = parseFloat(e.target.value);
                  if (backgroundConfig.mode === 'image') {
                    onBackgroundConfigChange({ ...backgroundConfig, mode: 'image', overlayOpacity } as BackgroundConfig);
                  }
                }} />
            </Row>
          </>
        )}
      </Card>

      <Card title="💾 导出与分享">
        <Row label="导出分辨率">
          <div style={{ display: 'flex', gap: 4 }}>
            {([1, 2, 3] as ExportScale[]).map(s => (
              <button key={s}
                className="secondary"
                onClick={() => onExport(s)}
                style={{ flex: 1, fontSize: 11, padding: '8px 4px' }}>
                {s}x<br />
                <span style={{ fontSize: 9, opacity: 0.7 }}>
                  {s === 1 ? '1280×720' : s === 2 ? '2560×1440' : '3840×2160'}
                </span>
              </button>
            ))}
          </div>
        </Row>
        <button onClick={onGenerateShare} style={{ width: '100%', marginTop: 4 }}>
          🔗 生成分享链接
        </button>
        {shareLink && (
          <div style={{
            background: 'rgba(0, 212, 255, 0.08)',
            border: '1px solid rgba(0,212,255,0.25)',
            borderRadius: 8,
            padding: 8,
            display: 'flex',
            gap: 6
          }}>
            <div style={{
              flex: 1,
              fontSize: 10,
              color: 'var(--text-secondary)',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              overflow: 'hidden',
              maxHeight: 48,
            }}>
              {shareLink}
            </div>
            <button onClick={handleCopyLink}
              style={{ padding: '4px 10px', fontSize: 11, flexShrink: 0, height: 28 }}>
              {copied ? '✓ 已复制' : '复制'}
            </button>
          </div>
        )}
      </Card>

      <div style={{
        textAlign: 'center',
        padding: '8px',
        fontSize: 10,
        color: 'var(--text-secondary)',
        marginTop: 'auto',
        borderTop: '1px solid var(--card-border)',
      }}>
        流畅 60FPS · 支持 4K 导出
      </div>
    </div>
  );
};

export default ControlPanel;
