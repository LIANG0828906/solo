import React, { useState } from 'react';
import { FaPlay, FaPause, FaStop, FaTrash } from 'react-icons/fa';
import type { PlaybackState } from '../types';

interface ControlPanelProps {
  playbackState: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onClear: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  playbackState,
  onPlay,
  onPause,
  onStop,
  onClear,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClearClick = () => {
    setShowConfirm(true);
  };

  const confirmClear = () => {
    onClear();
    setShowConfirm(false);
  };

  const cancelClear = () => {
    setShowConfirm(false);
  };

  return (
    <div className="control-panel">
      <span className="control-panel-title">控制</span>

      {playbackState !== 'playing' ? (
        <button
          className="btn btn-play"
          onClick={onPlay}
          title="播放"
        >
          <FaPlay />
        </button>
      ) : (
        <button
          className="btn btn-pause"
          onClick={onPause}
          title="暂停"
        >
          <FaPause />
        </button>
      )}

      <button
        className="btn btn-stop"
        onClick={onStop}
        title="停止"
      >
        <FaStop />
      </button>

      <button
        className="btn btn-stop"
        onClick={handleClearClick}
        title="清除所有音符"
      >
        <FaTrash />
      </button>

      {showConfirm && (
        <div className="modal-overlay" onClick={cancelClear}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">确认清除</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
              确定要清除所有音符吗？此操作无法撤销。
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={cancelClear}>
                取消
              </button>
              <button className="btn btn-danger" onClick={confirmClear}>
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
