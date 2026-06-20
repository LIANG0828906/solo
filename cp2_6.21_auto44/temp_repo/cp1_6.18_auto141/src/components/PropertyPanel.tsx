import { useState } from 'react';
import { useAnimationStore } from '@/stores/animationStore';
import {
  PROPERTY_INPUT_TYPES,
  type PropertyInputType,
} from '@/types';
import type { PropertyValue } from '@/types';

function isColorProp(name: string): boolean {
  return (
    name === 'background-color' ||
    name === 'color' ||
    name.endsWith('-color') ||
    name === 'border-color'
  );
}

function defaultForProp(name: string): PropertyValue {
  if (isColorProp(name)) return '#FFFFFF';
  if (name === 'opacity') return 1;
  if (name.startsWith('transform.scale')) return 1;
  if (name.startsWith('transform.rotate') || name.includes('skew')) return 0;
  if (name === 'box-shadow') return '0 0 0 rgba(0,0,0,0)';
  return 0;
}

function renderInput(
  name: string,
  value: PropertyValue,
  onChange: (v: PropertyValue) => void,
) {
  if (isColorProp(name)) {
    return (
      <input
        type="color"
        className="property-input"
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (name === 'box-shadow') {
    return (
      <input
        type="text"
        className="property-input"
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0 4px 12px rgba(0,0,0,0.3)"
      />
    );
  }
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  const step = name === 'opacity' ? 0.01 : 1;
  return (
    <input
      type="number"
      className="property-input"
      step={step}
      value={isNaN(num) ? 0 : num}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        onChange(isNaN(v) ? 0 : v);
      }}
    />
  );
}

export default function PropertyPanel() {
  const {
    selectedKeyframeId,
    keyframes,
    selectedElementId,
    elements,
    addProperty,
    updateProperty,
    deleteProperty,
  } = useAnimationStore();

  const el = elements.find((e) => e.id === selectedElementId) || null;

  const kf = keyframes.find((k) => k.id === selectedKeyframeId) || null;
  const [newPropName, setNewPropName] =
    useState<PropertyInputType>('transform.translateX');
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');

  const handleAddProperty = () => {
    if (!kf) return;
    const name = showCustom ? customName.trim() : newPropName;
    if (!name) return;
    if (kf.properties[name] !== undefined) return;
    addProperty(kf.id, name, defaultForProp(name));
    setCustomName('');
    setShowCustom(false);
  };

  return (
    <div className="property-panel">
      <h3 className="panel-title">属性编辑</h3>

      {!kf ? (
        <div className="panel-empty">
          {el
            ? `当前编辑: ${el.name}\n\n点击时间轴上的灰色行\n添加关键帧节点`
            : '请先选择一个元素'}
          <br />
          <br />
          <span style={{ fontSize: 11, opacity: 0.7 }}>
            选中关键帧后可在此调整属性值
          </span>
        </div>
      ) : (
        <>
          {Object.entries(kf.properties).length === 0 && (
            <div className="panel-empty" style={{ padding: '10px 0' }}>
              此关键帧暂无属性
              <br />
              点击下方按钮添加
            </div>
          )}

          {Object.entries(kf.properties).map(([name, value]) => (
            <div key={name} className="property-row">
              <div className="property-label">
                <span>{name}</span>
                <button
                  className="property-delete"
                  onClick={() => deleteProperty(kf.id, name)}
                  title="删除属性"
                >
                  ×
                </button>
              </div>
              {renderInput(name, value, (v) =>
                updateProperty(kf.id, name, v),
              )}
            </div>
          ))}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {!showCustom ? (
              <select
                className="property-input"
                style={{ width: '100%' }}
                value={newPropName}
                onChange={(e) =>
                  setNewPropName(e.target.value as PropertyInputType)
                }
              >
                {PROPERTY_INPUT_TYPES.filter(
                  (p) => kf.properties[p] === undefined,
                ).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="property-input"
                style={{ width: '100%' }}
                placeholder="自定义属性名，如 filter"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            )}

            <button
              className="speed-btn"
              style={{ alignSelf: 'flex-end', fontSize: 11 }}
              onClick={() => setShowCustom((v) => !v)}
            >
              {showCustom ? '使用预设' : '自定义属性'}
            </button>

            <button className="btn-add-property" onClick={handleAddProperty}>
              + Add Property
            </button>
          </div>
        </>
      )}
    </div>
  );
}
