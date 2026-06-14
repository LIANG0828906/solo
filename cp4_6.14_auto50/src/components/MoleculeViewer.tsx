import React from 'react';
import { Molecule, ComparisonResult } from '../types';
import { MOLECULE_LIBRARY } from '../utils/molecules';
import '../styles/MoleculeViewer.css';

interface MoleculeViewerProps {
  selectedMoleculeA: Molecule | null;
  selectedMoleculeB: Molecule | null;
  comparisonResult: ComparisonResult | null;
  isComparing: boolean;
  showComparePanel: boolean;
  onSelectMolecule: (molecule: Molecule) => void;
  onCompare: () => void;
  onCloseComparePanel: () => void;
}

const MoleculeViewer: React.FC<MoleculeViewerProps> = ({
  selectedMoleculeA,
  selectedMoleculeB,
  comparisonResult,
  isComparing,
  showComparePanel,
  onSelectMolecule,
  onCompare,
  onCloseComparePanel,
}) => {
  const isSelectedA = (mol: Molecule) => selectedMoleculeA?.id === mol.id;
  const isSelectedB = (mol: Molecule) => selectedMoleculeB?.id === mol.id;

  const canCompare = selectedMoleculeA && selectedMoleculeB && selectedMoleculeA.id !== selectedMoleculeB.id;

  const currentDisplay = selectedMoleculeB
    ? `${selectedMoleculeA?.name || '-'} ↔ ${selectedMoleculeB?.name || '-'}`
    : selectedMoleculeA?.name || '未选择';

  return (
    <>
      <aside className="app-sidebar">
        <div className="viewer-sidebar">
          <div>
            <div className="viewer-title">分子库</div>
            <div className="viewer-subtitle">Molecule Library</div>
          </div>

          <div className="molecule-select-indicator">
            {selectedMoleculeB ? '已选择两个分子进行比对' : selectedMoleculeA ? '选择第二个分子进行比对' : '点击选择分子'}
          </div>

          <div className="viewer-molecule-list">
            {MOLECULE_LIBRARY.map((molecule) => (
              <div
                key={molecule.id}
                className={`molecule-item ${isSelectedA(molecule) || isSelectedB(molecule) ? 'selected' : ''}`}
                onClick={() => onSelectMolecule(molecule)}
              >
                <div className="molecule-thumbnail">
                  {molecule.formula.charAt(0)}
                </div>
                <div className="molecule-info">
                  <div className="molecule-name">{molecule.name}</div>
                  <div className="molecule-formula">{molecule.formula}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            className="compare-button"
            onClick={onCompare}
            disabled={!canCompare || isComparing}
          >
            {isComparing ? '计算中...' : '开始比对'}
          </button>
        </div>
      </aside>

      <div className="app-bottom-bar">
        <div className="bottom-bar-info">
          <span className="bottom-bar-current">
            当前分子：<strong>{currentDisplay}</strong>
          </span>
        </div>
        <div className="bottom-bar-hint">
          <span><span className="hint-key">拖拽</span> 旋转</span>
          <span><span className="hint-key">滚轮</span> 缩放</span>
          <span><span className="hint-key">Shift</span> 平移</span>
          <span><span className="hint-key">悬停</span> 原子信息</span>
        </div>
      </div>

      <div className={`app-compare-panel ${showComparePanel ? 'visible' : ''}`}>
        <div className="compare-panel-header">
          <span className="compare-panel-title">比对结果</span>
          <button className="compare-panel-close" onClick={onCloseComparePanel}>✕</button>
        </div>
        {comparisonResult && (
          <div className="compare-score-container">
            <div className="compare-score">
              <div className="compare-score-value">{comparisonResult.similarity.toFixed(2)}</div>
              <div className="compare-score-label">相似度评分</div>
            </div>
            <div className="compare-details">
              <div className="compare-detail-row">
                <span className="compare-detail-label">匹配原子数</span>
                <span className="compare-detail-value highlight">
                  {comparisonResult.matchedCount} / {Math.max(comparisonResult.totalAtomsA, comparisonResult.totalAtomsB)}
                </span>
              </div>
              <div className="compare-detail-row">
                <span className="compare-detail-label">分子A原子数</span>
                <span className="compare-detail-value">{comparisonResult.totalAtomsA}</span>
              </div>
              <div className="compare-detail-row">
                <span className="compare-detail-label">分子B原子数</span>
                <span className="compare-detail-value">{comparisonResult.totalAtomsB}</span>
              </div>
              <div className="compare-detail-row">
                <span className="compare-detail-label">RMSD（均方根偏差）</span>
                <span className="compare-detail-value">{comparisonResult.rmsd.toFixed(3)} Å</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MoleculeViewer;
