import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { useMoleculeData } from './useMoleculeData';
import { PRESET_MOLECULES, Atom } from './moleculeData';

const MOLECULE_OPTIONS = [
  { key: 'water', label: '水分子' },
  { key: 'methane', label: '甲烷' },
  { key: 'caffeine', label: '咖啡因' },
];

export default function App() {
  const { molecule, moleculeKey, loadMolecule } = useMoleculeData();
  const [autoRotate, setAutoRotate] = useState(true);
  const [resetSignal, setResetSignal] = useState(0);
  const [hoveredAtom, setHoveredAtom] = useState<{ atom: Atom; x: number; y: number } | null>(null);

  const handleSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    loadMolecule(e.target.value);
  }, [loadMolecule]);

  const handleReset = useCallback(() => {
    setResetSignal(s => s + 1);
  }, []);

  const handleToggleRotate = useCallback(() => {
    setAutoRotate(v => !v);
  }, []);

  const handleHoverAtom = useCallback((atom: Atom | null, event?: any) => {
    if (atom && event && event.nativeEvent) {
      setHoveredAtom({
        atom,
        x: event.nativeEvent.clientX,
        y: event.nativeEvent.clientY,
      });
    } else {
      setHoveredAtom(null);
    }
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 1,
    }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 2]}
        style={{
          background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
        }}
      >
        {molecule && (
          <Scene
            molecule={molecule}
            autoRotate={autoRotate}
            onHoverAtom={handleHoverAtom}
            resetSignal={resetSignal}
          />
        )}
      </Canvas>

      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '250px',
        height: '100vh',
        background: 'rgba(26, 26, 46, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        borderTopRightRadius: '12px',
        borderBottomRightRadius: '12px',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        zIndex: 10,
      }}>
        <div>
          <h1 style={{
            color: '#e6e6e6',
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: '4px',
            letterSpacing: '0.5px',
          }}>
            3D 分子查看器
          </h1>
          <p style={{
            color: 'rgba(230,230,230,0.5)',
            fontSize: '12px',
          }}>
            交互式分子结构可视化
          </p>
        </div>

        <div>
          <label style={{
            color: 'rgba(230,230,230,0.7)',
            fontSize: '12px',
            display: 'block',
            marginBottom: '8px',
            fontWeight: 500,
          }}>
            选择分子
          </label>
          <select
            value={moleculeKey}
            onChange={handleSelectChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(45, 45, 94, 0.6)',
              border: '1px solid rgba(79, 195, 247, 0.3)',
              borderRadius: '8px',
              color: '#e6e6e6',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234fc3f7' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: '36px',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#4fc3f7';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(79, 195, 247, 0.3)';
            }}
          >
            {MOLECULE_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key} style={{
                background: '#1a1a2e',
                color: '#e6e6e6',
              }}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
        }}>
          <button
            onClick={handleReset}
            title="重置视角"
            style={{
              width: '32px',
              height: '32px',
              background: '#2d2d5e',
              border: 'none',
              borderRadius: '8px',
              color: '#e6e6e6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s, transform 0.1s',
              fontSize: '16px',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3d3d7e';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2d2d5e';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ⟳
          </button>
          <button
            onClick={handleToggleRotate}
            title={autoRotate ? '关闭自动旋转' : '开启自动旋转'}
            style={{
              width: '32px',
              height: '32px',
              background: autoRotate ? '#4fc3f7' : '#2d2d5e',
              border: 'none',
              borderRadius: '8px',
              color: autoRotate ? '#0d1117' : '#e6e6e6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s, transform 0.1s',
              fontSize: '14px',
              lineHeight: 1,
              fontWeight: 700,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = autoRotate ? '#81d4fa' : '#3d3d7e';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = autoRotate ? '#4fc3f7' : '#2d2d5e';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ↻
          </button>
        </div>

        <div style={{
          marginTop: 'auto',
          padding: '16px',
          background: 'rgba(45, 45, 94, 0.4)',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          {molecule ? (
            <>
              <div style={{
                color: '#4fc3f7',
                fontSize: '16px',
                fontWeight: 700,
                marginBottom: '4px',
              }}>
                {molecule.name}
              </div>
              <div style={{
                color: 'rgba(230,230,230,0.6)',
                fontSize: '13px',
                marginBottom: '16px',
                fontFamily: 'monospace',
              }}>
                {molecule.formula}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(230,230,230,0.5)', fontSize: '12px' }}>原子总数</span>
                  <span style={{ color: '#e6e6e6', fontSize: '14px', fontWeight: 600 }}>{molecule.atoms.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(230,230,230,0.5)', fontSize: '12px' }}>键总数</span>
                  <span style={{ color: '#e6e6e6', fontSize: '14px', fontWeight: 600 }}>{molecule.bonds.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(230,230,230,0.5)', fontSize: '12px' }}>分子量</span>
                  <span style={{ color: '#e6e6e6', fontSize: '14px', fontWeight: 600 }}>{molecule.molecularWeight} g/mol</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: 'rgba(230,230,230,0.5)', fontSize: '13px' }}>
              加载中...
            </div>
          )}
        </div>

        <div style={{
          color: 'rgba(230,230,230,0.4)',
          fontSize: '11px',
          lineHeight: 1.6,
        }}>
          <div style={{ marginBottom: '4px' }}>🖱️ 拖拽旋转 · 滚轮缩放</div>
          <div>右键平移 · 悬浮查看原子</div>
        </div>
      </div>

      {hoveredAtom && (
        <div style={{
          position: 'fixed',
          left: hoveredAtom.x + 15,
          top: hoveredAtom.y + 15,
          background: '#000000b3',
          color: '#ffffff',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 600,
          pointerEvents: 'none',
          zIndex: 1000,
          whiteSpace: 'nowrap',
        }}>
          {hoveredAtom.atom.element}-{PRESET_MOLECULES.water ? '' : ''}
          {(() => {
            const map: Record<string, string> = { C: '碳', O: '氧', N: '氮', H: '氢' };
            return map[hoveredAtom.atom.element] || '';
          })()}
        </div>
      )}
    </div>
  );
}
