import React from 'react';
import { useMoleculeStore } from '../store/useMoleculeStore';
import { ELEMENT_INFO } from '../modules/MoleculeEngine';

export const InfoPanel: React.FC = () => {
  const atoms = useMoleculeStore((s) => s.atoms);
  const bonds = useMoleculeStore((s) => s.bonds);
  const selectedAtomId = useMoleculeStore((s) => s.selectedAtomId);
  const selectedBondId = useMoleculeStore((s) => s.selectedBondId);
  const reactionResult = useMoleculeStore((s) => s.reactionResult);
  const animationProgress = useMoleculeStore((s) => s.animationProgress);
  const animationPlaying = useMoleculeStore((s) => s.animationPlaying);
  const animationSpeed = useMoleculeStore((s) => s.animationSpeed);
  const setAnimationProgress = useMoleculeStore((s) => s.setAnimationProgress);
  const setAnimationPlaying = useMoleculeStore((s) => s.setAnimationPlaying);
  const setAnimationSpeed = useMoleculeStore((s) => s.setAnimationSpeed);

  const selectedAtom = atoms.find((a) => a.id === selectedAtomId);
  const selectedBond = bonds.find((b) => b.id === selectedBondId);
  const getBondCount = (id: string) => bonds.filter((b) => b.atomA === id || b.atomB === id).length;

  const bondOrderLabel = (o: number) => (o === 1 ? '单键' : o === 2 ? '双键' : '三键');

  return (
    <div className="right-panel">
      <div className="panel-section">
        <div className="panel-title">统计信息</div>
        <div className="info-card">
          <div className="info-row">
            <span className="label">原子数量</span>
            <span className="value highlight">{atoms.length}</span>
          </div>
          <div className="info-row">
            <span className="label">化学键数量</span>
            <span className="value highlight">{bonds.length}</span>
          </div>
          <div className="info-row">
            <span className="label">分子质量</span>
            <span className="value">
              {atoms.reduce((sum, a) => sum + ELEMENT_INFO[a.element].mass, 0).toFixed(2)} u
            </span>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">选中对象</div>
        {selectedAtom ? (
          <div className="info-card">
            <div className="card-title">原子详情</div>
            <div className="info-row">
              <span className="label">元素</span>
              <span className="value highlight">
                {ELEMENT_INFO[selectedAtom.element].name} ({selectedAtom.element})
              </span>
            </div>
            <div className="info-row">
              <span className="label">坐标 X</span>
              <span className="value">{selectedAtom.position.x.toFixed(3)} Å</span>
            </div>
            <div className="info-row">
              <span className="label">坐标 Y</span>
              <span className="value">{selectedAtom.position.y.toFixed(3)} Å</span>
            </div>
            <div className="info-row">
              <span className="label">坐标 Z</span>
              <span className="value">{selectedAtom.position.z.toFixed(3)} Å</span>
            </div>
            <div className="info-row">
              <span className="label">电荷</span>
              <span className="value">{selectedAtom.charge.toFixed(2)}</span>
            </div>
            <div className="info-row">
              <span className="label">连接键数</span>
              <span className="value highlight">{getBondCount(selectedAtom.id)}</span>
            </div>
            <div className="info-row">
              <span className="label">原子半径</span>
              <span className="value">{ELEMENT_INFO[selectedAtom.element].radius.toFixed(2)} Å</span>
            </div>
            <div className="info-row">
              <span className="label">原子质量</span>
              <span className="value">{ELEMENT_INFO[selectedAtom.element].mass.toFixed(2)} u</span>
            </div>
          </div>
        ) : selectedBond ? (
          <div className="info-card">
            <div className="card-title">化学键详情</div>
            <div className="info-row">
              <span className="label">键级</span>
              <span className="value highlight">{bondOrderLabel(selectedBond.order)}</span>
            </div>
            <div className="info-row">
              <span className="label">原子 A</span>
              <span className="value">
                {atoms.find((a) => a.id === selectedBond.atomA)?.element ?? '-'}
              </span>
            </div>
            <div className="info-row">
              <span className="label">原子 B</span>
              <span className="value">
                {atoms.find((a) => a.id === selectedBond.atomB)?.element ?? '-'}
              </span>
            </div>
          </div>
        ) : (
          <div className="empty-info">点击场景中的原子或键查看详情</div>
        )}
      </div>

      <div className="panel-section">
        <div className="panel-title">反应动画</div>
        {reactionResult ? (
          <div className="info-card">
            <div className="info-row">
              <span className="label">进度</span>
              <span className="value">{(animationProgress * 100).toFixed(0)}%</span>
            </div>
            <div style={{ margin: '8px 0' }}>
              <div
                className="progress-bar"
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  setAnimationProgress(Math.max(0, Math.min(1, x / rect.width)));
                }}
              >
                <div className="progress-fill" style={{ width: `${animationProgress * 100}%` }} />
              </div>
            </div>
            <div className="info-row">
              <span className="label">速度</span>
              <span className="value">
                <select
                  className="form-select"
                  style={{ width: 80, padding: '4px 6px', fontSize: 11 }}
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                >
                  <option value={0.25}>0.25x</option>
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={4}>4x</option>
                </select>
              </span>
            </div>
            <div className="info-row">
              <span className="label">状态</span>
              <span className={animationPlaying ? 'value highlight' : 'value'}>
                {animationPlaying ? '▶ 播放中' : '⏸ 已暂停'}
              </span>
            </div>
          </div>
        ) : (
          <div className="empty-info">模拟反应后可播放动画</div>
        )}
      </div>

      <div className="panel-section">
        <div className="panel-title">反应结果</div>
        {reactionResult ? (
          <div className="info-card">
            <div className="info-row">
              <span className="label">反应类型</span>
              <span className="value highlight">{reactionResult.reactionType}</span>
            </div>
            <div className="info-row">
              <span className="label">焓变 ΔH</span>
              <span className={reactionResult.enthalpy < 0 ? 'value' : 'value negative'}>
                {reactionResult.enthalpy > 0 ? '+' : ''}
                {reactionResult.enthalpy} kcal/mol
              </span>
            </div>
            <div className="info-row">
              <span className="label">活化能 Ea</span>
              <span className="value negative">{reactionResult.activationEnergy} kcal/mol</span>
            </div>
            <div className="info-row">
              <span className="label">路径点数</span>
              <span className="value">{reactionResult.energyProfile.length}</span>
            </div>
            <div className="info-row">
              <span className="label">反应自发性</span>
              <span className={reactionResult.enthalpy < 0 ? 'value highlight' : 'value'}>
                {reactionResult.enthalpy < 0 ? '放热 (自发)' : '吸热 (需能量)'}
              </span>
            </div>
          </div>
        ) : (
          <div className="empty-info">选择反应物并点击"模拟反应"</div>
        )}
      </div>

      <div className="panel-section">
        <div className="panel-title">快捷键</div>
        <div className="info-card" style={{ fontSize: 11 }}>
          <div className="info-row">
            <span className="label">Del</span>
            <span className="value">删除选中对象</span>
          </div>
          <div className="info-row">
            <span className="label">Esc</span>
            <span className="value">取消操作</span>
          </div>
          <div className="info-row">
            <span className="label">左键拖拽</span>
            <span className="value">旋转场景</span>
          </div>
          <div className="info-row">
            <span className="label">右键拖拽</span>
            <span className="value">平移场景</span>
          </div>
          <div className="info-row">
            <span className="label">滚轮</span>
            <span className="value">缩放场景</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;
