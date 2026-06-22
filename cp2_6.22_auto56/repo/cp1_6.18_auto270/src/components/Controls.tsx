import React from 'react';
import { useSortStore } from '../store/sortStore';
import { AlgorithmType, ALGORITHM_NAMES } from '../algorithms/types';

const Controls: React.FC = () => {
  const {
    algorithm,
    setAlgorithm,
    togglePlay,
    stepForward,
    stepBackward,
    reset,
    generateNewArray,
    isPlaying,
    currentStepIndex,
    steps,
  } = useSortStore();

  const canStepForward = currentStepIndex < steps.length - 1;
  const canStepBackward = currentStepIndex > 0;

  return (
    <div className="toolbar">
      <div className="algorithm-select-wrapper">
        <select
          className="algorithm-select"
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
          disabled={isPlaying}
        >
          {Object.entries(ALGORITHM_NAMES).map(([key, name]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="button-group">
        <button
          className={`btn ${isPlaying ? '' : 'btn-primary'}`}
          onClick={togglePlay}
        >
          {isPlaying ? '⏸ 暂停' : '▶ 自动运行'}
        </button>

        <button
          className="btn"
          onClick={stepForward}
          disabled={!canStepForward || isPlaying}
        >
          ⏭ 单步前进
        </button>

        <button
          className="btn"
          onClick={stepBackward}
          disabled={!canStepBackward || isPlaying}
        >
          ⏮ 单步后退
        </button>

        <button
          className="btn"
          onClick={reset}
          disabled={isPlaying}
        >
          ↺ 重置
        </button>

        <button
          className="btn"
          onClick={generateNewArray}
          disabled={isPlaying}
        >
          🎲 随机生成
        </button>
      </div>
    </div>
  );
};

export default React.memo(Controls);
