import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store';
import WaveformCanvas from './WaveformCanvas';
import { AudioPlayer } from '@/utils/audio';
import { instrumentColors, instrumentEmojis, instrumentLabels } from '@/utils/colors';

const player = new AudioPlayer();

export default function WaveformPlayer() {
  const selectedId = useAppStore((s) => s.ui.selectedLickId);
  const licks = useAppStore((s) => s.licks);
  const updateLick = useAppStore((s) => s.updateLick);
  const isPlaying = useAppStore((s) => s.player.isPlaying);
  const setPlaying = useAppStore((s) => s.setPlaying);
  const currentTime = useAppStore((s) => s.player.currentTime);
  const setCurrentTime = useAppStore((s) => s.setCurrentTime);
  const appliedPresetId = useAppStore((s) => s.ui.appliedPresetId);
  const presets = useAppStore((s) => s.presets);

  const [tagInput, setTagInput] = useState('');
  const loadedIdRef = useRef<string | null>(null);

  const lick = licks.find((l) => l.id === selectedId) || null;
  const appliedPreset = presets.find((p) => p.id === appliedPresetId) || null;

  useEffect(() => {
    if (!lick || !lick.audioUrl) return;
    if (loadedIdRef.current !== lick.id) {
      player.load(lick.audioUrl);
      loadedIdRef.current = lick.id;
    }
    player.setOnTimeUpdate((t) => {
      setCurrentTime(t);
    });
    player.setOnEnded(() => {
      setPlaying(false);
      setCurrentTime(0);
    });
    return () => {
      player.setOnTimeUpdate(() => {});
      player.setOnEnded(() => {});
    };
  }, [lick, setCurrentTime, setPlaying]);

  useEffect(() => {
    if (!lick) return;
    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [isPlaying, lick]);

  const handleTogglePlay = () => {
    if (!lick || !lick.audioUrl) {
      return;
    }
    setPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!lick) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = ratio * (lick.duration || player.getDuration() || 1);
    player.seek(time);
    setCurrentTime(time);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (!tag || !lick) return;
    if (!lick.tags.includes(tag)) {
      updateLick(lick.id, { tags: [...lick.tags, tag] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    if (!lick) return;
    updateLick(lick.id, { tags: lick.tags.filter((t) => t !== tag) });
  };

  const progress = lick ? (currentTime / Math.max(0.01, lick.duration || player.getDuration() || 1)) : 0;
  const color = lick ? instrumentColors[lick.instrument] : '#64B5F6';

  return (
    <div
      style={{
        flex: 1,
        minHeight: 180,
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
        gap: 12,
        backgroundColor: '#121212',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: '#64B5F6',
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          ≋ 波形回放
        </div>
        {appliedPreset && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 4,
              backgroundColor: '#64B5F622',
              border: '1px solid #64B5F644',
              fontSize: 11,
              color: '#64B5F6',
            }}
          >
            <span>{instrumentEmojis[appliedPreset.instrument]}</span>
            <span style={{ fontWeight: 600 }}>{appliedPreset.name}</span>
            <span style={{ opacity: 0.7 }}>已应用</span>
          </div>
        )}
      </div>

      {!lick ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#555555',
            fontSize: 13,
          }}
        >
          从左侧选择一个乐句查看波形并回放
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>{instrumentEmojis[lick.instrument]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#FFFFFF',
                }}
              >
                {lick.name}
              </div>
              <div style={{ fontSize: 11, color: '#757575', marginTop: 2 }}>
                {instrumentLabels[lick.instrument]} · {lick.key} · {lick.bpm} BPM · {lick.duration.toFixed(1)}s
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <label style={{ fontSize: 10, color: '#757575' }}>调性</label>
              <input
                value={lick.key}
                onChange={(e) => updateLick(lick.id, { key: e.target.value })}
                style={{
                  width: 60,
                  padding: '4px 8px',
                  borderRadius: 4,
                  backgroundColor: '#2A2A2A',
                  border: '1px solid #424242',
                  color: '#FFFFFF',
                  fontSize: 12,
                  textAlign: 'center',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <label style={{ fontSize: 10, color: '#757575' }}>BPM</label>
              <input
                type="number"
                min={60}
                max={200}
                value={lick.bpm}
                onChange={(e) => {
                  const v = Math.max(60, Math.min(200, Number(e.target.value) || 60));
                  updateLick(lick.id, { bpm: v });
                }}
                style={{
                  width: 70,
                  padding: '4px 8px',
                  borderRadius: 4,
                  backgroundColor: '#2A2A2A',
                  border: '1px solid #424242',
                  color: '#FFFFFF',
                  fontSize: 12,
                  textAlign: 'center',
                }}
              />
            </div>
          </div>

          <div
            onClick={handleSeek}
            style={{
              position: 'relative',
              backgroundColor: '#1E1E1E',
              borderRadius: 8,
              padding: '12px 8px',
              cursor: 'pointer',
              border: '1px solid #2A2A2A',
            }}
          >
            <WaveformCanvas
              data={lick.waveformData}
              height={72}
              barWidth={2}
              gap={1}
              color={color + '66'}
              progressColor={color}
              progress={progress}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleTogglePlay}
              disabled={!lick.audioUrl}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: lick.audioUrl ? color : '#424242',
                color: '#121212',
                fontSize: 18,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${color}44`,
                opacity: lick.audioUrl ? 1 : 0.5,
              }}
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
            <div style={{ flex: 1, fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ fontSize: 12, color: '#757575' }}>
                {currentTime.toFixed(2)}s / {lick.duration.toFixed(2)}s
              </div>
            </div>
            {!lick.audioUrl && (
              <span style={{ fontSize: 11, color: '#FFA726' }}>示例数据，无法回放</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 10, color: '#757575', textTransform: 'uppercase', letterSpacing: 1 }}>
              标签
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {lick.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    borderRadius: 4,
                    backgroundColor: color + '22',
                    color: color,
                    fontSize: 11,
                    border: `1px solid ${color}44`,
                  }}
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    style={{
                      background: 'transparent',
                      color: color,
                      fontSize: 12,
                      lineHeight: 1,
                      padding: 0,
                      opacity: 0.7,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                  }}
                  placeholder="添加标签..."
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    backgroundColor: '#2A2A2A',
                    border: '1px solid #424242',
                    color: '#FFFFFF',
                    fontSize: 11,
                    width: 100,
                  }}
                />
                <button
                  onClick={handleAddTag}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 4,
                    backgroundColor: '#64B5F6',
                    color: '#121212',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
