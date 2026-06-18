import React from 'react';
import { useAppStore } from '@/store/useAppStore';

export const BoneAnimator: React.FC = () => {
  const keyframes = useAppStore((state) => state.keyframes);
  const removeKeyframe = useAppStore((state) => state.removeKeyframe);
  const clearKeyframes = useAppStore((state) => state.clearKeyframes);
  const animation = useAppStore((state) => state.animation);
  const setAnimationPlaying = useAppStore((state) => state.setAnimationPlaying);
  const setAnimationSpeed = useAppStore((state) => state.setAnimationSpeed);
  const setTrailPoints = useAppStore((state) => state.setTrailPoints);
  const setCurrentFrame = useAppStore((state) => state.setCurrentFrame);

  const handlePlayPause = () => {
    if (keyframes.length < 2) {
      alert('请至少添加2个关键帧');
      return;
    }
    if (!animation.isPlaying) {
      setTrailPoints([]);
      setCurrentFrame(0);
    }
    setAnimationPlaying(!animation.isPlaying);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnimationSpeed(parseFloat(e.target.value));
  };

  return (
    <div className="bone-animator">
      <h3 className="section-title">🎬 骨骼动画</h3>

      <div className="keyframes-section">
        <h4 className="subsection-title">关键帧管理</h4>
        <div className="keyframes-list">
          {keyframes.length === 0 ? (
            <p className="empty-hint">还没有关键帧，按住Shift键在画布上点击添加</p>
          ) : (
            keyframes.map((kf) => (
              <div key={kf.id} className="keyframe-item">
                <span className="keyframe-index">#{kf.index + 1}</span>
                <span className="keyframe-coords">
                  ({Math.round(kf.x)}, {Math.round(kf.y)})
                </span>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeKeyframe(kf.id)}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
        {keyframes.length > 0 && (
          <div className="keyframes-actions">
            <span className="keyframe-count">
              {keyframes.length}/10 个关键帧
            </span>
            <button type="button" className="clear-keyframes-btn" onClick={clearKeyframes}>
              清除全部
            </button>
          </div>
        )}
      </div>

      <div className="animation-controls">
        <h4 className="subsection-title">动画控制</h4>
        <div className="playback-section">
          <button
            type="button"
            className={`play-btn ${animation.isPlaying ? 'playing' : ''}`}
            onClick={handlePlayPause}
          >
            {animation.isPlaying ? '⏸️ 暂停' : '▶️ 播放'}
          </button>
        </div>
        <div className="speed-control">
          <label>
            播放速度: {animation.speed.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={animation.speed}
            onChange={handleSpeedChange}
            className="speed-slider"
          />
          <div className="speed-labels">
            <span>0.5x</span>
            <span>1.5x</span>
            <span>3x</span>
          </div>
        </div>
      </div>
    </div>
  );
};
