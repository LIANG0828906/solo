import React, { useCallback, useRef } from 'react';
import { parsePLY, parseXYZ, Point3D } from './PointCloudData';

interface ControlPanelProps {
  samplePercent: number;
  pointCount: number;
  totalPoints: number;
  onSampleChange: (percent: number) => void;
  onLoadPoints: (points: Point3D[]) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  samplePercent,
  pointCount,
  totalPoints,
  onSampleChange,
  onLoadPoints,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const ext = file.name.split('.').pop()?.toLowerCase();
        let points: Point3D[] = [];
        if (ext === 'ply') {
          points = parsePLY(text);
        } else {
          points = parseXYZ(text);
        }
        if (points.length > 0) {
          onLoadPoints(points);
        }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [onLoadPoints]
  );

  return (
    <div className="control-panel">
      <div className="control-row">
        <span className="control-label">降采样</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={samplePercent}
          onChange={(e) => onSampleChange(Number(e.target.value))}
          className="sample-slider"
        />
        <span className="control-value">{samplePercent}%</span>
      </div>
      <div className="control-row">
        <span className="control-label">点数</span>
        <span className="point-count">{pointCount.toLocaleString()}</span>
        <span className="control-sub">/ {totalPoints.toLocaleString()}</span>
      </div>
      <div className="control-row">
        <input
          ref={fileInputRef}
          type="file"
          accept=".ply,.xyz"
          onChange={handleFileChange}
          className="file-input"
          id="file-input"
        />
        <label htmlFor="file-input" className="load-btn">
          加载文件
        </label>
      </div>
    </div>
  );
};

export default ControlPanel;
