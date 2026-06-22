import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  GripVertical,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Save,
  Trash2,
  Download,
  Sparkles,
} from 'lucide-react';
import { useFieldRuleStore } from './fieldRuleStore';
import {
  FIELD_TYPE_COLORS,
  FIELD_TYPE_LABELS,
  type FieldType,
  type FieldRule,
} from '../types';

interface FieldConfigPanelProps {
  isMobile?: boolean;
  isOpen?: boolean;
}

export const FieldConfigPanel: React.FC<FieldConfigPanelProps> = ({
  isMobile = false,
  isOpen = true,
}) => {
  const { rules, addRule, removeRule, updateRule, reorderRules, updateConstraints } =
    useFieldRuleStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const dragItemRef = useRef<number | null>(null);

  const sortedRules = [...rules].sort((a, b) => a.sortIndex - b.sortIndex);

  const handleAddField = (type: FieldType) => {
    addRule(type);
    setShowAddModal(false);
    setTimeout(() => {
      const newRule = rules[rules.length - 1];
      if (newRule) {
        setNewlyAddedId(newRule.id);
        setTimeout(() => setNewlyAddedId(null), 300);
      }
    }, 10);
  };

  const handleDelete = (id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      removeRule(id);
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 200);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
    dragItemRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    reorderRules(draggedIndex, index);
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  const handleFieldNameChange = (id: string, value: string) => {
    updateRule(id, { fieldName: value });
  };

  const handleConstraintChange = (
    id: string,
    key: string,
    value: string | number | undefined
  ) => {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    const newConstraints = { ...rule.constraints, [key]: value };
    updateConstraints(id, newConstraints);
  };

  const renderConstraintInputs = (rule: FieldRule) => {
    const constraints = rule.constraints as Record<string, unknown>;

    switch (rule.type) {
      case 'string':
        return (
          <div style={constraintRowStyle}>
            <label style={constraintLabelStyle}>最大长度</label>
            <input
              type="number"
              value={constraints.maxLength ?? ''}
              onChange={(e) =>
                handleConstraintChange(
                  rule.id,
                  'maxLength',
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              style={smallInputStyle}
            />
            <label style={{ ...constraintLabelStyle, marginLeft: 12 }}>正则表达式</label>
            <input
              type="text"
              value={constraints.pattern ?? ''}
              onChange={(e) =>
                handleConstraintChange(rule.id, 'pattern', e.target.value || undefined)
              }
              style={{ ...smallInputStyle, width: 120 }}
              placeholder="如: ^[a-z]+$"
            />
          </div>
        );
      case 'number':
        return (
          <div style={constraintRowStyle}>
            <label style={constraintLabelStyle}>最小值</label>
            <input
              type="number"
              value={constraints.min ?? ''}
              onChange={(e) =>
                handleConstraintChange(
                  rule.id,
                  'min',
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              style={smallInputStyle}
            />
            <label style={{ ...constraintLabelStyle, marginLeft: 12 }}>最大值</label>
            <input
              type="number"
              value={constraints.max ?? ''}
              onChange={(e) =>
                handleConstraintChange(
                  rule.id,
                  'max',
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              style={smallInputStyle}
            />
          </div>
        );
      case 'date':
        return (
          <div style={constraintRowStyle}>
            <label style={constraintLabelStyle}>起始日期</label>
            <input
              type="date"
              value={constraints.startDate ?? ''}
              onChange={(e) =>
                handleConstraintChange(rule.id, 'startDate', e.target.value || undefined)
              }
              style={dateInputStyle}
            />
            <label style={{ ...constraintLabelStyle, marginLeft: 12 }}>结束日期</label>
            <input
              type="date"
              value={constraints.endDate ?? ''}
              onChange={(e) =>
                handleConstraintChange(rule.id, 'endDate', e.target.value || undefined)
              }
              style={dateInputStyle}
            />
          </div>
        );
      case 'address':
        return (
          <div style={constraintRowStyle}>
            <label style={constraintLabelStyle}>城市过滤</label>
            <select
              value={constraints.city ?? ''}
              onChange={(e) =>
                handleConstraintChange(rule.id, 'city', e.target.value || undefined)
              }
              style={selectInputStyle}
            >
              <option value="">全部城市</option>
              <option value="北京市">北京市</option>
              <option value="上海市">上海市</option>
              <option value="广州市">广州市</option>
              <option value="深圳市">深圳市</option>
              <option value="杭州市">杭州市</option>
              <option value="成都市">成都市</option>
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  const panelContent = (
    <div style={panelContentStyle}>
      <div style={panelHeaderStyle}>
        <Sparkles size={20} style={{ color: '#3b82f6' }} />
        <span style={panelTitleStyle}>字段配置</span>
      </div>

      <div style={fieldListStyle}>
        {sortedRules.map((rule, index) => (
          <div
            key={rule.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
            style={{
              ...fieldItemContainerStyle,
              opacity: draggedIndex === index ? 0.7 : 1,
              transform: dragOverIndex === index && draggedIndex !== index
                ? draggedIndex < index
                  ? 'translateY(8px)'
                  : 'translateY(-8px)'
                : 'translateY(0)',
              transition: 'transform 0.2s ease, opacity 0.2s ease',
              animation: newlyAddedId === rule.id ? 'slideInFromTop 0.3s ease-out' : 'none',
              transformOrigin: 'top',
            }}
          >
            {deletingIds.has(rule.id) && (
              <style>{`
                @keyframes slideOutLeft {
                  from { transform: translateX(0); opacity: 1; }
                  to { transform: translateX(-100%); opacity: 0; }
                }
              `}</style>
            )}
            <div
              style={{
                ...fieldItemStyle,
                animation: deletingIds.has(rule.id)
                  ? 'slideOutLeft 0.2s ease-in forwards'
                  : 'none',
              }}
            >
              <div
                style={{
                  ...colorBarStyle,
                  backgroundColor: FIELD_TYPE_COLORS[rule.type],
                }}
              />
              <div style={dragHandleStyle}>
                <GripVertical size={16} style={{ color: '#94a3b8' }} />
              </div>
              <div style={fieldContentStyle} onClick={() => toggleExpand(rule.id)}>
                <div style={fieldHeaderRowStyle}>
                  <input
                    type="text"
                    value={rule.fieldName}
                    onChange={(e) => handleFieldNameChange(rule.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={fieldNameInputStyle}
                  />
                  <span
                    style={{
                      ...fieldTypeBadgeStyle,
                      backgroundColor: FIELD_TYPE_COLORS[rule.type] + '33',
                      color: FIELD_TYPE_COLORS[rule.type],
                    }}
                  >
                    {FIELD_TYPE_LABELS[rule.type]}
                  </span>
                  {expandedIds.has(rule.id) ? (
                    <ChevronUp size={16} style={{ color: '#94a3b8' }} />
                  ) : (
                    <ChevronDown size={16} style={{ color: '#94a3b8' }} />
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(rule.id)}
                style={deleteButtonStyle}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#dc2626')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = '#ef4444')
                }
              >
                <X size={14} style={{ color: 'white' }} />
              </button>
            </div>
            <div
              style={{
                ...expandableContainerStyle,
                maxHeight: expandedIds.has(rule.id) ? '200px' : '0',
                opacity: expandedIds.has(rule.id) ? 1 : 0,
                transition: 'max-height 0.3s ease-out, opacity 0.3s ease-out',
                overflow: 'hidden',
              }}
            >
              <div style={constraintPanelStyle}>
                {renderConstraintInputs(rule)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowAddModal(true)}
        style={addButtonStyle}
        onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.9)')}
        onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
      >
        <Plus size={20} />
        <span>添加字段</span>
      </button>

      <PresetSection />
    </div>
  );

  if (isMobile) {
    return (
      <div
        style={{
          ...mobileDrawerStyle,
          height: isOpen ? '60vh' : '48px',
          transition: 'height 0.3s ease-out',
        }}
      >
        <div style={mobileHandleStyle}>
          <div style={mobileHandleBarStyle} />
        </div>
        {isOpen && panelContent}
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      {panelContent}

      {showAddModal && (
        <div style={modalOverlayStyle} onClick={() => setShowAddModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <span style={modalTitleStyle}>选择字段类型</span>
              <button
                onClick={() => setShowAddModal(false)}
                style={modalCloseStyle}
              >
                <X size={20} style={{ color: '#94a3b8' }} />
              </button>
            </div>
            <div style={fieldTypeListStyle}>
              {(['string', 'number', 'email', 'date', 'address'] as FieldType[]).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => handleAddField(type)}
                    style={fieldTypeOptionStyle}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    <div
                      style={{
                        ...fieldTypeColorDotStyle,
                        backgroundColor: FIELD_TYPE_COLORS[type],
                      }}
                    />
                    <span style={fieldTypeOptionTextStyle}>
                      {FIELD_TYPE_LABELS[type]}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

const PresetSection: React.FC = () => {
  const [presets, setPresets] = useState<Array<{ id: string; name: string }>>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const { rules, setRules } = useFieldRuleStore();

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const response = await fetch('/api/presets');
      const data = await response.json();
      setPresets(data.presets || []);
    } catch (err) {
      console.error('Failed to load presets', err);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    try {
      const response = await fetch('/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: presetName, rules }),
      });
      if (response.ok) {
        setShowSaveModal(false);
        setPresetName('');
        loadPresets();
      }
    } catch (err) {
      console.error('Failed to save preset', err);
    }
  };

  const handleLoadPreset = async (id: string) => {
    try {
      const response = await fetch('/api/presets');
      const data = await response.json();
      const preset = (data.presets || []).find((p: { id: string }) => p.id === id);
      if (preset) {
        setRules(preset.rules);
      }
    } catch (err) {
      console.error('Failed to load preset', err);
    }
  };

  const handleDeletePreset = async (id: string) => {
    try {
      await fetch(`/api/presets/${id}`, { method: 'DELETE' });
      loadPresets();
    } catch (err) {
      console.error('Failed to delete preset', err);
    }
  };

  return (
    <div style={presetSectionStyle}>
      <div style={presetHeaderStyle}>
        <span style={presetTitleStyle}>预设管理</span>
        <button
          onClick={() => setShowSaveModal(true)}
          style={savePresetButtonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#22c55e')}
        >
          <Save size={16} />
          <span>保存预设</span>
        </button>
      </div>
      <div style={presetListStyle}>
        {presets.length === 0 ? (
          <div style={emptyPresetStyle}>暂无预设</div>
        ) : (
          presets.map((preset) => (
            <div key={preset.id} style={presetItemStyle}>
              <span style={presetNameStyle}>{preset.name}</span>
              <div style={presetActionsStyle}>
                <button
                  onClick={() => handleLoadPreset(preset.id)}
                  style={{ ...presetActionBtnStyle, backgroundColor: '#3b82f6' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = '#2563eb')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = '#3b82f6')
                  }
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => handleDeletePreset(preset.id)}
                  style={{ ...presetActionBtnStyle, backgroundColor: '#ef4444' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = '#dc2626')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = '#ef4444')
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showSaveModal && (
        <div style={modalOverlayStyle} onClick={() => setShowSaveModal(false)}>
          <div style={{ ...modalStyle, width: 280 }} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <span style={modalTitleStyle}>保存预设</span>
              <button
                onClick={() => setShowSaveModal(false)}
                style={modalCloseStyle}
              >
                <X size={20} style={{ color: '#94a3b8' }} />
              </button>
            </div>
            <div style={savePresetFormStyle}>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="输入预设名称"
                style={presetNameInputStyle}
              />
              <button
                onClick={handleSavePreset}
                style={savePresetSubmitStyle}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#22c55e')}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const panelStyle: React.CSSProperties = {
  width: 320,
  height: '100vh',
  backgroundColor: '#1e293b',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  overflow: 'hidden',
  position: 'relative',
};

const panelContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
};

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 16,
};

const panelTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: '#f8fafc',
};

const fieldListStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  paddingRight: 4,
};

const fieldItemContainerStyle: React.CSSProperties = {
  position: 'relative',
};

const fieldItemStyle: React.CSSProperties = {
  height: 60,
  backgroundColor: '#f8fafc',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  padding: '0 8px 0 0',
  boxSizing: 'border-box',
  cursor: 'pointer',
  overflow: 'hidden',
  position: 'relative',
};

const colorBarStyle: React.CSSProperties = {
  width: 4,
  height: 44,
  borderRadius: 4,
  marginLeft: 8,
  marginRight: 0,
  flexShrink: 0,
};

const dragHandleStyle: React.CSSProperties = {
  width: 24,
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'grab',
  flexShrink: 0,
};

const fieldContentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '0 8px',
  minWidth: 0,
};

const fieldHeaderRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const fieldNameInputStyle: React.CSSProperties = {
  flex: 1,
  fontSize: 14,
  fontWeight: 500,
  color: '#1e293b',
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  padding: 0,
  minWidth: 0,
};

const fieldTypeBadgeStyle: React.CSSProperties = {
  fontSize: 11,
  padding: '2px 8px',
  borderRadius: 4,
  flexShrink: 0,
};

const deleteButtonStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: '50%',
  backgroundColor: '#ef4444',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'background-color 0.2s ease',
};

const expandableContainerStyle: React.CSSProperties = {
  marginBottom: 8,
};

const constraintPanelStyle: React.CSSProperties = {
  backgroundColor: '#334155',
  borderRadius: 8,
  padding: 12,
  marginTop: 4,
};

const constraintRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 6,
};

const constraintLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#cbd5e1',
  flexShrink: 0,
};

const smallInputStyle: React.CSSProperties = {
  width: 80,
  height: 28,
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 4,
  padding: '0 8px',
  fontSize: 12,
  outline: 'none',
};

const dateInputStyle: React.CSSProperties = {
  width: 140,
  height: 28,
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 4,
  padding: '0 8px',
  fontSize: 12,
  outline: 'none',
};

const selectInputStyle: React.CSSProperties = {
  width: 160,
  height: 28,
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 4,
  padding: '0 8px',
  fontSize: 12,
  outline: 'none',
};

const addButtonStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  backgroundColor: '#3b82f6',
  color: 'white',
  borderRadius: 8,
  border: 'none',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginTop: 12,
  transition: 'filter 0.2s ease',
  flexShrink: 0,
};

const presetSectionStyle: React.CSSProperties = {
  marginTop: 16,
  paddingTop: 16,
  borderTop: '1px solid #334155',
  flexShrink: 0,
};

const presetHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
};

const presetTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: '#f8fafc',
};

const savePresetButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '6px 12px',
  backgroundColor: '#22c55e',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontSize: 12,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const presetListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  maxHeight: 180,
  overflowY: 'auto',
};

const emptyPresetStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
  textAlign: 'center',
  padding: '16px 0',
};

const presetItemStyle: React.CSSProperties = {
  height: 44,
  backgroundColor: '#334155',
  borderRadius: 8,
  padding: '0 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const presetNameStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#f8fafc',
  fontWeight: 500,
};

const presetActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
};

const presetActionBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  transition: 'background-color 0.2s ease',
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: '#1e293b',
  borderRadius: 12,
  padding: 20,
  width: 280,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
};

const modalTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: '#f8fafc',
};

const modalCloseStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 4,
};

const fieldTypeListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const fieldTypeOptionStyle: React.CSSProperties = {
  height: 48,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '0 12px',
  transition: 'background-color 0.2s ease',
};

const fieldTypeColorDotStyle: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: '50%',
  flexShrink: 0,
};

const fieldTypeOptionTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#f8fafc',
  textAlign: 'left',
};

const savePresetFormStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const presetNameInputStyle: React.CSSProperties = {
  width: '90%',
  height: 36,
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '0 12px',
  fontSize: 14,
  outline: 'none',
  alignSelf: 'center',
};

const savePresetSubmitStyle: React.CSSProperties = {
  height: 36,
  backgroundColor: '#22c55e',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const mobileDrawerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: '#1e293b',
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  zIndex: 100,
  overflow: 'hidden',
  boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
};

const mobileHandleStyle: React.CSSProperties = {
  height: 48,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'grab',
};

const mobileHandleBarStyle: React.CSSProperties = {
  width: 40,
  height: 4,
  borderRadius: 2,
  backgroundColor: '#94a3b8',
};
