import React from 'react';
import { BoneAnimator } from './BoneAnimator';
import { ColorTuner } from './ColorTuner';
import { ExportButton } from './ExportButton';

interface ControlPanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ canvasRef }) => {
  return (
    <div className="control-panel">
      <div className="panel-header">
        <h2 className="panel-title">⚙️ 控制面板</h2>
      </div>
      <div className="panel-content">
        <BoneAnimator />
        <div className="divider" />
        <ColorTuner />
        <div className="divider" />
        <ExportButton canvasRef={canvasRef} />
      </div>
    </div>
  );
};
