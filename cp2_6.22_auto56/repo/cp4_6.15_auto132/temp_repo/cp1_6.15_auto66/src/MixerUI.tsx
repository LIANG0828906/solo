import React, { memo } from 'react';
import { Volume2 } from 'lucide-react';
import './styles.css';
import { Track } from './AudioEngine';
import { Slider } from './components/Slider';
import { Knob } from './components/Knob';
import { VUMeter } from './components/VUMeter';

export interface MixerUIProps {
  tracks: Track[];
  masterVolume: number;
  vuLevels: [number, number];
  readOnly: boolean;
  onTrackVolumeChange: (id: string, volume: number) => void;
  onTrackPanChange: (id: string, pan: number) => void;
  onTrackReverbChange: (id: string, value: number) => void;
  onTrackDelayChange: (id: string, value: number) => void;
  onTrackCompressionChange: (id: string, value: number) => void;
  onMasterVolumeChange: (volume: number) => void;
}

export const MixerUI: React.FC<MixerUIProps> = memo(({
  tracks,
  masterVolume,
  vuLevels,
  readOnly,
  onTrackVolumeChange,
  onTrackPanChange,
  onTrackReverbChange,
  onTrackDelayChange,
  onTrackCompressionChange,
  onMasterVolumeChange,
}) => {
  const formatDb = (db: number): string => {
    if (!isFinite(db)) return '-∞';
    return db.toFixed(1);
  };

  const maxDb = Math.max(vuLevels[0], vuLevels[1]);

  return (
    <div className="mixer-area">
      {tracks.map((track) => (
        <div
          key={track.id}
          className="mixer-channel"
          style={{
            width: 80,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px 4px',
            gap: '6px',
            borderRight: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: '#e0e0e0',
              textAlign: 'center',
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 500,
            }}
            title={track.name}
          >
            {track.name}
          </div>

          <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Slider
              value={track.volume}
              min={0}
              max={100}
              step={1}
              orientation="vertical"
              disabled={readOnly}
              onChange={(v) => onTrackVolumeChange(track.id, v)}
            />
          </div>

          <Knob
            value={track.pan}
            min={-1}
            max={1}
            step={0.01}
            label="PAN"
            size="normal"
            disabled={readOnly}
            onChange={(v) => onTrackPanChange(track.id, v)}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '4px',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <Knob
              value={track.reverb}
              min={0}
              max={100}
              step={1}
              label="RVB"
              size="mini"
              showGlow={true}
              glowThreshold={50}
              disabled={readOnly}
              onChange={(v) => onTrackReverbChange(track.id, v)}
            />
            <Knob
              value={track.delay}
              min={0}
              max={100}
              step={1}
              label="DLY"
              size="mini"
              showGlow={true}
              glowThreshold={50}
              disabled={readOnly}
              onChange={(v) => onTrackDelayChange(track.id, v)}
            />
            <Knob
              value={track.compression}
              min={0}
              max={100}
              step={1}
              label="CMP"
              size="mini"
              showGlow={true}
              glowThreshold={50}
              disabled={readOnly}
              onChange={(v) => onTrackCompressionChange(track.id, v)}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '6px',
              justifyContent: 'center',
              marginTop: '2px',
            }}
          >
            <button
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.2)',
                background: track.muted ? '#ef4444' : 'rgba(255,255,255,0.1)',
                color: track.muted ? '#fff' : '#a0a0b8',
                fontSize: 9,
                fontWeight: 700,
                cursor: readOnly ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                opacity: readOnly ? 0.5 : 1,
                pointerEvents: readOnly ? 'none' : 'auto',
              }}
              disabled={readOnly}
            >
              M
            </button>
            <button
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.2)',
                background: track.soloed ? '#eab308' : 'rgba(255,255,255,0.1)',
                color: track.soloed ? '#000' : '#a0a0b8',
                fontSize: 9,
                fontWeight: 700,
                cursor: readOnly ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                opacity: readOnly ? 0.5 : 1,
                pointerEvents: readOnly ? 'none' : 'auto',
              }}
              disabled={readOnly}
            >
              S
            </button>
          </div>
        </div>
      ))}

      <div
        className="mixer-channel master-channel"
        style={{
          width: 120,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px 8px',
          gap: '8px',
          background: 'rgba(255,255,255,0.02)',
          marginLeft: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '4px',
            fontSize: 12,
            color: '#e0e0e0',
            fontWeight: 600,
            letterSpacing: '0.5px',
          }}
        >
          <Volume2 size={14} color="#60a5fa" />
          <span>MASTER</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8px',
            height: 120,
          }}
        >
          <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Slider
              value={masterVolume}
              min={0}
              max={100}
              step={1}
              orientation="vertical"
              disabled={readOnly}
              onChange={onMasterVolumeChange}
            />
          </div>

          <VUMeter
            levelL={vuLevels[0]}
            levelR={vuLevels[1]}
            minDb={-60}
            maxDb={0}
            width={10}
            height={120}
            showLabels={false}
          />
        </div>

        <div
          style={{
            fontSize: 10,
            color: '#a0a0b8',
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'center',
          }}
        >
          {formatDb(maxDb)} dB
        </div>
      </div>
    </div>
  );
});

MixerUI.displayName = 'MixerUI';

export default MixerUI;
