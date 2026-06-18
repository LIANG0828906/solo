import React, { useMemo, useState } from 'react';
import { useMusicStore, makeTemplateNotes, type Waveform } from '../store';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, unit = '', onChange }) => {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#B8B8D0', fontSize: 12, fontWeight: 500 }}>{label}</span>
        <span
          style={{
            color: '#E0E0F0',
            fontSize: 12,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            background: '#2A2A3E',
            padding: '2px 8px',
            borderRadius: 6,
          }}
        >
          {value}{unit}
        </span>
      </div>
      <div style={{ position: 'relative', height: 6, display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 4,
            borderRadius: 2,
            background: '#2A2A3E',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: `${percent}%`,
            height: 4,
            borderRadius: 2,
            background: `linear-gradient(90deg, #00D4AA 0%, #FF6B35 100%)`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            width: '100%',
            height: 16,
            opacity: 0,
            cursor: 'pointer',
            margin: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `calc(${percent}% - 7px)`,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#FF6B35',
            boxShadow: '0 0 0 2px #1A1A2E, 0 2px 6px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
            transition: 'left 0.05s',
          }}
        />
      </div>
    </div>
  );
};

const waveformLabels: Record<Waveform, string> = {
  sine: '正弦波',
  square: '方波',
  sawtooth: '锯齿波',
};

export const ControlPanel: React.FC = () => {
  const playback = useMusicStore((s) => s.playback);
  const setBpm = useMusicStore((s) => s.setBpm);
  const setVolume = useMusicStore((s) => s.setVolume);
  const setReverb = useMusicStore((s) => s.setReverb);
  const setWaveform = useMusicStore((s) => s.setWaveform);
  const loadTemplate = useMusicStore((s) => s.loadTemplate);
  const exportMidi = useMusicStore((s) => s.exportMidi);
  const clearNotes = useMusicStore((s) => s.clearNotes);
  const deleteSelectedNotes = useMusicStore((s) => s.deleteSelectedNotes);

  const templates = useMemo(() => makeTemplateNotes(), []);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFilename, setExportFilename] = useState('melody');

  const handleExport = () => {
    if (exportFilename.trim()) {
      exportMidi(exportFilename.trim());
      setShowExportDialog(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 600,
        background: '#1A1A2E',
        borderRadius: 12,
        border: '1px solid #2A2A3E',
        padding: 16,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}
      >
        <Slider label="BPM" value={playback.bpm} min={60} max={200} onChange={setBpm} />
        <Slider label="音量" value={playback.volume} min={0} max={100} unit="%" onChange={setVolume} />
        <Slider label="混响" value={playback.reverb} min={0} max={100} unit="%" onChange={setReverb} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <span style={{ color: '#B8B8D0', fontSize: 12, fontWeight: 500, marginRight: 4 }}>波形：</span>
        {(Object.keys(waveformLabels) as Waveform[]).map((w) => (
          <button
            key={w}
            onClick={() => setWaveform(w)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: `1px solid ${playback.waveform === w ? '#FF6B35' : '#2A2A3E'}`,
              background: playback.waveform === w ? 'rgba(255,107,53,0.15)' : '#22223A',
              color: playback.waveform === w ? '#FF6B35' : '#B8B8D0',
              fontSize: 12,
              fontWeight: playback.waveform === w ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {waveformLabels[w]}
          </button>
        ))}
      </div>

      <div
        style={{
          borderTop: '1px solid #2A2A3E',
          paddingTop: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ color: '#B8B8D0', fontSize: 12, fontWeight: 500 }}>预置模板</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.values(templates).map((t) => (
            <button
              key={t.name}
              onClick={() => loadTemplate(t)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #2A2A3E',
                background: 'linear-gradient(135deg, rgba(0,212,170,0.1) 0%, rgba(74,158,255,0.1) 100%)',
                color: '#E0E0F0',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                flex: '1 1 auto',
                minWidth: 90,
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#00D4AA';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,170,0.18)';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#2A2A3E';
                (e.currentTarget as HTMLButtonElement).style.background =
                  'linear-gradient(135deg, rgba(0,212,170,0.1) 0%, rgba(74,158,255,0.1) 100%)';
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid #2A2A3E',
          paddingTop: 14,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <button
          onClick={() => setShowExportDialog(true)}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: '1px solid rgba(255,107,53,0.5)',
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF8844 100%)',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
            boxShadow: '0 2px 8px rgba(255,107,53,0.3)',
            flex: '1 1 140px',
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(255,107,53,0.4)';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(255,107,53,0.3)';
          }}
        >
          导出 MIDI
        </button>
        <button
          onClick={clearNotes}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #2A2A3E',
            background: '#22223A',
            color: '#B8B8D0',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#FF4444';
            (e.currentTarget as HTMLButtonElement).style.color = '#FF4444';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#2A2A3E';
            (e.currentTarget as HTMLButtonElement).style.color = '#B8B8D0';
          }}
        >
          清空卷帘
        </button>
        {playback.selectedNoteIds.length > 0 && (
          <button
            onClick={deleteSelectedNotes}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid rgba(255,68,68,0.4)',
              background: 'rgba(255,68,68,0.1)',
              color: '#FF4444',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            删除选中 ({playback.selectedNoteIds.length})
          </button>
        )}
      </div>

      {showExportDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowExportDialog(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1A1A2E',
              border: '1px solid #2A2A3E',
              borderRadius: 12,
              padding: 24,
              minWidth: 300,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ color: '#E0E0F0', fontSize: 15, fontWeight: 600, marginBottom: 14 }}>导出 MIDI 文件</div>
            <label style={{ display: 'block', color: '#B8B8D0', fontSize: 12, marginBottom: 8 }}>文件名</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18 }}>
              <input
                type="text"
                value={exportFilename}
                onChange={(e) => setExportFilename(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExport()}
                autoFocus
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: '#0D0D1A',
                  border: '1px solid #2A2A3E',
                  borderRadius: 8,
                  color: '#E0E0F0',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <span style={{ color: '#8888A0', fontSize: 13 }}>.mid</span>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowExportDialog(false)}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: '1px solid #2A2A3E',
                  background: 'transparent',
                  color: '#B8B8D0',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleExport}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #FF6B35 0%, #FF8844 100%)',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                下载
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
