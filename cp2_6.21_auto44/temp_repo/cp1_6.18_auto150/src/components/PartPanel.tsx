import React, { useCallback } from 'react';
import { PART_TEMPLATES, MATERIAL_LABELS, getTemplatesByMaterial } from '../data/partData';
import type { PartTemplate, PartMaterial } from '../types';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { PartIcon } from './PartIcon';

const MATERIALS: PartMaterial[] = ['wood', 'fabric', 'metal'];

export const PartPanel: React.FC = () => {
  const setDrag = useWorkspaceStore((s) => s.setDrag);
  const resetDrag = useWorkspaceStore((s) => s.resetDrag);

  const onPartMouseDown = useCallback(
    (e: React.MouseEvent, tpl: PartTemplate) => {
      e.preventDefault();
      setDrag({
        isDragging: true,
        templateId: tpl.id,
        instanceId: null,
        mouseX: e.clientX,
        mouseY: e.clientY,
        source: 'panel',
      });
    },
    [setDrag]
  );

  const onPartTouchStart = useCallback(
    (e: React.TouchEvent, tpl: PartTemplate) => {
      const t = e.touches[0];
      setDrag({
        isDragging: true,
        templateId: tpl.id,
        instanceId: null,
        mouseX: t.clientX,
        mouseY: t.clientY,
        source: 'panel',
      });
    },
    [setDrag]
  );

  return (
    <div
      style={{
        width: 220,
        background: '#F5F0EB',
        borderRadius: 12,
        padding: 16,
        boxSizing: 'border-box',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        overflowY: 'auto',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, color: '#5C4033', letterSpacing: 1 }}>
        零件库
      </div>
      {MATERIALS.map((mat) => {
        const items = getTemplatesByMaterial(mat);
        return (
          <div key={mat} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#8B5E3C',
                paddingBottom: 4,
                borderBottom: '1px dashed rgba(139,94,60,0.3)',
              }}
            >
              {MATERIAL_LABELS[mat]}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {items.map((tpl) => (
                <div
                  key={tpl.id}
                  draggable
                  onMouseDown={(e) => onPartMouseDown(e, tpl)}
                  onTouchStart={(e) => onPartTouchStart(e, tpl)}
                  style={{
                    cursor: 'grab',
                    userSelect: 'none',
                    background: '#FFFBF5',
                    border: '1px solid rgba(191,140,111,0.4)',
                    borderRadius: 8,
                    padding: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'transform 200ms ease-out, background 200ms',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLDivElement).style.background = '#F3E9DC';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLDivElement).style.background = '#FFFBF5';
                  }}
                >
                  <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PartIcon template={tpl} size={50} />
                  </div>
                  <div style={{ fontSize: 11, color: '#5C4033', textAlign: 'center', lineHeight: 1.2 }}>
                    {tpl.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#BF8C6F', fontWeight: 600 }}>¥{tpl.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 11, color: '#8B5E3C', opacity: 0.7, textAlign: 'center', marginTop: 'auto', paddingTop: 8 }}>
        拖拽零件到工作区开始创作
      </div>
    </div>
  );
};
