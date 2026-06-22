import React, { useState } from 'react';
import { Keyframe, CSSProperty, SUPPORTED_PROPERTIES } from '../types';

interface KeyframeItemProps {
  keyframe: Keyframe;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Keyframe>) => void;
}

export const KeyframeItem: React.FC<KeyframeItemProps> = ({
  keyframe,
  isSelected,
  onSelect,
  onDelete,
  onUpdate,
}) => {
  const [isExpanded, setIsExpanded] = useState(isSelected);

  React.useEffect(() => {
    if (isSelected) {
      setIsExpanded(true);
    }
  }, [isSelected]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      onUpdate({ time: Math.round(value * 10) / 10 });
    }
  };

  const handlePropertyNameChange = (index: number, newName: string) => {
    const newProperties = [...keyframe.properties];
    newProperties[index] = { ...newProperties[index], name: newName };
    onUpdate({ properties: newProperties });
  };

  const handlePropertyValueChange = (index: number, newValue: string) => {
    const newProperties = [...keyframe.properties];
    newProperties[index] = { ...newProperties[index], value: newValue };
    onUpdate({ properties: newProperties });
  };

  const handleAddProperty = () => {
    const newProperty: CSSProperty = {
      name: 'transform',
      value: 'translate(0px, 0px) rotate(0deg) scale(1)',
    };
    onUpdate({ properties: [...keyframe.properties, newProperty] });
  };

  const handleRemoveProperty = (index: number) => {
    const newProperties = keyframe.properties.filter((_, i) => i !== index);
    onUpdate({ properties: newProperties });
  };

  const getPlaceholderForProperty = (name: string): string => {
    switch (name) {
      case 'transform':
        return 'translate(50px, 0px) rotate(45deg) scale(1.5)';
      case 'opacity':
        return '0.5';
      case 'background-color':
        return '#00ff00';
      default:
        return 'value';
    }
  };

  return (
    <div className={`keyframe-item ${isSelected ? 'selected' : ''}`}>
      <div
        className="keyframe-header"
        onClick={() => {
          onSelect();
        }}
      >
        <div
          className="keyframe-color-dot"
          style={{ backgroundColor: keyframe.color }}
        />
        <div className="keyframe-time">{keyframe.time}%</div>
        <div className="keyframe-actions">
          <button
            className="btn btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            title={isExpanded ? '收起' : '展开'}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
          <button
            className="btn btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="删除"
          >
            ✕
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="keyframe-body">
          <div className="form-group">
            <label className="form-label">时间进度 (%)</label>
            <input
              type="number"
              className="form-input"
              min="0"
              max="100"
              step="0.1"
              value={keyframe.time}
              onChange={handleTimeChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="form-group">
            <label className="form-label">CSS 属性</label>
            {keyframe.properties.map((prop, index) => (
              <div key={index} className="property-row">
                <select
                  className="form-select"
                  value={prop.name}
                  onChange={(e) => handlePropertyNameChange(index, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {SUPPORTED_PROPERTIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  className="form-input"
                  placeholder={getPlaceholderForProperty(prop.name)}
                  value={prop.value}
                  onChange={(e) => handlePropertyValueChange(index, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  className="btn btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveProperty(index);
                  }}
                  title="删除属性"
                  style={{ padding: '8px', minWidth: '36px' }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              className="add-property-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleAddProperty();
              }}
            >
              + 添加属性
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
