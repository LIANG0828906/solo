import { Play, Pause, Square, Repeat } from 'lucide-react';
import { useEditorStore } from './editStore';
import './ControlBar.css';

export function ControlBar() {
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const isLooping = useEditorStore((state) => state.isLooping);
  const togglePlay = useEditorStore((state) => state.togglePlay);
  const stop = useEditorStore((state) => state.stop);
  const toggleLoop = useEditorStore((state) => state.toggleLoop);

  return (
    <div className="control-bar">
      <button
        type="button"
        className={`control-btn ${isPlaying ? 'active' : ''}`}
        onClick={togglePlay}
        title={isPlaying ? '暂停' : '播放'}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      <button
        type="button"
        className="control-btn"
        onClick={stop}
        title="停止"
      >
        <Square size={20} />
      </button>

      <button
        type="button"
        className={`control-btn ${isLooping ? 'active' : ''}`}
        onClick={toggleLoop}
        title={isLooping ? '取消循环' : '循环播放'}
      >
        <Repeat size={20} />
      </button>

      <div className="control-status">
        <span className="status-text">
          {isPlaying ? '播放中' : '已暂停'}
          {isLooping ? ' · 循环' : ''}
        </span>
      </div>
    </div>
  );
}
