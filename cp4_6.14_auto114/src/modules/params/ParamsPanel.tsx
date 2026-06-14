import React, { useState, useCallback, useRef } from 'react';
import { useParamsStore } from '@/store/paramsStore';
import type { ParamItem } from '@/store/types';
import { Plus, Trash2, GripVertical } from 'lucide-react';

const TYPE_OPTIONS: ParamItem['type'][] = ['string', 'number', 'boolean', 'enum'];

const ParamCard: React.FC<{
  param: ParamItem;
  index: number;
  isDragging: boolean;
  isDragOver: boolean;
  onRemove: () => void;
  onUpdate: (updates: Partial<ParamItem>) => void;
  onValueChange: (value: string) => void;
  onDragStart: (index: number, e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragEnter: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (index: number, e: React.DragEvent) => void;
}> = ({
  param,
  index,
  isDragging,
  isDragOver,
  onRemove,
  onUpdate,
  onValueChange,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDragOver,
  onDrop,
}) => {
  const [editing, setEditing] = useState(false);

  const handleTypeChange = (newType: ParamItem['type']) => {
    const updates: Partial<ParamItem> = { type: newType };
    if (newType === 'boolean') {
      updates.defaultValue = 'false';
      updates.currentValue = 'false';
    } else if (newType === 'enum') {
      updates.enumOptions = param.enumOptions || ['option1', 'option2'];
      updates.defaultValue = updates.enumOptions[0];
      updates.currentValue = updates.enumOptions[0];
    }
    onUpdate(updates);
  };

  const inputStyle: React.CSSProperties = {
    height: '28px',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    padding: '0 6px',
    fontSize: '12px',
    outline: 'none',
    background: '#ffffff',
  };

  const cardClassName =
    'param-card ' +
    (isDragging ? 'param-card-dragging ' : '') +
    (isDragOver ? 'param-card-drag-over' : '');

  return (
    <div
      draggable={!editing}
      onDragStart={(e) => onDragStart(index, e)}
      onDragEnd={onDragEnd}
      onDragEnter={() => onDragEnter(index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(index, e)}
      className={cardClassName}
    >
      <div
        style={{
          cursor: 'grab',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <GripVertical size={14} />
      </div>

      {editing ? (
        <>
          <input
            value={param.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditing(false);
            }}
            autoFocus
            style={{ ...inputStyle, width: '60px', cursor: 'text' }}
          />
          <select
            value={param.type}
            onChange={(e) => handleTypeChange(e.target.value as ParamItem['type'])}
            style={{ ...inputStyle, padding: '0 4px', cursor: 'pointer' }}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </>
      ) : (
        <>
          <span
            onDoubleClick={() => setEditing(true)}
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              width: '60px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              cursor: 'text',
              lineHeight: '28px',
            }}
            title="双击编辑名称"
          >
            {param.name}
          </span>
          <span
            style={{
              fontSize: '10px',
              color: '#94a3b8',
              background: '#e2e8f0',
              padding: '2px 6px',
              borderRadius: '3px',
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            {param.type}
          </span>
        </>
      )}

      {param.type === 'boolean' ? (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: '#475569',
            flexShrink: 0,
            height: '28px',
          }}
        >
          <input
            type="checkbox"
            checked={param.currentValue === 'true'}
            onChange={(e) => onValueChange(e.target.checked ? 'true' : 'false')}
            style={{ cursor: 'pointer', width: '14px', height: '14px' }}
          />
        </label>
      ) : param.type === 'enum' ? (
        <select
          value={param.currentValue}
          onChange={(e) => onValueChange(e.target.value)}
          style={{
            ...inputStyle,
            flex: 1,
            minWidth: 0,
            padding: '0 4px',
            cursor: 'pointer',
          }}
        >
          {(param.enumOptions ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={param.type === 'number' ? 'number' : 'text'}
          value={param.currentValue}
          onChange={(e) => onValueChange(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 0, cursor: 'text' }}
        />
      )}

      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#94a3b8',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          transition: 'color 0.15s ease',
          borderRadius: '4px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ef4444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#94a3b8';
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

const ParamsPanel: React.FC = () => {
  const params = useParamsStore((s) => s.params);
  const addParam = useParamsStore((s) => s.addParam);
  const removeParam = useParamsStore((s) => s.removeParam);
  const updateParam = useParamsStore((s) => s.updateParam);
  const updateParamValue = useParamsStore((s) => s.updateParamValue);
  const reorderParams = useParamsStore((s) => s.reorderParams);

  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleAddParam = useCallback(() => {
    const count = params.length + 1;
    addParam({
      name: `param${count}`,
      type: 'string',
      defaultValue: '',
      currentValue: '',
    });
  }, [params.length, addParam]);

  const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    setDragOverIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (dropIndex: number, e: React.DragEvent) => {
      e.preventDefault();
      const startIndex = dragIndexRef.current;
      if (startIndex === null || startIndex === dropIndex) return;
      reorderParams(startIndex, dropIndex);
      dragIndexRef.current = null;
      setDragOverIndex(null);
    },
    [reorderParams],
  );

  return (
    <div className="params-panel">
      <div
        style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#1e293b',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          参数配置
        </h2>
        <p
          style={{
            fontSize: '12px',
            color: '#94a3b8',
            margin: '4px 0 0',
          }}
        >
          拖拽排序 · 双击编辑名称
        </p>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {params.map((param, index) => (
          <ParamCard
            key={param.id}
            param={param}
            index={index}
            isDragging={dragIndexRef.current === index}
            isDragOver={dragOverIndex === index && dragIndexRef.current !== index}
            onRemove={() => removeParam(param.id)}
            onUpdate={(updates) => updateParam(param.id, updates)}
            onValueChange={(value) => updateParamValue(param.id, value)}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}

        <button
          onClick={handleAddParam}
          style={{
            width: '100%',
            height: '40px',
            borderRadius: '8px',
            border: '1px dashed #cbd5e1',
            background: 'transparent',
            color: '#94a3b8',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.color = '#3b82f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          <Plus size={14} />
          添加参数
        </button>
      </div>
    </div>
  );
};

export default ParamsPanel;
