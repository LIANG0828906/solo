import React from 'react';
import { useMoleculeStore } from '../store/useMoleculeStore';
import { ELEMENT_INFO } from '../modules/MoleculeEngine';

export const ProximityDialog: React.FC = () => {
  const proximityAlert = useMoleculeStore((s) => s.proximityAlert);
  const clearProximityAlert = useMoleculeStore((s) => s.clearProximityAlert);
  const confirmBondCreation = useMoleculeStore((s) => s.confirmBondCreation);

  if (!proximityAlert) return null;

  const handleCreate = (atomId: string) => {
    confirmBondCreation(atomId);
  };

  const newAtomElement = proximityAlert.nearbyAtoms.length > 0
    ? proximityAlert.atomId
    : '';

  return (
    <>
      <div className="proximity-dialog-overlay" onClick={clearProximityAlert} />
      <div className="proximity-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">⚡ 检测到近邻原子</div>
        <div className="dialog-desc">
          新添加的原子与以下原子距离小于 2.0 Å，是否创建化学键？
        </div>
        <div>
          {proximityAlert.nearbyAtoms.map((atom, idx) => {
            const info = ELEMENT_INFO[atom.element];
            const dist = proximityAlert.distances[idx]?.toFixed(3) ?? '';
            return (
              <div
                key={atom.id}
                className="atom-option"
                onClick={() => handleCreate(atom.id)}
              >
                <span className="elem">
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: info.color,
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  />
                  <span>
                    <span style={{ fontWeight: 600 }}>{atom.element}</span>
                    <span style={{ color: '#6e7681', marginLeft: 6 }}>
                      {info.name}
                    </span>
                  </span>
                </span>
                <span style={{ color: '#00ffff', fontSize: 10 }}>{dist} Å</span>
              </div>
            );
          })}
        </div>
        <div className="dialog-buttons">
          <button className="dialog-btn" onClick={clearProximityAlert}>
            取消
          </button>
          <button className="dialog-btn primary" onClick={() => {
            if (proximityAlert.nearbyAtoms.length > 0) {
              handleCreate(proximityAlert.nearbyAtoms[0].id);
            }
          }}>
            与第一个原子成键
          </button>
        </div>
      </div>
    </>
  );
};

export default ProximityDialog;
