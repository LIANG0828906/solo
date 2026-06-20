import React from 'react';
import { useSceneStore } from '@/store/sceneStore';
import { Slider } from './Slider';
import { Trash2, Route, Plus } from 'lucide-react';

const formatVec3 = (v: [number, number, number]): string => {
  return `(${v[0].toFixed(2)}, ${v[1].toFixed(2)}, ${v[2].toFixed(2)})`;
};

export const PathTab: React.FC = () => {
  const paths = useSceneStore((state) => state.paths);
  const activePathId = useSceneStore((state) => state.activePathId);
  const pendingStartPoint = useSceneStore((state) => state.pendingStartPoint);
  const removePath = useSceneStore((state) => state.removePath);
  const updatePathSpeed = useSceneStore((state) => state.updatePathSpeed);
  const setPendingStartPoint = useSceneStore((state) => state.setPendingStartPoint);

  const activePath = paths.find((p) => p.id === activePathId);

  const handleSelectPath = (id: string) => {
    useSceneStore.setState({ activePathId: id });
  };

  const handleStartAddPath = () => {
    setPendingStartPoint(null);
  };

  return (
    <div className="path-section">
      <div className="section-title">路径列表</div>

      {paths.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Route size={32} />
          </div>
          暂无路径，点击下方按钮或在3D场景中点击添加路径
        </div>
      ) : (
        <div className="path-list">
          {paths.map((path, index) => (
            <div
              key={path.id}
              className={`path-item ${activePathId === path.id ? 'active' : ''}`}
              onClick={() => handleSelectPath(path.id)}
            >
              <div>
                <div className="path-item-name">路径 {index + 1}</div>
                <div className="path-item-speed">速度: {path.speed.toFixed(2)}x</div>
              </div>
              <div className="path-item-actions">
                <button
                  className="icon-button danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePath(path.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activePath && (
        <>
          <div className="section-title">路径详情</div>
          <div className="path-info">
            <div className="path-info-row">
              <span className="path-info-label">起点坐标</span>
              <span className="path-info-value">{formatVec3(activePath.startPoint)}</span>
            </div>
            <div className="path-info-row">
              <span className="path-info-label">终点坐标</span>
              <span className="path-info-value">{formatVec3(activePath.endPoint)}</span>
            </div>
            <div className="path-info-row">
              <span className="path-info-label">控制点数量</span>
              <span className="path-info-value">{activePath.controlPoints.length}</span>
            </div>
          </div>
          <Slider
            label="移动速度"
            value={activePath.speed}
            min={0.5}
            max={3}
            step={0.1}
            onChange={(v) => updatePathSpeed(activePath.id, v)}
          />
        </>
      )}

      <div className="section-title">添加路径</div>
      <button className="btn btn-secondary" onClick={handleStartAddPath}>
        <Plus size={16} />
        添加新路径
      </button>
      <div className="empty-state" style={{ padding: '12px', fontSize: '11px' }}>
        提示：点击上方按钮后，在3D场景中依次点击两个位置来创建路径
      </div>
    </div>
  );
};

export default PathTab;
