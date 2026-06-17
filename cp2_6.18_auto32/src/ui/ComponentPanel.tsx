import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { useStore, ComponentType, COMPONENT_COLORS, COMPONENT_DEFAULTS } from '../store';

interface ComponentCardProps {
  type: ComponentType;
  color: string;
  label: string;
  icon: string;
}

const ComponentCard: React.FC<ComponentCardProps> = ({ type, color, label, icon }) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: 'NEW_COMPONENT',
    item: { type: 'NEW_COMPONENT', componentType: type, startX: 0, startY: 0, offsetX: 0, offsetY: 0 },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={dragRef as unknown as React.Ref<HTMLDivElement>}
      style={{
        padding: '10px 12px',
        borderLeft: `3px solid ${color}`,
        background: isDragging ? 'rgba(255,255,255,0.08)' : '#3A3A50',
        borderRadius: 8,
        cursor: 'grab',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        opacity: isDragging ? 0.7 : 1,
        boxShadow: isDragging ? '0 8px 25px rgba(0,0,0,0.3)' : 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#E0E0E0' }}>{label}</span>
    </div>
  );
};

const SnapshotCard: React.FC<{
  name: string;
  thumbnail: string;
  timestamp: number;
  onRestore: () => void;
  onDelete: () => void;
}> = ({ name, thumbnail, timestamp, onRestore, onDelete }) => {
  return (
    <div style={{
      background: '#3A3A50',
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 8,
      border: '1px solid #4A4A5E',
      cursor: 'pointer',
      transition: 'border-color 0.2s ease',
    }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = '#64B5F6')}
    onMouseLeave={e => (e.currentTarget.style.borderColor = '#4A4A5E')}
    >
      <div style={{
        width: '100%',
        height: 80,
        background: '#1A1A28',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {thumbnail ? (
          <img src={thumbnail} alt={name} style={{ width: 150, height: 80, objectFit: 'contain' }} />
        ) : (
          <span style={{ color: '#666', fontSize: 11 }}>No preview</span>
        )}
      </div>
      <div style={{ padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500 }}>{name}</div>
          <div style={{ fontSize: 10, color: '#A0A0B0' }}>{new Date(timestamp).toLocaleTimeString()}</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={onRestore}
            style={{
              background: '#2196F3',
              border: 'none',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1976D2')}
            onMouseLeave={e => (e.currentTarget.style.background = '#2196F3')}
          >
            Restore
          </button>
          <button
            onClick={onDelete}
            style={{
              background: '#F44336',
              border: 'none',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#D32F2F')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F44336')}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export const ComponentPanel: React.FC = () => {
  const leftPanelCollapsed = useStore(s => s.leftPanelCollapsed);
  const toggleLeftPanel = useStore(s => s.toggleLeftPanel);
  const snapshots = useStore(s => s.snapshots);
  const saveSnapshot = useStore(s => s.saveSnapshot);
  const restoreSnapshot = useStore(s => s.restoreSnapshot);
  const removeSnapshot = useStore(s => s.removeSnapshot);
  const snapshotNameRef = useRef<HTMLInputElement>(null);

  const handleSaveSnapshot = () => {
    const name = snapshotNameRef.current?.value || `Snapshot ${snapshots.length + 1}`;
    let thumbnail = '';
    try {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        thumbnail = canvas.toDataURL('image/png');
      }
    } catch {}
    saveSnapshot(name, thumbnail);
    if (snapshotNameRef.current) snapshotNameRef.current.value = '';
  };

  const components: { type: ComponentType; color: string; label: string; icon: string }[] = [
    { type: 'container', color: COMPONENT_COLORS.container, label: 'Container', icon: '📦' },
    { type: 'button', color: COMPONENT_COLORS.button, label: 'Button', icon: '🔘' },
    { type: 'textblock', color: COMPONENT_COLORS.textblock, label: 'Text Block', icon: '📝' },
    { type: 'image', color: COMPONENT_COLORS.image, label: 'Image', icon: '🖼' },
  ];

  return (
    <div
      className="panel-slide-left"
      style={{
        width: leftPanelCollapsed ? 44 : 240,
        background: '#2A2A3E',
        borderRadius: 12,
        border: '1px solid #4A4A5E',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease-out',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <div
        onClick={toggleLeftPanel}
        style={{
          padding: '12px 12px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #4A4A5E',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
          {leftPanelCollapsed ? '◀' : 'Components'}
        </span>
        {!leftPanelCollapsed && <span style={{ fontSize: 11 }}>▼</span>}
      </div>

      {!leftPanelCollapsed && (
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '10px',
          transition: 'height 0.3s ease-out',
        }}>
          <div style={{ fontSize: 11, color: '#A0A0B0', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Drag to Canvas
          </div>
          {components.map(c => (
            <ComponentCard key={c.type} {...c} />
          ))}

          <div style={{ marginTop: 16, fontSize: 11, color: '#A0A0B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Snapshots
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            <input
              ref={snapshotNameRef}
              placeholder="Name..."
              style={{
                flex: 1,
                background: '#3A3A50',
                border: '1px solid #4A4A5E',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 12,
                color: '#E0E0E0',
                outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#64B5F6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#4A4A5E')}
            />
            <button
              onClick={handleSaveSnapshot}
              style={{
                background: '#2196F3',
                border: 'none',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.2s, transform 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1976D2')}
              onMouseLeave={e => (e.currentTarget.style.background = '#2196F3')}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Save
            </button>
          </div>
          <div style={{ marginTop: 8 }}>
            {snapshots.map(snap => (
              <SnapshotCard
                key={snap.id}
                name={snap.name}
                thumbnail={snap.thumbnail}
                timestamp={snap.timestamp}
                onRestore={() => restoreSnapshot(snap.id)}
                onDelete={() => removeSnapshot(snap.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
