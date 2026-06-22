import React, { useState, useRef, useEffect } from 'react';
import { Input } from 'antd';

interface InlineEditProps {
  value: string | number;
  onSave: (newValue: string | number) => void;
  type?: 'text' | 'number';
  min?: number;
  step?: number;
  className?: string;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onSave,
  type = 'text',
  min,
  step,
  className,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (editValue !== value) {
      if (type === 'number') {
        const numValue = Number(editValue);
        if (!isNaN(numValue)) {
          onSave(numValue);
          return;
        }
      }
      onSave(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        min={min}
        step={step}
        size="small"
        style={{ width: 'auto', minWidth: 60 }}
      />
    );
  }

  return (
    <span onDoubleClick={handleDoubleClick} className={className} style={{ cursor: 'pointer' }}>
      {value}
    </span>
  );
};
