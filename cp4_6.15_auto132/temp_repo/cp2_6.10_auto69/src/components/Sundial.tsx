import React from 'react';
import { useSundialStore } from '../store/sundialStore';

const Sundial: React.FC = () => {
  const {
    solarTermIndex,
    sunAngle,
    isDraggingSun,
    isTransitioning,
    transitionProgress,
  } = useSundialStore();

  return (
    <div>
      <h1>日晷</h1>
      <p>当前节气索引: {solarTermIndex.toFixed(2)}</p>
      <p>太阳角度: {sunAngle.toFixed(2)}°</p>
      <p>拖拽中: {isDraggingSun ? '是' : '否'}</p>
      <p>过渡中: {isTransitioning ? '是' : '否'}</p>
      <p>过渡进度: {(transitionProgress * 100).toFixed(0)}%</p>
    </div>
  );
};

export default Sundial;
