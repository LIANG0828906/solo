import React, { useState } from 'react';
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
  const cancelConnecting = useStore((s) => s.cancelConnecting);
  const links = useStore((s) => s.links);
  const pushSnapshot = useStore((s) => s.pushSnapshot);
  const pendingTriggerType = useStore((s) => s.pendingTriggerType);
  const setPendingTriggerType = useStore((s) => s.setPendingTriggerType);

  const prop = props.find((p) => p.id === selectedPropId);

  if (!prop) {
    return (
      <div
        style={{
          width: '250px',
          background: '#1e1e2e',
          borderLeft: '1px solid #333',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          color: '#556',
          fontSize: '12px',
          gap: '8px',
        }}
      >
        <div style={{ marginTop: '30px', fontSize: '40px', opacity: 0.4 }}>⚙️</div>
        <div style={{ color: '#667', fontSize: '13px' }}>未选中机关</div>
        <div style={{ color: '#445', fontSize: '11px', marginTop: '4px', textAlign: 'center' }}>
          点击 3D 场景中的机关
          <br />
          以查看和编辑属性
        </div>
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
    fontSize: '10px',
    color: '#667788',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '4px',
    marginTop: '14px',
    fontWeight: 600,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 10px',
    borderRadius: '5px',
    border: '1px solid #3a3a4e',
    background: '#151526',
    color: '#dde',
    fontSize: '12px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const sectionHeader: React.CSSProperties = {
    marginTop: '18px',
    marginBottom: '6px',
    fontSize: '10px',
    color: '#556',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    fontWeight: 700,
    paddingBottom: '4px',
    borderBottom: '1px solid #2a2a3e',
  };

  const safeUpdate = (id: string, updates: Partial<any>) => {
    pushSnapshot();
    updateProp(id, updates);
  };

  const handlePositionChange = (axis: number, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const pos: [number, number, number] = [...prop.position];
    pos[axis] = Math.round(num * 2) / 2;
    safeUpdate(prop.id, { position: pos });
  };

  const handleInputBlur = <K extends keyof typeof prop>(
    field: K,
    rawValue: string | number,
    parser?: (v: any) => any,
    formatter?: (v: any) => any
  ) => {
    const original = (prop as any)[field];
    const parsed = parser ? parser(rawValue) : rawValue;
    const finalValue = formatter ? formatter(parsed) : parsed;
    if (JSON.stringify(original) !== JSON.stringify(finalValue)) {
      safeUpdate(prop.id, { [field]: finalValue } as any);
    }
  };

  const handleNumberInput = (raw: string, min: number, fallback: number) => {
    const n = parseFloat(raw);
    return isNaN(n) ? fallback : Math.max(min, n);
  };

  return (
    <div
      style={{
        width: '250px',
        background: '#1e1e2e',
        borderLeft: '1px solid #333',
        padding: '14px',
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px',
          margin: '-14px -14px 0 -14px',
          paddingBottom: '10px',
          paddingLeft: '14px',
          background: prop.activated
            ? `linear-gradient(90deg, ${color}22, transparent)`
            : 'transparent',
          borderBottom: '1px solid #2a2a3e',
        }}
      >
        <div
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '3px',
            background: color,
            boxShadow: prop.activated ? `0 0 10px ${color}, 0 0 20px ${color}55` : 'none',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#dde', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {MECHANISM_LABELS[prop.type]}
          </div>
          <div style={{ fontSize: '10px', color: '#667' }}>
            ID: {prop.id.slice(0, 8)} · {prop.activated ? '✓ 激活' : '○ 未激活'}
          </div>
        </div>
      </div>

      <div style={sectionHeader}>基础信息</div>

      <div style={labelStyle}>名称</div>
      <input
        style={inputStyle}
        value={prop.name}
        onFocus={(e) => (e.target as any)._original = prop.name}
        onBlur={(e) => {
          if ((e.target as any)._original !== e.target.value) {
            safeUpdate(prop.id, { name: e.target.value });
          }
        }}
        onChange={(e) => updateProp(prop.id, { name: e.target.value })}
      />

      <div style={labelStyle}>坐标位置 (网格对齐)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
        {[
          { key: 'X', color: '#ff6677' },
          { key: 'Y', color: '#66ff77' },
          { key: 'Z', color: '#6677ff' },
        ].map((axis, i) => (
          <div key={axis.key} style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '6px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '10px',
                color: axis.color,
                fontWeight: 700,
                pointerEvents: 'none',
              }}
            >
              {axis.key}
            </div>
            <input
              style={{ ...inputStyle, paddingLeft: '22px' }}
              type="number"
              step={1}
              value={prop.position[i]}
              onFocus={(e) => (e.target as any)._original = prop.position[i]}
              onBlur={(e) => handlePositionChange(i, e.target.value)}
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                if (!isNaN(num)) {
                  const p: [number, number, number] = [...prop.position];
                  p[i] = Math.round(num * 2) / 2;
                  updateProp(prop.id, { position: p });
                }
              }}
            />
          </div>
        ))}
      </div>

      {prop.type === MechanismType.PressurePlate && (
        <>
          <div style={sectionHeader}>压力板参数</div>
          <div style={labelStyle}>触发重量阈值 (kg)</div>
          <input
            style={inputStyle}
            type="number"
            min={0.1}
            max={100}
            step={0.1}
            value={prop.pressureThreshold}
            onFocus={(e) => (e.target as any)._original = prop.pressureThreshold}
            onBlur={(e) =>
              handleInputBlur('pressureThreshold', e.target.value, (v: string) => handleNumberInput(v, 0.1, 1))
            }
            onChange={(e) => {
              const v = handleNumberInput(e.target.value, 0.1, 1);
              updateProp(prop.id, { pressureThreshold: v });
            }}
          />
        </>
      )}

      {prop.type === MechanismType.LaserEmitter && (
        <>
          <div style={sectionHeader}>激光参数</div>
          <div style={labelStyle}>激光颜色</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              style={{
                width: '44px',
                height: '32px',
                borderRadius: '5px',
                border: '1px solid #3a3a4e',
                background: '#151526',
                padding: '2px',
                cursor: 'pointer',
              }}
              type="color"
              value={prop.laserColor}
              onChange={(e) => updateProp(prop.id, { laserColor: e.target.value })}
              onBlur={(e) => handleInputBlur('laserColor', e.target.value)}
            />
            <input
              style={inputStyle}
              value={prop.laserColor}
              onFocus={(e) => (e.target as any)._original = prop.laserColor}
              onBlur={(e) => handleInputBlur('laserColor', e.target.value)}
              onChange={(e) => updateProp(prop.id, { laserColor: e.target.value })}
            />
          </div>
          <div style={labelStyle}>光束半径 (m)</div>
          <input
            style={inputStyle}
            type="number"
            min={0.05}
            max={5}
            step={0.05}
            value={prop.laserRadius}
            onFocus={(e) => (e.target as any)._original = prop.laserRadius}
            onBlur={(e) =>
              handleInputBlur('laserRadius', e.target.value, (v: string) => handleNumberInput(v, 0.05, 0.5))
            }
            onChange={(e) => {
              const v = handleNumberInput(e.target.value, 0.05, 0.5);
              updateProp(prop.id, { laserRadius: v });
            }}
          />
        </>
      )}

      {prop.type === MechanismType.MovingPlatform && (
        <>
          <div style={sectionHeader}>移动平台参数</div>
          <div style={labelStyle}>移动轴方向</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
            {(['x', 'y', 'z'] as const).map((a) => (
              <button
                key={a}
                onClick={() => {
                  if (prop.moveAxis !== a) safeUpdate(prop.id, { moveAxis: a });
                }}
                style={{
                  padding: '6px',
                  borderRadius: '5px',
                  border: prop.moveAxis === a ? '1px solid #5588cc' : '1px solid #3a3a4e',
                  background: prop.moveAxis === a ? '#253550' : '#151526',
                  color: prop.moveAxis === a ? '#aaccff' : '#889',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: prop.moveAxis === a ? 600 : 400,
                }}
              >
                {a.toUpperCase()} 轴
              </button>
            ))}
          </div>
          <div style={labelStyle}>移动范围 (m)</div>
          <input
            style={inputStyle}
            type="number"
            min={0.5}
            max={20}
            step={0.5}
            value={prop.moveRange}
            onFocus={(e) => (e.target as any)._original = prop.moveRange}
            onBlur={(e) =>
              handleInputBlur('moveRange', e.target.value, (v: string) => handleNumberInput(v, 0.5, 3))
            }
            onChange={(e) => {
              const v = handleNumberInput(e.target.value, 0.5, 3);
              updateProp(prop.id, { moveRange: v });
            }}
          />
          <div style={labelStyle}>移动速度 (m/s)</div>
          <input
            style={inputStyle}
            type="number"
            min={0.05}
            max={10}
            step={0.1}
            value={prop.moveSpeed}
            onFocus={(e) => (e.target as any)._original = prop.moveSpeed}
            onBlur={(e) =>
              handleInputBlur('moveSpeed', e.target.value, (v: string) => handleNumberInput(v, 0.05, 1))
            }
            onChange={(e) => {
              const v = handleNumberInput(e.target.value, 0.05, 1);
              updateProp(prop.id, { moveSpeed: v });
            }}
          />
          <div
            style={{
              marginTop: '10px',
              padding: '8px 10px',
              borderRadius: '5px',
              background: '#151526',
              border: '1px solid #2a2a3e',
              fontSize: '11px',
              color: '#778',
              lineHeight: 1.5,
            }}
          >
            进度: <span style={{ color: '#aaccff' }}>{Math.round((prop.currentOffset / Math.max(0.001, prop.moveRange)) * 100)}%</span>
            <div
              style={{
                height: '4px',
                marginTop: '4px',
                background: '#252540',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (prop.currentOffset / Math.max(0.001, prop.moveRange)) * 100)}%`,
                  background: MECHANISM_COLORS[MechanismType.MovingPlatform].active,
                  transition: 'width 0.2s',
                }}
              />
            </div>
          </div>
        </>
      )}

      {prop.type === MechanismType.Portal && (
        <>
          <div style={sectionHeader}>传送门参数</div>
          <div style={labelStyle}>目标传送位置</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
            {[
              { key: 'X', color: '#ff6677' },
              { key: 'Y', color: '#66ff77' },
              { key: 'Z', color: '#6677ff' },
            ].map((axis, i) => (
              <div key={axis.key} style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '10px',
                    color: axis.color,
                    fontWeight: 700,
                    pointerEvents: 'none',
                  }}
                >
                  {axis.key}
                </div>
                <input
                  style={{ ...inputStyle, paddingLeft: '22px' }}
                  type="number"
                  value={prop.portalTarget[i]}
                  onFocus={(e) => (e.target as any)._original = prop.portalTarget[i]}
                  onBlur={(e) => {
                    const original = (e.target as any)._original;
                    const val = parseFloat(e.target.value) || 0;
                    if (original !== val) {
                      const target: [number, number, number] = [...prop.portalTarget];
                      target[i] = val;
                      safeUpdate(prop.id, { portalTarget: target });
                    }
                  }}
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
          <div
            style={{
              marginTop: '10px',
              padding: '8px 10px',
              borderRadius: '5px',
              background: 'rgba(170,68,255,0.08)',
              border: '1px solid rgba(170,68,255,0.25)',
              fontSize: '11px',
              color: '#bbaaee',
            }}
          >
            💡 传送门需被激活才生效
            <br />
            进入后 0.4s 完成传送动画
          </div>
        </>
      )}

      <div style={sectionHeader}>逻辑连接 ({connectedLinks.length})</div>

      {connectingFromId === prop.id && (
        <div
          style={{
            marginTop: '8px',
            padding: '10px',
            borderRadius: '6px',
            background: 'rgba(255,204,68,0.1)',
            border: '1px dashed #ffcc44',
            marginBottom: '8px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#ffcc88', fontWeight: 600, marginBottom: '6px' }}>
            ⚡ 正在连接...
          </div>
          <div style={{ fontSize: '10px', color: '#aa8', marginBottom: '8px' }}>
            点击另一个机关建立连接，或点击空白取消
          </div>
          <div style={{ fontSize: '10px', color: '#889', marginBottom: '4px' }}>触发方式：</div>
          <div style={{ display: 'flex', gap: '5px' }}>
            {(Object.values(TriggerType) as TriggerType[]).map((tt) => (
              <button
                key={tt}
                onClick={() => setPendingTriggerType(tt)}
                style={{
                  flex: 1,
                  padding: '5px 4px',
                  borderRadius: '4px',
                  border: pendingTriggerType === tt
                    ? `1px solid ${tt === TriggerType.Continuous ? '#4488ff' : '#ff8844'}`
                    : '1px solid #3a3a4e',
                  background: pendingTriggerType === tt
                    ? tt === TriggerType.Continuous
                      ? 'rgba(68,136,255,0.2)'
                      : 'rgba(255,136,68,0.2)'
                    : '#151526',
                  color: pendingTriggerType === tt
                    ? tt === TriggerType.Continuous
                      ? '#aaccff'
                      : '#ffccaa'
                    : '#889',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 600,
                }}
              >
                {tt === TriggerType.Continuous ? '持续' : '脉冲'}
              </button>
            ))}
          </div>
          <button
            onClick={cancelConnecting}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '4px',
              borderRadius: '4px',
              border: '1px solid #553333',
              background: 'rgba(165,58,58,0.1)',
              color: '#ff8888',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            取消连接
          </button>
        </div>
      )}

      {connectedLinks.length === 0 && connectingFromId !== prop.id && (
        <div style={{ fontSize: '11px', color: '#556', padding: '10px 0' }}>暂无连接，点击下方按钮建立</div>
      )}

      {connectedLinks.map((link) => {
        const isSource = link.sourceId === prop.id;
        const otherId = isSource ? link.targetId : link.sourceId;
        const other = props.find((p) => p.id === otherId);
        const ttColor = link.triggerType === TriggerType.Continuous ? '#4488ff' : '#ff8844';
        return (
          <div
            key={link.id}
            style={{
              fontSize: '11px',
              color: '#aab',
              padding: '7px 9px',
              margin: '4px 0',
              borderRadius: '5px',
              background: '#151526',
              border: '1px solid #2a2a3e',
              borderLeft: `3px solid ${ttColor}`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '13px', flexShrink: 0 }}>
              {isSource ? '→' : '←'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#ccd', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {other?.name || otherId.slice(0, 6)}
              </div>
              <div style={{ fontSize: '9px', color: '#667' }}>
                {other ? MECHANISM_LABELS[other.type] : ''}
                <span style={{ color: ttColor, marginLeft: '6px' }}>
                  · {link.triggerType === TriggerType.Continuous ? '持续' : '脉冲'}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      <div
        style={{
          marginTop: 'auto',
          paddingTop: '16px',
          display: 'flex',
          gap: '6px',
        }}
      >
        <button
          onClick={() => startConnecting(prop.id)}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '6px',
            border: connectingFromId === prop.id
              ? '1px solid #ffcc44'
              : '1px solid #3a5a7a',
            background: connectingFromId === prop.id
              ? 'rgba(255,204,68,0.15)'
              : 'rgba(58,110,165,0.2)',
            color: connectingFromId === prop.id ? '#ffdd88' : '#aaccff',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            transition: 'background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = connectingFromId === prop.id
              ? 'rgba(255,204,68,0.25)'
              : 'rgba(58,110,165,0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = connectingFromId === prop.id
              ? 'rgba(255,204,68,0.15)'
              : 'rgba(58,110,165,0.2)';
          }}
        >
          🔗 连接
        </button>
        <button
          onClick={() => {
            if (confirm(`确定删除机关「${prop.name}」？`)) {
              pushSnapshot();
              removeProp(prop.id);
            }
          }}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '6px',
            border: '1px solid #553333',
            background: 'rgba(165,58,58,0.12)',
            color: '#ff8888',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(165,58,58,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(165,58,58,0.12)';
          }}
        >
          🗑 删除
        </button>
      </div>
    </div>
  );
}
