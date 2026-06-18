import { useState, useEffect } from 'react';
import { CellScene } from './CellScene';
import { useCellStore } from './useCellStore';
import './styles.css';

const phaseNames: Record<string, string> = {
  idle: '就绪',
  stretching: '细胞拉伸中...',
  splitting: '细胞核分裂中...',
  separating: '子细胞分离中...',
  resetting: '恢复中...'
};

function InfoPanel() {
  const { selectedOrganelle } = useCellStore();

  if (!selectedOrganelle) {
    return (
      <div className="info-panel">
        <h3>细胞之城</h3>
        <div className="info-row">
          <span className="info-label">提示</span>
          <span className="info-value">点击细胞器查看详情</span>
        </div>
        <div className="info-row">
          <span className="info-label">操作</span>
          <span className="info-value">拖拽旋转 / 滚轮缩放</span>
        </div>
      </div>
    );
  }

  return (
    <div className="info-panel">
      <h3>{selectedOrganelle.name}</h3>
      <div className="info-row">
        <span className="info-label">类型</span>
        <span className="info-value">{selectedOrganelle.type}</span>
      </div>
      <div className="info-row">
        <span className="info-label">半径</span>
        <span className="info-value">{selectedOrganelle.radius.toFixed(2)} 单位</span>
      </div>
      <div className="info-row">
        <span className="info-label">颜色</span>
        <span className="info-value">
          <span
            className="color-preview"
            style={{ backgroundColor: selectedOrganelle.color }}
          />
          {selectedOrganelle.color}
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">发光强度</span>
        <span className="info