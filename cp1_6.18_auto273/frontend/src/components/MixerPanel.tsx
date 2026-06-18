import Knob from './Knob';
import { Effects } from '../types';

interface MixerPanelProps {
  masterVolume: number;
  effects: Effects;
  isPlaying: boolean;
  isHost: boolean;
  isExporting: boolean;
  onMasterVolumeChange: (volume: number) => void;
  onEffectsChange: (effects: Effects) => void;
  onPlaybackToggle: () => void;
  onExport: () => void;
}

const MixerPanel: React.FC<MixerPanelProps> = ({
  masterVolume,
  effects,
  isPlaying,
  isHost,
  isExporting,
  onMasterVolumeChange,
  onEffectsChange,
  onPlaybackToggle,
  onExport,
}) => {
  const handleEffectChange = (key: keyof Effects, value: number) => {
    onEffectsChange({ ...effects, [key]: value });
  };

  return (
    <div className="mixer-panel">
      <div>
        <div className="section-title">主输出</div>
        <div className="master-section">
          <div className="vertical-slider-container">
            <span className="master-label">MASTER</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={masterVolume}
              onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
              className="vertical-slider"
              style={{
                WebkitAppearance: 'slider-vertical',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span className="master-value">{masterVolume}</span>
            <span style={{ fontSize: 10, color: '#9E9E9E' }}>VOL</span>
          </div>
        </div>
      </div>

      <div className="effects-section">
        <div className="section-title">效果器</div>
        <div className="knob-row">
          <Knob
            label="混响"
            value={effects.reverb}
            onChange={(v) => handleEffectChange('reverb', v)}
          />
          <Knob
            label="压缩"
            value={effects.compression}
            onChange={(v) => handleEffectChange('compression', v)}
          />
          <Knob
            label="延迟"
            value={effects.delay}
            onChange={(v) => handleEffectChange('delay', v)}
          />
        </div>
      </div>

      <div className="transport-section">
        <div className="section-title">播放控制</div>
        <div className="transport-buttons">
          <button
            className={`play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={onPlaybackToggle}
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            className="stop-btn"
            onClick={() => {
              if (isPlaying) onPlaybackToggle();
            }}
            title="停止"
          >
            ■
          </button>
        </div>
      </div>

      <div>
        <div className="section-title">导出</div>
        <button
          className="export-btn"
          onClick={onExport}
          disabled={!isHost || isExporting}
          title={isHost ? '导出为WAV文件' : '仅房主可导出'}
        >
          {isExporting ? (
            <>
              <div className="loading-spinner" />
              <span>合成中...</span>
            </>
          ) : (
            <>
              <span>⬇</span>
              <span>导出 Demo (WAV)</span>
            </>
          )}
        </button>
        {!isHost && (
          <p style={{ fontSize: 11, color: '#666', textAlign: 'center', marginTop: 8 }}>
            仅房主可触发导出操作
          </p>
        )}
      </div>
    </div>
  );
};

export default MixerPanel;
