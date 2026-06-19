import { useState, useEffect, useCallback } from 'react';
import { Info } from 'lucide-react';
import { useLabStore } from './store';
import { REAGENT_LIST, DANGER_COLORS, type Reagent, type DangerLevel } from './types';

function DangerBadge({ level }: { level: DangerLevel }) {
  if (level === 'toxic') return <span style={{ fontSize: 14 }}>☠️</span>;
  if (level === 'corrosive') {
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 4,
          backgroundColor: DANGER_COLORS.corrosive.bg,
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        腐蚀
      </span>
    );
  }
  if (level === 'flammable') return <span style={{ fontSize: 14 }}>🔥</span>;
  return null;
}

function ReagentModal() {
  const { modalReagentId, modalOpen, modalClosing, closeModal } = useLabStore();

  const reagent = REAGENT_LIST.find((r) => r.id === modalReagentId) as Reagent | undefined;
  if (!reagent) return null;

  const dangerStyle = DANGER_COLORS[reagent.dangerLevel];

  const transform = modalClosing
    ? 'translateY(-100%)'
    : modalOpen
      ? 'translateY(0)'
      : 'translateY(100%)';

  return (
    <div
      onClick={closeModal}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: modalOpen ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          transform,
          transition: 'transform 0.3s ease-out',
          padding: 3,
          borderRadius: 12,
          background: dangerStyle.gradient,
          maxWidth: 360,
          width: '90%',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 10,
            padding: 24,
            color: '#333',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{reagent.name}</h2>
            <DangerBadge level={reagent.dangerLevel} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888', fontSize: 14 }}>化学式</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{reagent.formula}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888', fontSize: 14 }}>摩尔质量</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{reagent.molarMass} g/mol</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888', fontSize: 14 }}>密度</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{reagent.density} g/cm³</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888', fontSize: 14 }}>浓度</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{reagent.concentration}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888', fontSize: 14 }}>危险等级</span>
              <DangerBadge level={reagent.dangerLevel} />
            </div>
          </div>

          <button
            onClick={closeModal}
            style={{
              marginTop: 20,
              width: '100%',
              padding: '10px 0',
              border: 'none',
              borderRadius: 6,
              background: dangerStyle.gradient,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

function DragGhost() {
  const { drag } = useLabStore();
  if (!drag.isDragging || !drag.reagentId) return null;

  const reagent = REAGENT_LIST.find((r) => r.id === drag.reagentId);
  if (!reagent) return null;

  const isPhenolphthalein = reagent.id === 'phenolphthalein';

  return (
    <>
      {drag.trail.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            left: p.x - 8,
            top: p.y - 8,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: p.color,
            opacity: p.alpha * (i / drag.trail.length) * 0.6,
            pointerEvents: 'none',
            zIndex: 9999,
            transition: 'opacity 0.3s',
          }}
        />
      ))}
      <div
        style={{
          position: 'fixed',
          left: drag.x - 24,
          top: drag.y - 24,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: isPhenolphthalein ? 'lightgray' : reagent.color,
          border: isPhenolphthalein ? '2px dashed #ccc' : '2px solid rgba(0,0,0,0.15)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: isPhenolphthalein ? '#999' : '#fff',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }}
      >
        {reagent.formula.slice(0, 2)}
      </div>
    </>
  );
}

export default function ReagentPanel() {
  const [search, setSearch] = useState('');
  const { startDrag, updateDrag, endDrag, drag, openModal } = useLabStore();

  const filtered = REAGENT_LIST.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.formula.toLowerCase().includes(search.toLowerCase()),
  );

  const handleMouseDown = useCallback(
    (reagentId: string, e: React.MouseEvent) => {
      e.preventDefault();
      startDrag(reagentId, e.clientX, e.clientY);
    },
    [startDrag],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (drag.isDragging) {
        updateDrag(e.clientX, e.clientY);
      }
    };
    const onUp = () => {
      if (drag.isDragging) {
        endDrag();
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [drag.isDragging, updateDrag, endDrag]);

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <input
        type="text"
        placeholder="搜索试剂..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          border: '1px solid #3a6ea5',
          borderRadius: 6,
          padding: '8px 12px',
          fontSize: 13,
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {filtered.map((reagent) => {
          const isPhenolphthalein = reagent.id === 'phenolphthalein';
          return (
            <div
              key={reagent.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                cursor: 'grab',
                transition: 'transform 0.2s, box-shadow 0.2s',
                padding: '8px 4px',
                borderRadius: 8,
              }}
              onMouseDown={(e) => handleMouseDown(reagent.id, e)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px) scale(1.05)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 6px 16px ${reagent.color}55, 0 2px 6px rgba(0,0,0,0.12)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0) scale(1)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: isPhenolphthalein ? 'lightgray' : reagent.color,
                    border: isPhenolphthalein ? '2px dashed #ccc' : '2px solid rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    color: isPhenolphthalein ? '#999' : '#fff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    boxShadow: `0 2px 8px ${reagent.color}40`,
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                >
                  {reagent.formula.slice(0, 3)}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal(reagent.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: 'none',
                    background: '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.15)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  }}
                >
                  <Info size={16} color="#3a6ea5" />
                </button>
              </div>
              <span style={{ fontSize: 12, color: '#333', textAlign: 'center' }}>{reagent.name}</span>
            </div>
          );
        })}
      </div>

      <DragGhost />
      <ReagentModal />
    </div>
  );
}
