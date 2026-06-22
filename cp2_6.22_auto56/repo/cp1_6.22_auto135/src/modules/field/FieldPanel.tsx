import React, { useState, createContext, useContext, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import { Field, FieldType, FieldContextType, Rule } from '../../types';
import FieldDragHandle from '../../icons/FieldDragHandle';

const FieldContext = createContext<FieldContextType | null>(null);

export const useFieldContext = () => {
  const context = useContext(FieldContext);
  if (!context) {
    throw new Error('useFieldContext must be used within FieldProvider');
  }
  return context;
};

const createDefaultRules = (fieldType: FieldType): Rule[] => {
  const rules: Rule[] = [
    {
      id: uuidv4(),
      type: 'required',
      enabled: false,
      options: {}
    }
  ];

  if (fieldType === 'string' || fieldType === 'email' || fieldType === 'phone') {
    rules.push(
      { id: uuidv4(), type: 'minLength', enabled: false, options: { value: 0 } },
      { id: uuidv4(), type: 'maxLength', enabled: false, options: { value: 100 } }
    );
  }

  if (fieldType === 'string') {
    rules.push(
      { id: uuidv4(), type: 'pattern', enabled: false, options: { value: '', message: '' } }
    );
  }

  if (fieldType === 'number') {
    rules.push(
      { id: uuidv4(), type: 'min', enabled: false, options: { value: 0 } },
      { id: uuidv4(), type: 'max', enabled: false, options: { value: 100 } }
    );
  }

  rules.push(
    { id: uuidv4(), type: 'linked', enabled: false, options: { linkedFieldId: '', condition: '', required: true } }
  );

  return rules;
};

const AddFieldModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, type: FieldType) => void;
}> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<FieldType>('string');

  const handleSubmit = () => {
    if (name.trim()) {
      onAdd(name.trim(), type);
      setName('');
      setType('string');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">添加字段</h3>
        <div className="form-group">
          <label className="form-label">字段名称</label>
          <input
            className="form-input"
            type="text"
            placeholder="请输入字段名称，如：用户名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label">数据类型</label>
          <select
            className="form-select"
            value={type}
            onChange={(e) => setType(e.target.value as FieldType)}
          >
            <option value="string">字符串</option>
            <option value="number">数字</option>
            <option value="email">邮箱</option>
            <option value="phone">手机号</option>
          </select>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            确定添加
          </button>
        </div>
      </div>
    </div>
  );
};

interface FieldPanelProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const FieldPanel: React.FC<FieldPanelProps> = ({ isMobileOpen, onMobileClose }) => {
  const { fields, selectedFieldId, selectField, removeField, reorderFields } = useFieldContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addField } = useFieldContext();

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    reorderFields(result.source.index, result.destination.index);
  }, [reorderFields]);

  const getTypeLabel = (type: FieldType): string => {
    const labels: Record<FieldType, string> = {
      string: '字符串',
      number: '数字',
      email: '邮箱',
      phone: '手机号'
    };
    return labels[type];
  };

  return (
    <>
      <div className={`field-panel ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="field-panel-header">
          <h2>字段列表</h2>
          <button
            className="add-field-btn"
            onClick={() => setIsModalOpen(true)}
          >
            + 添加字段
          </button>
        </div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="fields">
            {(provided) => (
              <div
                className="field-list"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {fields.map((field: Field, index: number) => (
                  <Draggable key={field.id} draggableId={field.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`field-card ${selectedFieldId === field.id ? 'selected' : ''} ${snapshot.isDragging ? 'dragging' : ''}`}
                        onClick={() => {
                          selectField(field.id);
                          onMobileClose?.();
                        }}
                        style={provided.draggableProps.style}
                      >
                        <span className="drag-handle" {...provided.dragHandleProps}>
                          <FieldDragHandle size={16} />
                        </span>
                        <div className="field-info">
                          <div className="field-name">{field.name}</div>
                          <div className="field-type">{getTypeLabel(field.type)}</div>
                        </div>
                        <button
                          className="delete-field-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeField(field.id);
                          }}
                          title="删除字段"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        {fields.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
            暂无字段，点击上方按钮添加
          </div>
        )}
      </div>
      <AddFieldModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addField}
      />
    </>
  );
};

interface FieldProviderProps {
  children: React.ReactNode;
}

export const FieldProvider: React.FC<FieldProviderProps> = ({ children }) => {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const addField = useCallback((name: string, type: FieldType) => {
    const newField: Field = {
      id: uuidv4(),
      name,
      type,
      rules: createDefaultRules(type)
    };
    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
  }, []);

  const removeField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
    setSelectedFieldId(prev => prev === id ? null : prev);
  }, []);

  const selectField = useCallback((id: string | null) => {
    setSelectedFieldId(id);
  }, []);

  const reorderFields = useCallback((startIndex: number, endIndex: number) => {
    setFields(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const updateFieldRules = useCallback((fieldId: string, rules: Rule[]) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, rules } : f));
  }, []);

  const value: FieldContextType = {
    fields,
    selectedFieldId,
    addField,
    removeField,
    selectField,
    reorderFields,
    updateFieldRules
  };

  return (
    <FieldContext.Provider value={value}>
      {children}
    </FieldContext.Provider>
  );
};

export { FieldContext };
export default FieldPanel;
