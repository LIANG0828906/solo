import { useState } from 'react';
import { Box, Circle, Cylinder, Donut, Triangle, Plus, ChevronDown, ChevronRight, Trash2, Sun } from 'lucide-react';
import { useEditorStore, type GeometryType, type LightItem } from '@/store/editorStore';

const GEOMETRIES: Array<{ type: GeometryType; label: string; icon: React.ComponentType<any> }> = [
  { type: 'box', label: '立方体', icon: Box },
  { type: 'sphere', label: '球体', icon: Circle },
  { type: 'cylinder', label: '圆柱', icon: Cylinder },
  { type: 'torus', label: '圆环', icon: Donut },
  { type: 'cone', label: '圆锥', icon: Triangle },
];

const LightCard = ({ light, index }: { light: LightItem; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const updateLight = useEditorStore((s) => s.updateLight);
  const removeLight = useEditorStore((s) => s.removeLight);
  const setSelectedLightId = useEditorStore((s) => s.setSelectedLightId);
  const selectedLightId = useEditorStore((s) => s.selectedLightId);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 8,
        overflow: 'hidden',
        border: selectedLightId === light.id ? '1px solid #6c63ff' : '1px solid rgba(255,255,255,0.06)',
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px',
          cursor: 'pointer',
          gap: 8,
        }}
        onClick={() => {
          setExpanded(!expanded);
          setSelectedLightId(light.id);
        }}
      >
        {expanded ? (
          <ChevronDown size={14} style={{ opacity: 0.6 }} />
        ) : (
          <ChevronRight size={14} style={{ opacity: 0.6 }} />
        )}
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: light.color,
            boxShadow: `0 0 8px ${light.color}`,
          }}
        />
        <span style={{ fontSize: 13, flex: 1 }}>光源 {index + 1}</span>
        <span style={{ fontSize: 12, opacity: 0.6 }}>{light.intensity.toFixed(1)}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeLight(light.id);
          }}
          style={{
            padding: 4,
            borderRadius: 4,
            opacity: 0.5,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
        >
          <Trash2 size={14} />
        </button>
      </div>
      {expanded && (
        <div
          style={{
            padding: '8px 12px 14px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, opacity: 0.7, width: 50 }}>位置X</span>
            <input
              type="number"
              step={0.1}
              value={Number(light.position[0].toFixed(2))}
              onChange={(e) =>
                updateLight(light.id, {
                  position: [parseFloat(e.target.value) || 0, light.position[1], light.position[2]],
                })
              }
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, opacity: 0.7, width: 50 }}>位置Y</span>
            <input
              type="number"
              step={0.1}
              value={Number(light.position[1].toFixed(2))}
              onChange={(e) =>
                updateLight(light.id, {
                  position: [light.position[0], parseFloat(e.target.value) || 0, light.position[2]],
                })
              }
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, opacity: 0.7, width: 50 }}>位置Z</span>
            <input
              type="number"
              step={0.1}
              value={Number(light.position[2].toFixed(2))}
              onChange={(e) =>
                updateLight(light.id, {
                  position: [light.position[0], light.position[1], parseFloat(e.target.value) || 0],
                })
              }
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, opacity: 0.7, width: 50 }}>颜色</span>
            <input
              type="color"
              value={light.color}
              onChange={(e) => updateLight(light.id, { color: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, opacity: 0.7, width: 50 }}>强度</span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.01}
              value={light.intensity}
              onChange={(e) => updateLight(light.id, { intensity: parseFloat(e.target.value) })}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: 12, width: 32, textAlign: 'right' }}>
              {light.intensity.toFixed(2)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, opacity: 0.7, width: 50 }}>衰减</span>
            <input
              type="range"
              min={0.1}
              max={2}
              step={0.01}
              value={light.decay}
              onChange={(e) => updateLight(light.id, { decay: parseFloat(e.target.value) })}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: 12, width: 32, textAlign: 'right' }}>
              {light.decay.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const GeometryPanel = () => {
  const addGeometry = useEditorStore((s) => s.addGeometry);
  const lightList = useEditorStore((s) => s.lightList);
  const addLight = useEditorStore((s) => s.addLight);

  return (
    <div
      style={{
        width: 220,
        height: '100%',
        background: 'rgba(30,30,50,0.9)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRight: '1px solid #2a2a4a',
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
        gap: 16,
        overflowY: 'auto',
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, marginBottom: 12, letterSpacing: 0.5 }}>
          几何体
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
          }}
        >
          {GEOMETRIES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => addGeometry(type)}
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                transition: 'all 0.2s ease',
                border: '1px solid transparent',
                justifySelf: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3a3a5a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.borderColor = '#6c63ff';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <Icon size={22} strokeWidth={1.5} />
              <span style={{ fontSize: 10, opacity: 0.7 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            opacity: 0.9,
            marginBottom: 12,
            letterSpacing: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Sun size={14} />
          光源
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {lightList.map((light, idx) => (
            <LightCard key={light.id} light={light} index={idx} />
          ))}
          {lightList.length === 0 && (
            <div
              style={{
                fontSize: 12,
                opacity: 0.4,
                textAlign: 'center',
                padding: '20px 0',
              }}
            >
              暂无点光源
            </div>
          )}
        </div>
        {lightList.length < 3 && (
          <button
            onClick={addLight}
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginTop: 12,
              transition: 'all 0.2s ease',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3a3a5a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.borderColor = '#6c63ff';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <Plus size={20} />
          </button>
        )}
        {lightList.length >= 3 && (
          <div
            style={{
              fontSize: 11,
              opacity: 0.4,
              textAlign: 'center',
              marginTop: 12,
              padding: '8px 0',
            }}
          >
            最多支持 3 个点光源
          </div>
        )}
      </div>
    </div>
  );
};

export default GeometryPanel;
