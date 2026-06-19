import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAudioStore, NoteEvent, getNoteColor } from '../stores/audioStore';
import { ToneType } from '../utils/audioEngine';

const TONES: { id: ToneType; label: string; bg: string }[] = [
  { id: 'piano', label: '钢琴', bg: '#64B5F6' },
  { id: 'synth', label: '合成音', bg: '#BA68C8' },
  { id: 'xylophone', label: '木琴', bg: '#FFB74D' },
];

const KB_BG_BY_TONE: Record<ToneType, string> = {
  piano: '#2d2d2d',
  synth: '#2d2838',
  xylophone: '#2e2a22',
};

const RecorderPanel: React.FC<{ onToneChange: (bg: string) => void }> = ({ onToneChange }) => {
  const isRecording = useAudioStore((s) => s.isRecording);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const playbackSpeed = useAudioStore((s) => s.playbackSpeed);
  const currentTone = useAudioStore((s) => s.currentTone);
  const recordedNotes = useAudioStore((s) => s.recordedNotes);
  const playbackPosition = useAudioStore((s) => s.playbackPosition);

  const startRecording = useAudioStore((s) => s.startRecording);
  const stopRecording = useAudioStore((s) => s.stopRecording);
  const togglePlayback = useAudioStore((s) => s.togglePlayback);
  const setPlaybackSpeed = useAudioStore((s) => s.setPlaybackSpeed);
  const setTone = useAudioStore((s) => s.setTone);

  const [hoveredNote, setHoveredNote] = useState<NoteEvent | null>(null);
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);
  const waveRef = useRef<HTMLDivElement>(null);

  const totalDuration = useMemo(() => {
    if (recordedNotes.length === 0) return 3000;
    return Math.max(
      3000,
      recordedNotes.reduce((max, n) => Math.max(max, n.startTime + n.duration), 0) + 500
    );
  }, [recordedNotes]);

  const handleToneChange = (tone: ToneType) => {
    setTone(tone);
    onToneChange(KB_BG_BY_TONE[tone]);
  };

  const handleButtonPress = (btnId: string, action: () => void) => {
    setPressedBtn(btnId);
    action();
    setTimeout(() => setPressedBtn(null), 150);
  };

  useEffect(() => {
    onToneChange(KB_BG_BY_TONE[currentTone]);
  }, []);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const millis = Math.floor((ms % 1000) / 10);
    return `${seconds}.${millis.toString().padStart(2, '0')}s`;
  };

  return (
    <div
      style={{
        width: 360,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div
        style={{
          backgroundColor: '#2d2d2d',
          borderRadius: 8,
          padding: 20,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ fontSize: 12, color: '#888', marginBottom: 14, letterSpacing: 2, textTransform: 'uppercase' }}>
          录制控制
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {!isRecording ? (
            <button
              onClick={() => handleButtonPress('record', startRecording)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 2,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: '#FF5722',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: 1,
                transform: pressedBtn === 'record' ? 'scale(0.92)' : 'scale(1)',
                transition: 'transform 0.15s ease, background-color 0.2s ease',
                boxShadow: '0 2px 8px rgba(255,87,34,0.4)',
              }}
            >
              ● 录制
            </button>
          ) : (
            <button
              onClick={() => handleButtonPress('stop', stopRecording)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 2,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: '#d32f2f',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: 1,
                transform: pressedBtn === 'stop' ? 'scale(0.92)' : 'scale(1)',
                transition: 'transform 0.15s ease, background-color 0.2s ease',
                boxShadow: '0 2px 8px rgba(211,47,47,0.5)',
                animation: 'recordingBlink 1s ease-in-out infinite',
              }}
            >
              ■ 停止录制
            </button>
          )}

          <button
            onClick={() => handleButtonPress('play', togglePlayback)}
            disabled={recordedNotes.length === 0 && !isPlaying}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 2,
              border: 'none',
              cursor: recordedNotes.length === 0 && !isPlaying ? 'not-allowed' : 'pointer',
              backgroundColor: isPlaying ? '#FF9800' : '#4CAF50',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: 1,
              transform: pressedBtn === 'play' ? 'scale(0.92)' : 'scale(1)',
              transition: 'transform 0.15s ease, background-color 0.2s ease',
              boxShadow: isPlaying
                ? '0 2px 8px rgba(255,152,0,0.4)'
                : '0 2px 8px rgba(76,175,80,0.4)',
              opacity: recordedNotes.length === 0 && !isPlaying ? 0.4 : 1,
            }}
          >
            {isPlaying ? '⏸ 暂停' : '▶ 播放'}
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#888', letterSpacing: 1 }}>播放速度</span>
            <span style={{ fontSize: 12, color: '#4CAF50', fontWeight: 600, fontFamily: 'Consolas, Monaco, monospace' }}>
              {playbackSpeed.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            style={{
              width: '100%',
              height: 4,
              appearance: 'none',
              background: '#444',
              borderRadius: 2,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#555', marginTop: 4 }}>
            <span>0.5x</span>
            <span>1.0x</span>
            <span>2.0x</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#888', letterSpacing: 1, marginBottom: 8 }}>音色</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {TONES.map((tone) => (
              <button
                key={tone.id}
                onClick={() => handleToneChange(tone.id)}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 2,
                  border: currentTone === tone.id ? `2px solid ${tone.bg}` : '2px solid transparent',
                  cursor: 'pointer',
                  backgroundColor: currentTone === tone.id ? `${tone.bg}25` : '#3a3a3a',
                  color: currentTone === tone.id ? tone.bg : '#aaa',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  transition: 'all 0.2s ease',
                }}
              >
                {tone.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#2d2d2d',
          borderRadius: 8,
          padding: 20,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          flex: 1,
          minHeight: 260,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: '#888', letterSpacing: 2, textTransform: 'uppercase' }}>
            波形预览
          </span>
          <span style={{ fontSize: 11, color: '#555', fontFamily: 'Consolas, Monaco, monospace' }}>
            {recordedNotes.length} 个音符
          </span>
        </div>

        <div
          ref={waveRef}
          style={{
            position: 'relative',
            flex: 1,
            backgroundColor: '#1e1e1e',
            borderRadius: 4,
            overflow: 'hidden',
            minHeight: 180,
          }}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <div
              key={t}
              style={{
                position: 'absolute',
                left: `${t * 100}%`,
                top: 0,
                bottom: 0,
                width: 1,
                backgroundColor: '#333',
              }}
            />
          ))}

          {recordedNotes.map((note, idx) => {
            const left = (note.startTime / totalDuration) * 100;
            const width = Math.max(2, (note.duration / totalDuration) * 100);
            const height = Math.max(8, note.velocity * 100);
            const color = getNoteColor(note.frequency);

            return (
              <div
                key={`${note.startTime}-${idx}`}
                onMouseEnter={() => setHoveredNote(note)}
                onMouseLeave={() => setHoveredNote(null)}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  bottom: 10,
                  width: `${width}%`,
                  height: `${height}%`,
                  maxHeight: 'calc(100% - 20px)',
                  backgroundColor: color,
                  borderRadius: 1,
                  cursor: 'pointer',
                  opacity: hoveredNote === note ? 1 : 0.85,
                  boxShadow: hoveredNote === note ? `0 0 12px ${color}` : 'none',
                  transition: 'opacity 0.15s ease, box-shadow 0.15s ease',
                }}
              />
            );
          })}

          {(isPlaying || playbackPosition > 0) && (
            <div
              style={{
                position: 'absolute',
                left: `${Math.min(100, (playbackPosition / totalDuration) * 100)}%`,
                top: 0,
                bottom: 0,
                width: 2,
                backgroundColor: '#FF5722',
                boxShadow: '0 0 8px rgba(255,87,34,0.8)',
                zIndex: 10,
                transition: isPlaying ? 'none' : 'left 0.1s ease',
              }}
            />
          )}

          {recordedNotes.length === 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#444',
                fontSize: 12,
                letterSpacing: 1,
              }}
            >
              {isRecording ? '正在录制...' : '点击录制按钮开始'}
            </div>
          )}

          {hoveredNote && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.85)',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: 4,
                fontSize: 12,
                fontFamily: 'Consolas, Monaco, monospace',
                display: 'flex',
                gap: 16,
                pointerEvents: 'none',
                zIndex: 20,
                border: `1px solid ${getNoteColor(hoveredNote.frequency)}`,
              }}
            >
              <span style={{ color: getNoteColor(hoveredNote.frequency), fontWeight: 700 }}>
                {hoveredNote.note}
              </span>
              <span style={{ color: '#aaa' }}>{hoveredNote.frequency.toFixed(2)} Hz</span>
              <span style={{ color: '#aaa' }}>时间: {formatTime(hoveredNote.startTime)}</span>
              <span style={{ color: '#aaa' }}>时长: {formatTime(hoveredNote.duration)}</span>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
            fontSize: 10,
            color: '#555',
            fontFamily: 'Consolas, Monaco, monospace',
          }}
        >
          <span>0.00s</span>
          <span>{formatTime(totalDuration / 2)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
};

export default RecorderPanel;
