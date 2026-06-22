import React from 'react';
import { Formula } from '../types';

interface FormulaCardProps {
  formula: Formula;
  onEdit: (formula: Formula) => void;
  onDelete: (id: number) => void;
  onClick: (formula: Formula) => void;
}

export const FormulaCard: React.FC<FormulaCardProps> = ({ formula, onEdit, onDelete, onClick }) => {
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      className="formula-card"
      style={{
        ['--from-color' as any]: formula.colorFrom,
        ['--to-color' as any]: formula.colorTo
      }}
      onClick={() => onClick(formula)}
    >
      <div className="formula-card-content">
        <h3>{formula.name}</h3>
        <div className="formula-meta">
          <span className="formula-tag">主染料: {formula.mainDye}</span>
          <span className="formula-tag">媒染剂: {formula.mordant}</span>
        </div>
        <div className="formula-meta">
          <span className="formula-tag">温度: {formula.temperature}°C</span>
          <span className="formula-tag">时长: {formula.duration}h</span>
          <span className="formula-tag">pH: {formula.ph}</span>
        </div>
        <div className="formula-meta">
          <span className="formula-tag" style={{ 
            background: formula.isAvailable ? '#C8E6C9' : '#FFCDD2',
            color: formula.isAvailable ? '#2E7D32' : '#C62828'
          }}>
            {formula.isAvailable ? '✓ 可用' : '✕ 不可用'}
          </span>
        </div>
        <div className="formula-card-actions">
          <button 
            className="btn btn-secondary" 
            onClick={(e) => handleActionClick(e, () => onEdit(formula))}
          >
            编辑
          </button>
          <button 
            className="btn btn-danger" 
            onClick={(e) => handleActionClick(e, () => onDelete(formula.id))}
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
};
