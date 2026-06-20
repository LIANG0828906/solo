import React from 'react';
import { useStore } from '../store';
import {
  MechanismType,
  MECHANISM_LABELS,
  MECHANISM_COLORS,
  TriggerType,
} from '../types';

export function PropertyPanel() {
  const selectedPropId = useStore((s) => s.selectedPropId);
  const props = useStore((s) => s.props);
  const updateProp = useStore((s) => s.updateProp);
  const removeProp = useStore((s) => s.removeProp);
  const startConnecting = useStore((s) => s.startConnecting);
  const connectingFromId = useStore((s) => s.connectingFromId);
  const links = useStore((s) => s.links);

  const prop = props.find((p) => p.id === selectedPropId);

  if (!prop) {
    return (
      <div
        style={{
          width: '240px',
          background: '#1e1e2e',
          borderLeft: '1px solid #333',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '13px',
        }}
      >
        选中机关查看属性
      </div>
    );
  }

  const color = prop.activated
    ? MECHANISM_COLORS[prop.type].active
    : MECHANISM_COLORS[prop.type].inactive;

  const connectedLinks = links.filter(
    (l) => l.sourceId === prop.id || l.targetId === prop.id
  );

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#888',
    marginBottom: '3px',
    marginTop: '10px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '5px 8px',
    borderRadius: '4px',
    border: '1px solid #444',
    background: '#15152a',
    color: '#ddd',
    fontSize: '12px',
    outline: 'none',
  };

  const handlePositionChange = (axis: number, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const pos: [number, number, number] = [...prop.position];
    pos[axis] = Math.round(num);
    updateProp(prop.id, { position: pos });
  };

  return (
    <div
      style={{
        width: '240px',
        background: '#1e1e2e',
        borderLeft: '1px solid #333',
        padding: '12px',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '3px',
            background: color,
            boxShadow: prop.activated ? `0 0 8px ${color}` : 'none',
          }}
        />
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#ddd' }}>
          {MECHANISM_LABELS[prop.type]}
        </div>
      </div>

      <div style={labelStyle}>名称</div>
      <input
        style={inputStyle}
        value={prop.name}
        onChange={(e) => updateProp(prop.id, { name: e.target.value })}
      />

      <div style={labelStyle}>位置</div>
      <div style={{ display: 'flex', gap: '4px' }}>
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={axis} style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', color: '#666', marginBottom: '2px' }}>{axis}</div>
            <input
              style={{ ...inputStyle, width: '100%' }}
              type="number"
              value={prop.position[i]}
              onChange={(e) => handlePositionChange(i, e.target.value)}
            />
          </div>
        ))}
      </div>

      {prop.type === MechanismType.PressurePlate && (
        <>
          <div style={labelStyle}>触发重量阈值</div>
          <input
            style={inputStyle}
            type="number"
            min={0.1}
            step={0.1}
            value={prop.pressureThreshold}
            onChange={(e) =>
              updateProp(prop.id, { pressureThreshold: parseFloat(e.target.value) || 1 })
            }
          />
        </>
      )}

      {prop.type === MechanismType.LaserEmitter && (
        <>
          <div style={labelStyle}>激光颜色</div>
          <input
            style={{ ...inputStyle, height: '30px', padding: '2px' }}
            type="color"
            value={prop.laserColor}
            onChange={(e) => updateProp(prop.id, { laserColor: e.target.value })}
          />
          <div style={labelStyle}>光束半径</div>
          <input
            style={inputStyle}
            type="number"
            min={0.1}
            max={2}
            step={0.1}
            value={prop.laserRadius}
            onChange={(e) =>
              updateProp(prop.id, { laserRadius: parseFloat(e.target.value) || 0.5 })
            }
          />
        </>
      )}

      {prop.type === MechanismType.MovingPlatform && (
        <>
          <div style={labelStyle}>移动轴</div>
          <select
            style={inputStyle}
            value={prop.moveAxis}
            onChange={(e) =>
              updateProp(prop.id, { moveAxis: e.target.value as 'x' | 'y' | 'z' })
            }
          >
            <option value="x">X 轴</option>
            <option value="y">Y 轴</option>
            <option value="z">Z 轴</option>
          </select>
          <div style={labelStyle}>移动范围</div>
          <input
            style={inputStyle}
            type="number"
            min={0.5}
            max={10}
            step={0.5}
            value={prop.moveRange}
            onChange={(e) =>
              updateProp(prop.id, { moveRange: parseFloat(e.target.value) || 3 })
            }
          />
          <div style={labelStyle}>移动速度</div>
          <input
            style={inputStyle}
            type="number"
            min={0.1}
            max={5}
            step={0.1}
            value={prop.moveSpeed}
            onChange={(e) =>
              updateProp(prop.id, { moveSpeed: parseFloat(e.target.value) || 1 })
            }
          />
        </>
      )}

      {prop.type === MechanismType.Portal && (
        <>
          <div style={labelStyle}>目标位置</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['X', 'Y', 'Z'].map((axis, i) => (
              <div key={axis} style={{ flex: 1 }}>
                <div style={{ fontSize: '9px', color: '#666', marginBottom: '2px' }}>{axis}</div>
                <input
                  style={{ ...inputStyle, width: '100%' }}
                  type="number"
                  value={prop.portalTarget[i]}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    const target: [number, number, number] = [...prop.portalTarget];
                    target[i] = val;
                    updateProp(prop.id, { portalTarget: target });
                  }}
                />
              </div>
            ))}
          </div>
        </>
      )}

      <div style={labelStyle}>连接 ({connectedLinks.length})</div>
      {connectedLinks.length === 0 && (
        <div style={{ fontSize: '11px', color: '#555' }}>暂无连接</div>
      )}
      {connectedLinks.map((link) => {
        const isSource = link.sourceId === prop.id;
        const otherId = isSource ? link.targetId : link.sourceId;
        const other = props.find((p) => p.id === otherId);
        return (
          <div
            key={link.id}
            style={{
              fontSize: '11px',
              color: '#999',
              padding: '3px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: link.triggerType === TriggerType.Continuous ? '#4488ff' : '#ff8844',
              }}
            />
            <span>
              {isSource ? '→' : '←'} {other?.name || otherId.slice(0, 4)}
              <span style={{ color: '#666', marginLeft: '4px' }}>
                ({link.triggerType === TriggerType.Continuous ? '持续' : '脉冲'})
              </span>
            </span>
          </div>
        );
      })}

      <div style={{ marginTop: '16px', display: 'flex', gap: '6px' }}>
        <button
          style={{
            flex: 1,
            padding: '6px 0',
            borderRadius: '5px',
            border: '1px solid #555',
            background: connectingFromId === prop.id ? '#884400' : 'rgba(58,110,165,0.2)',
            color: '#aaccff',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'background 0.2s',
          }}
          onClick={() => startConnecting(prop.id)}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(58,110,165,0.4)')}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background =
              connectingFromId === prop.id ? '#884400' : 'rgba(58,110,165,0.2)')
          }
        >
          {connectingFromId === prop.id ? '连接中...' : '🔗 连接'}
        </button>
        <button
          style={{
            flex: 1,
            padding: '6px 0',
            borderRadius: '5px',
            border: '1px solid #553333',
            background: 'rgba(165,58,58,0.15)',
            color: '#ff8888',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'background 0.2s',
          }}
          onClick={() => removeProp(prop.id)}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(165,58,58,0.35)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(165,58,58,0.15)')}
        >
          🗑 删除
        </button>
      </div>
    </div>
  );
}
