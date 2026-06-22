import { Difficulty, TrackType, TRACK_LABELS } from '../types';

interface ControlBarProps {
  phase: 'idle' | 'playing' | 'paused' | 'editing' | 'finished';
  bpm: number;
  difficulty: Difficulty;
  selectedTrack: TrackType;
  patternName: string;
  beatCount: number;
  onBPMChange: (bpm: number) => void;
  onDifficultyChange: (d: Difficulty) => void;
  onStart: () => void;
  onStop: () => void;
  onExport: () => void;
  onToggleEdit: () => void;
  onSelectedTrackChange: (t: TrackType) => void;
}

export function ControlBar({
  phase,
  bpm,
  difficulty,
  selectedTrack,
  patternName,
  beatCount,
  onBPMChange,
  onDifficultyChange,
  onStart,
  onStop,
  onExport,
  onToggleEdit,
  onSelectedTrackChange,
}: ControlBarProps) {
  const isPlaying = phase === 'playing';
  const isEditing = phase === 'editing';
  const tracks: TrackType[] = ['drum', 'bass', 'melody', 'effect'];

  return (
    <div className="control-bar">
      <div className="control-group">
        <span className="control-label">BPM</span>
        <input
          type="range"
          min="80"
          max="180"
          step="1"
          value={bpm}
          onChange={(e) => onBPMChange(parseInt(e.target.value, 10))}
          className="bpm-slider"
          disabled={isPlaying}
        />
        <span className="bpm-value">{bpm}</span>
      </div>

      <div className="divider" />

      <div className="control-group">
        <span className="control-label">难度</span>
        <div className="mode-buttons">
          {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              className={`mode-btn ${difficulty === d ? 'active' : ''}`}
              onClick={() => onDifficultyChange(d)}
              disabled={isPlaying}
            >
              {d === 'easy' ? '简单' : d === 'normal' ? '普通' : '困难'}
            </button>
          ))}
        </div>
      </div>

      <div className="divider" />

      {isEditing && (
        <>
          <div className="control-group">
            <span className="control-label">编辑音轨</span>
            <div className="edit-track-selector">
              {tracks.map((t) => (
                <button
                  key={t}
                  className={`track-select-btn ${selectedTrack === t ? `active-${t}` : ''}`}
                  onClick={() => onSelectedTrackChange(t)}
                  title={TRACK_LABELS[t]}
                >
                  {TRACK_LABELS[t].charAt(0)}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
              {beatCount} 拍
            </span>
          </div>
          <div className="divider" />
        </>
      )}

      <div className="control-group">
        <button
          className={`action-btn ${isPlaying ? 'action-btn-stop' : 'action-btn-start'}`}
          onClick={isPlaying ? onStop : onStart}
        >
          {isPlaying ? '停止' : '开始'}
        </button>

        <button
          className={`action-btn action-btn-edit`}
          onClick={onToggleEdit}
          disabled={isPlaying}
          style={{
            background: isEditing
              ? 'linear-gradient(135deg, #6e56ff, #1E90FF)'
              : undefined,
            color: isEditing ? '#fff' : undefined,
            border: isEditing ? 'none' : undefined,
          }}
        >
          {isEditing ? '退出编辑' : '谱面编辑'}
        </button>

        <button
          className="action-btn action-btn-export"
          onClick={onExport}
          title={patternName}
        >
          导出 JSON
        </button>
      </div>
    </div>
  );
}
