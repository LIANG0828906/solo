import React, { useState, useCallback } from 'react';
import { useSandboxStore } from '../store/sandboxStore';
import { propConfigs, componentTypeLabels } from '../config/propConfigs';
import { tryParseJSON, formatValueForDisplay } from '../../utils';

export const PropsEditor: React.FC = React.memo(() => {
  const { selectedComponentId, components, updateComponentProps } = useSandboxStore();
  const [flashingKeys, setFlashingKeys] = useState<Set<string>>(new Set());

  const selectedComponent = selectedComponentId
    ? components.find((c) => c.id === selectedComponentId)
    : null;

  const triggerFlash = useCallback((key: string) => {
    setFlashingKeys((prev) => new Set(prev).add(key));
    setTimeout(() => {
      setFlashingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 200);
  }, []);

  const handlePropChange = useCallback(
    (key: string, value: any) => {
      if (!selectedComponentId) return;
      updateComponentProps(selectedComponentId, { [key]: value });
      triggerFlash(key);
    },
    [selectedComponentId, updateComponentProps, triggerFlash]
  );

  const renderPropInput = useCallback(
    (key: string, type: string, value: any, options?: string[]) => {
      const isFlashing = flashingKeys.has(key);
      const flashClass = isFlashing ? 'prop-flash' : '';

      switch (type) {
        case 'text':
          return (
            <input
              type="text"
              className={`prop-input ${flashClass}`}
              value={value ?? ''}
              onChange={(e) => handlePropChange(key, e.target.value)}
            />
          );
        case 'number':
          return (
            <input
              type="number"
              className={`prop-input ${flashClass}`}
              value={value ?? 0}
              onChange={(e) => handlePropChange(key, Number(e.target.value))}
            />
          );
        case 'boolean':
          return (
            <label className="sandbox-switch" style={{ marginTop: '4px' }}>
              <input
                type="checkbox"
                checked={value ?? false}
                onChange={(e) => handlePropChange(key, e.target.checked)}
              />
              <span className="sandbox-switch-slider" />
            </label>
          );
        case 'select':
          return (
            <select
              className={`prop-select ${flashClass}`}
              value={value ?? ''}
              onChange={(e) => handlePropChange(key, e.target.value)}
            >
              {options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          );
        case 'json':
          return (
            <input
              type="text"
              className={`prop-input ${flashClass}`}
              value={formatValueForDisplay(value)}
              onChange={(e) => handlePropChange(key, tryParseJSON(e.target.value))}
              placeholder="JSON数组/对象"
            />
          );
        default:
          return (
            <input
              type="text"
              className={`prop-input ${flashClass}`}
              value={value ?? ''}
              onChange={(e) => handlePropChange(key, e.target.value)}
            />
          );
      }
    },
    [flashingKeys, handlePropChange]
  );

  if (!selectedComponent) {
    return (
      <div className="empty-state">
        请点击左侧沙盒中的组件以查看和编辑属性
      </div>
    );
  }

  const configs = propConfigs[selectedComponent.type];
  const componentLabel = componentTypeLabels[selectedComponent.type];

  return (
    <div className="custom-scrollbar" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="panel-title">
        {componentLabel} 属性
      </div>
      {configs.map((config) => (
        <div key={config.key} className="prop-row">
          <label className="prop-label">{config.label}</label>
          {renderPropInput(
            config.key,
            config.type,
            selectedComponent.props[config.key],
            config.options
          )}
        </div>
      ))}
    </div>
  );
});

PropsEditor.displayName = 'PropsEditor';
