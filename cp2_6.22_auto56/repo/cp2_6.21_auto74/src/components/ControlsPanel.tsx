import { useState } from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';

interface BodyListItemProps {
  body: any;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function BodyListItem({ body, isSelected, onSelect, onRemove }: BodyListItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 12px',
        marginBottom: '6px',
        borderRadius: '8px',
        background: isSelected
          ? 'rgba(107, 65, 217, 0.25)'
          : hovered
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(255, 255, 255, 0.03)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        borderLeft: `3px solid ${body.color}`,
        borderRight: `3px solid ${isSelected ? body.color : 'transparent'}`,
      }}
    >
      <div
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: body.color,
          marginRight: '10px',
          boxShadow: `0 0 8px ${body.color}`,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: '#d0d0e0',
            fontSize: '12px',
            fontWeight: isSelected ? 600 : 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {body.name}
        </div>
        <div style={{ color: '#8888a0', fontSize: '10px', marginTop: '2px' }}>
          {body.mass.toFixed(1)} M☉
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        style={{
          opacity: hovered || isSelected ? 1 : 0,
          background: 'rgba(255, 68, 68, 0.2)',
          border: 'none',
          color: '#ff4444',
          width: '22px',
          height: '22px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        ×
      </button>
    </div>
  );
}

function EnergyDisplay({ bodyId }: { bodyId: string }) {
  const getBodyEnergy = useSimulationStore((state) => state.getBodyEnergy);
  const energy = getBodyEnergy(bodyId);
  const body = useSimulationStore((state) => state.bodies.find((b) => b.id === bodyId));

  if (!body || !energy) return null;

  const formatNumber = (num: number): string => {
    if (Math.abs(num) >= 1000) return num.toExponential(2);
    return num.toFixed(2);
  };

  return (
    <div
      style={{
        marginTop: '12px',
        padding: '12px',
        background: 'rgba(42, 157, 244, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(42, 157, 244, 0.3)',
      }}
    >
      <div
        style={{
          color: '#2a9df4',
          fontSize: '11px',
          fontWeight: 600,
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        物理参数
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ color: '#8888a0', fontSize: '10px', marginBottom: '4px' }}>位置</div>
        <div style={{ color: '#d0d0e0', fontSize: '11px', fontFamily: 'monospace' }}>
          X: {body.position.x.toFixed(2)} Y: {body.position.y.toFixed(2)} Z: {body.position.z.toFixed(2)}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ color: '#8888a0', fontSize: '10px', marginBottom: '4px' }}>速度</div>
        <div style={{ color: '#d0d0e0', fontSize: '11px', fontFamily: 'monospace' }}>
          Vx: {body.velocity.x.toFixed(2)} Vy: {body.velocity.y.toFixed(2)} Vz: {body.velocity.z.toFixed(2)}
        </div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span style={{ color: '#8888a0', fontSize: '10px' }}>动能</span>
          <span style={{ color: '#44ff88', fontSize: '11px', fontFamily: 'monospace' }}>
            {formatNumber(energy.kinetic)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span style={{ color: '#8888a0', fontSize: '10px' }}>势能</span>
          <span style={{ color: '#ff8844', fontSize: '11px', fontFamily: 'monospace' }}>
            {formatNumber(energy.potential)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#8888a0', fontSize: '10px' }}>总机械能</span>
          <span style={{ color: '#2a9df4', fontSize: '11px', fontFamily: 'monospace' }}>
            {formatNumber(energy.total)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ControlsPanel() {
  const { bodies, selectedBodyId, removeBody } = useSimulationStore();
  const setSelectedBody = useSimulationStore((state) => state.setSelectedBody);
  const [collapsed, setCollapsed] = useState(false);

  const handleAddBody = () => {
    const newBody = {
      id: Math.random().toString(36).substr(2, 9),
      name: `天体 ${bodies.length + 1}`,
      mass: 50,
      position: {
        x: (Math.random() - 0.5) * 40,
        y: (Math.random() - 0.5) * 40,
        z: (Math.random() - 0.5) * 40,
      },
      velocity: {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: (Math.random() - 0.5) * 2,
      },
      color: '#4488ff',
      radius: 0.3 + Math.log(50) * 0.2,
      trajectory: [],
    };

    if (newBody.mass <= 10) newBody.color = '#4488ff';
    else if (newBody.mass <= 100) newBody.color = '#ffaa44';
    else newBody.color = '#ff4444';

    useSimulationStore.getState().addBody(newBody);
  };

  return (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: collapsed ? 'flex' : 'none',
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 100,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(107, 65, 217, 0.5)',
          color: '#d0d0e0',
          padding: '8px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
        }}
      >
        <span>☰</span> 天体列表
      </button>

      <div
        style={{
          position: 'fixed',
          left: collapsed ? '-280px' : '16px',
          top: '16px',
          bottom: '88px',
          width: '240px',
          background: 'rgba(10, 14, 28, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(107, 65, 217, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          overflowY: 'auto',
          transition: 'left 0.3s ease',
          zIndex: 50,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h2
            style={{
              color: '#d0d0e0',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}
          >
            天体列表
          </h2>
          <button
            onClick={() => setCollapsed(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#8888a0',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        <button
          onClick={handleAddBody}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '12px',
            background: 'linear-gradient(135deg, rgba(42, 157, 244, 0.3), rgba(103, 65, 217, 0.3))',
            border: '1px solid rgba(42, 157, 244, 0.5)',
            borderRadius: '8px',
            color: '#d0d0e0',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              'linear-gradient(135deg, rgba(42, 157, 244, 0.5), rgba(103, 65, 217, 0.5))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              'linear-gradient(135deg, rgba(42, 157, 244, 0.3), rgba(103, 65, 217, 0.3))';
          }}
        >
          + 添加天体
        </button>

        <div style={{ maxHeight: 'calc(100% - 140px)', overflowY: 'auto' }}>
          {bodies.map((body) => (
            <BodyListItem
              key={body.id}
              body={body}
              isSelected={selectedBodyId === body.id}
              onSelect={() => setSelectedBody(body.id)}
              onRemove={() => removeBody(body.id)}
            />
          ))}
        </div>

        {selectedBodyId && <EnergyDisplay bodyId={selectedBodyId} />}

        <div
          style={{
            marginTop: '12px',
            padding: '10px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '6px',
            fontSize: '10px',
            color: '#8888a0',
          }}
        >
          <div style={{ marginBottom: '4px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#4488ff', marginRight: '6px' }} />
            小质量 (1-10 M☉)
          </div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ffaa44', marginRight: '6px' }} />
            中等质量 (10-100 M☉)
          </div>
          <div>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ff4444', marginRight: '6px' }} />
            大质量 (100-500 M☉)
          </div>
        </div>
      </div>
    </>
  );
}
