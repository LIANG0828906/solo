import React, { useState, useMemo, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Icon } from '@iconify/react';
import type { ComponentDefinition, PropDefinition } from '../types';

interface ControlPanelProps {
  component: ComponentDefinition;
  props: Record<string, any>;
  onPropChange: (key: string, value: any) => void;
  onPresetSelect: (presetIndex: number) => void;
  onReset: () => void;
  currentPresetIndex: number;
}

const ColorPickerWrap: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
}> = ({ label, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: '#1e1e2e',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ fontSize: '13px', color: '#cdd6f4' }}>{label}</span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: '#a6adc8',
              fontFamily: 'monospace',
            }}
          >
            {value}
          </span>
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor:
                value.startsWith('rgba') || value.startsWith('#')
                  ? value
                  : '#89b4fa',
              border: '2px solid #45475a',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
            }}
          />
        </div>
      </div>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 100,
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: 'rgba(30, 30, 46, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #45475a',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <HexColorPicker
            color={value.startsWith('#') ? value : '#89b4fa'}
            onChange={onChange}
          />
        </div>
      )}
    </div>
  );
};

const SliderControl: React.FC<{
  def: PropDefinition;
  value: number;
  onChange: (val: number) => void;
}> = ({ def, value, onChange }) => {
  const min = def.min ?? 0;
  const max = def.max ?? 100;
  const step = def.step ?? 1;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <span style={{ fontSize: '13px', color: '#cdd6f4' }}>{def.label}</span>
        <span
          style={{
            fontSize: '12px',
            color: '#89b4fa',
            fontFamily: 'monospace',
            backgroundColor: '#1e1e2e',
            padding: '2px 8px',
            borderRadius: '4px',
          }}
        >
          {value}
          {def.unit ?? ''}
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '4px',
            borderRadius: '2px',
            backgroundColor: '#45475a',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            height: '4px',
            borderRadius: '2px',
            backgroundColor: '#89b4fa',
            width: `${pct}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: 'absolute',
            width: '100%',
            opacity: 0,
            cursor: 'pointer',
            height: '20px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${pct}%`,
            transform: 'translateX(-50%)',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: '2px solid #89b4fa',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};

const SelectControl: React.FC<{
  def: PropDefinition;
  value: string;
  onChange: (val: string) => void;
}> = ({ def, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = def.options ?? [];
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );
  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: '#1e1e2e',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ fontSize: '13px', color: '#cdd6f4' }}>{def.label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {selected && selected.value && (
            <Icon icon={selected.value} width={14} height={14} color="#a6adc8" />
          )}
          <span style={{ fontSize: '12px', color: '#a6adc8' }}>
            {selected?.label ?? '请选择'}
          </span>
          <Icon
            icon="mdi:chevron-down"
            width={14}
            height={14}
            color="#a6adc8"
            style={{
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
      </div>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 100,
            borderRadius: '10px',
            backgroundColor: '#1e1e2e',
            border: '1px solid #45475a',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '8px' }}>
            <input
              type="text"
              placeholder="搜索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: '6px',
                backgroundColor: '#313244',
                border: '1px solid #45475a',
                color: '#cdd6f4',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: '10px 12px',
                  fontSize: '12px',
                  color: '#6c7086',
                  textAlign: 'center',
                }}
              >
                无匹配项
              </div>
            ) : (
              filtered.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setSearch('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    color: opt.value === value ? '#89b4fa' : '#cdd6f4',
                    backgroundColor:
                      opt.value === value ? '#313244' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {opt.value && (
                    <Icon icon={opt.value} width={14} height={14} />
                  )}
                  <span>{opt.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TextControl: React.FC<{
  def: PropDefinition;
  value: string;
  onChange: (val: string) => void;
}> = ({ def, value, onChange }) => {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
        }}
      >
        <span style={{ fontSize: '13px', color: '#cdd6f4' }}>{def.label}</span>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: '13px',
          borderRadius: '8px',
          backgroundColor: '#1e1e2e',
          border: '1px solid #45475a',
          color: '#cdd6f4',
          outline: 'none',
          transition: 'border-color 0.2s ease',
        }}
      />
    </div>
  );
};

const BooleanControl: React.FC<{
  def: PropDefinition;
  value: boolean;
  onChange: (val: boolean) => void;
}> = ({ def, value, onChange }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span style={{ fontSize: '13px', color: '#cdd6f4' }}>{def.label}</span>
      <div
        onClick={() => onChange(!value)}
        style={{
          position: 'relative',
          width: '36px',
          height: '20px',
          borderRadius: '10px',
          backgroundColor: value ? '#89b4fa' : '#45475a',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: value ? '18px' : '2px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            transition: 'left 0.2s ease',
          }}
        />
      </div>
    </div>
  );
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
  component,
  props,
  onPropChange,
  onPresetSelect,
  onReset,
  currentPresetIndex,
}) => {
  const grouped = useMemo(() => {
    const groups: Record<string, PropDefinition[]> = {};
    component.props.forEach((p) => {
      const cat = p.category ?? '其他';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [component.props]);

  const renderControl = (def: PropDefinition) => {
    const value = props[def.key];
    switch (def.type) {
      case 'color':
        return (
          <ColorPickerWrap
            label={def.label}
            value={typeof value === 'string' ? value : '#89b4fa'}
            onChange={(v) => onPropChange(def.key, v)}
          />
        );
      case 'slider':
        return (
          <SliderControl
            def={def}
            value={typeof value === 'number' ? value : 0}
            onChange={(v) => onPropChange(def.key, v)}
          />
        );
      case 'select':
        return (
          <SelectControl
            def={def}
            value={typeof value === 'string' ? value : ''}
            onChange={(v) => onPropChange(def.key, v)}
          />
        );
      case 'text':
        return (
          <TextControl
            def={def}
            value={typeof value === 'string' ? value : ''}
            onChange={(v) => onPropChange(def.key, v)}
          />
        );
      case 'boolean':
        return (
          <BooleanControl
            def={def}
            value={typeof value === 'boolean' ? value : false}
            onChange={(v) => onPropChange(def.key, v)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        width: '320px',
        minWidth: '320px',
        height: '100%',
        backgroundColor: '#1e1e2e',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid #313244',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #313244',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#cdd6f4' }}>
          属性面板
        </h2>
        <button
          onClick={onReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            borderRadius: '6px',
            border: '1px solid #45475a',
            cursor: 'pointer',
            backgroundColor: '#313244',
            color: '#a6adc8',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#45475a';
            e.currentTarget.style.color = '#f38ba8';
            e.currentTarget.style.borderColor = '#f38ba8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#313244';
            e.currentTarget.style.color = '#a6adc8';
            e.currentTarget.style.borderColor = '#45475a';
          }}
        >
          <Icon icon="mdi:refresh" width={14} height={14} />
          <span>重置</span>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#a6adc8',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '10px',
            }}
          >
            预设状态
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            {component.presets.map((preset, idx) => (
              <button
                key={preset.name}
                onClick={() => onPresetSelect(idx)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor:
                    currentPresetIndex === idx ? '#89b4fa' : '#313244',
                  color:
                    currentPresetIndex === idx ? '#1e1e2e' : '#cdd6f4',
                  fontWeight: currentPresetIndex === idx ? 600 : 400,
                  transition: 'all 0.2s ease',
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {Object.entries(grouped).map(([category, propDefs]) => (
          <div
            key={category}
            style={{
              backgroundColor: '#313244',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '14px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#89b4fa',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {category}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {propDefs.map((def) => (
                <div key={def.key}>{renderControl(def)}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
