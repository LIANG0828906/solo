import React, { useEffect, useRef, useCallback } from 'react';
import { useSceneStore } from '../store/sceneStore';

const VotePanel: React.FC = () => {
  const currentSceneIndex = useSceneStore((s) => s.currentSceneIndex);
  const scenes = useSceneStore((s) => s.scenes);
  const votes = useSceneStore((s) => s.votes);
  const refreshVotes = useSceneStore((s) => s.refreshVotes);

  const rafIdRef = useRef<number>(0);
  const lastRefreshRef = useRef<number>(0);
  const intervalMs = 3000;

  const refreshLoop = useCallback(
    (timestamp: number) => {
      if (timestamp - lastRefreshRef.current >= intervalMs) {
        lastRefreshRef.current = timestamp;
        const scene = scenes[currentSceneIndex];
        if (scene) {
          refreshVotes(scene.id);
        }
      }
      rafIdRef.current = requestAnimationFrame(refreshLoop);
    },
    [currentSceneIndex, scenes, refreshVotes]
  );

  useEffect(() => {
    lastRefreshRef.current = performance.now();
    rafIdRef.current = requestAnimationFrame(refreshLoop);
    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [refreshLoop]);

  const scene = scenes[currentSceneIndex];
  if (!scene) return null;

  const voteData = votes[scene.id] || { optionA: 1, optionB: 1 };
  const maxVote = Math.max(voteData.optionA, voteData.optionB, 1);
  const widthA = (voteData.optionA / maxVote) * 100;
  const widthB = (voteData.optionB / maxVote) * 100;
  const totalVotes = voteData.optionA + voteData.optionB;
  const percentA = totalVotes > 0 ? Math.round((voteData.optionA / totalVotes) * 100) : 50;
  const percentB = totalVotes > 0 ? 100 - percentA : 50;

  return (
    <div className="vote-panel">
      <h3 className="vote-panel__title">实时投票</h3>
      <p className="vote-panel__scene-name">{scene.title}</p>

      <div className="vote-panel__chart">
        <div className="vote-panel__bar-group">
          <div className="vote-panel__bar-label">
            <span className="vote-panel__option-tag vote-panel__option-tag--a">A</span>
            <span className="vote-panel__option-text">{scene.choices[0].label}</span>
          </div>
          <div className="vote-panel__bar-track">
            <div
              className="vote-panel__bar vote-panel__bar--a"
              style={{ width: `${widthA}%` }}
            />
          </div>
          <div className="vote-panel__bar-stats">
            <span className="vote-panel__vote-count">{voteData.optionA} 票</span>
            <span className="vote-panel__vote-percent">{percentA}%</span>
          </div>
        </div>

        <div className="vote-panel__divider" />

        <div className="vote-panel__bar-group">
          <div className="vote-panel__bar-label">
            <span className="vote-panel__option-tag vote-panel__option-tag--b">B</span>
            <span className="vote-panel__option-text">{scene.choices[1].label}</span>
          </div>
          <div className="vote-panel__bar-track">
            <div
              className="vote-panel__bar vote-panel__bar--b"
              style={{ width: `${widthB}%` }}
            />
          </div>
          <div className="vote-panel__bar-stats">
            <span className="vote-panel__vote-count">{voteData.optionB} 票</span>
            <span className="vote-panel__vote-percent">{percentB}%</span>
          </div>
        </div>
      </div>

      <div className="vote-panel__footer">
        <span className="vote-panel__total">总票数: {totalVotes}</span>
        <span className="vote-panel__refresh-hint">每3秒自动刷新</span>
      </div>
    </div>
  );
};

export default VotePanel;
