import React, { useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { AnimationStep, AnimationProperty, ANIMATION_PROPERTIES, PROPERTY_DEFAULTS, AnimationPreset } from './presets';

interface Props {
  steps: AnimationStep[];
  onAdd: (step: AnimationStep) => void;
  onUpdate: (id: string, updates: Partial<AnimationStep>) => void;
  onRemove: (id: string) => void;
  onReorder: (steps: AnimationStep[]) => void;
  presets: AnimationPreset[];
  activePreset: string | null;
  onLoadPreset: (preset: AnimationPreset) => void;
}

const MAX_STEPS = 8;

const StyleEditor: React.FC<Props> = ({
  steps,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
  presets,
  activePreset,
  onLoadPreset,
}) => {
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const items = Array.from(steps);
      const [reordered] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reordered);
      onReorder(items);
    },
    [steps, onReorder]
  );

  const handleAddStep = useCallback(() => {
    if (steps.length >= MAX_STEPS) return;
    const existingPercentages = steps.map((s) => s.percentage);
    let newPercentage = 50;
    for (let p = 10; p <= 90; p += 10) {
      if (!existingPercentages.includes(p)) {
        newPercentage = p;
        break;
      }
    }
    const defaultProp: AnimationProperty = 'transform';
    onAdd({
      id: crypto.randomUUID(),
      percentage: newPercentage,
      property: defaultProp,
      value: PROPERTY_DEFAULTS[defaultProp],
    });
  }, [steps, onAdd]);

  return (
    <div style={styles.panel}>
      <h2 style={styles.sectionTitle}>预设动画</h2>
      <div style={styles.presetGrid}>
        {presets.map((preset) => (
          <div
            key={preset.name}
            onClick={() => onLoadPreset(preset)}
            style={{
              ...styles.presetCard,
              ...(activePreset === preset.name ? styles.presetCardActive : {}),
            }}
          >
            <div style={styles.presetName}>{preset.name}</div>
            <div style={styles.presetDesc}>{preset.description}</div>
          </div>
        ))}
      </div>

      <div style={styles.stepsHeader}>
        <h2 style={styles.sectionTitle}>关键帧步骤</h2>
        <span style={styles.stepCount}>
          {steps.length}/{MAX_STEPS}
        </span>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="steps">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                ...styles.stepsList,
                ...(snapshot.isDraggingOver ? styles.stepsListDrag : {}),
              }}
            >
              {steps.map((step, index) => (
                <Draggable key={step.id} draggableId={step.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...styles.stepCard,
                        ...(snapshot.isDragging ? styles.stepCardDragging : {}),
                        ...provided.draggableProps.style,
                      }}
                    >
                      <div style={styles.stepHeader}>
                        <div style={styles.dragHandle} />
                        <span style={styles.stepLabel}>步骤 {index + 1}</span>
                        <div style={styles.stepActions}>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={step.percentage}
                            onChange={(e) =>
                              onUpdate(step.id, {
                                percentage: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                              })
                            }
                            style={styles.percentInput}
                          />
                          <span style={styles.percentSign}>%</span>
                          <button
                            onClick={() => onRemove(step.id)}
                            style={styles.removeBtn}
                            disabled={steps.length <= 1}
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      <div style={styles.fieldRow}>
                        <select
                          value={step.property}
                          onChange={(e) => {
                            const newProp = e.target.value as AnimationProperty;
                            onUpdate(step.id, {
                              property: newProp,
                              value: PROPERTY_DEFAULTS[newProp],
                            });
                          }}
                          style={styles.select}
                        >
                          {ANIMATION_PROPERTIES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={styles.fieldRow}>
                        <input
                          type="text"
                          value={step.value}
                          onChange={(e) => onUpdate(step.id, { value: e.target.value })}
                          placeholder="属性值，如 rotate(360deg)"
                          style={styles.valueInput}
                        />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button
        onClick={handleAddStep}
        disabled={steps.length >= MAX_STEPS}
        style={{
          ...styles.addBtn,
          ...(steps.length >= MAX_STEPS ? styles.addBtnDisabled : {}),
        }}
      >
        + 添加步骤
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: '100%',
    height: '100%',
    background: '#1E293B',
    borderRadius: 12,
    padding: 20,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    margin: 0,
    color: '#E2E8F0',
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  presetCard: {
    width: '100%',
    height: 100,
    background: '#334155',
    borderRadius: 8,
    padding: 10,
    cursor: 'pointer',
    transition: 'transform 0.2s ease-out, background 0.2s ease-out',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 4,
  },
  presetCardActive: {
    background: '#6366F1',
  },
  presetName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#E2E8F0',
  },
  presetDesc: {
    fontSize: 11,
    color: '#94A3B8',
  },
  stepsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepCount: {
    fontSize: 12,
    color: '#94A3B8',
  },
  stepsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minHeight: 40,
  },
  stepsListDrag: {
    background: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 8,
  },
  stepCard: {
    background: '#334155',
    borderRadius: 8,
    padding: 12,
    transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
    border: '1px solid transparent',
  },
  stepCardDragging: {
    transform: 'scale(0.95)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    borderColor: '#6366F1',
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  dragHandle: {
    width: 12,
    height: 16,
    background: 'repeating-linear-gradient(0deg, #64748B 0px, #64748B 1px, transparent 1px, transparent 4px)',
    borderRadius: 2,
    cursor: 'grab',
    flexShrink: 0,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#CBD5E1',
    flex: 1,
  },
  stepActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  percentInput: {
    width: 48,
    height: 28,
    padding: '4px 6px',
    background: '#1E293B',
    color: '#E2E8F0',
    border: '1px solid #475569',
    borderRadius: 4,
    fontSize: 12,
    textAlign: 'right',
  },
  percentSign: {
    fontSize: 12,
    color: '#94A3B8',
  },
  removeBtn: {
    width: 28,
    height: 28,
    background: '#475569',
    color: '#E2E8F0',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s ease-out',
  },
  fieldRow: {
    marginTop: 8,
  },
  select: {
    width: '100%',
    height: 48,
    padding: '0 12px',
    background: '#1E293B',
    color: '#E2E8F0',
    border: '1px solid #475569',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color 0.2s ease-out',
  },
  valueInput: {
    width: '100%',
    height: 40,
    padding: '0 12px',
    background: '#1E293B',
    color: '#E2E8F0',
    border: '1px solid #475569',
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'monospace',
    outline: 'none',
    transition: 'border-color 0.2s ease-out',
  },
  addBtn: {
    width: '100%',
    height: 44,
    background: '#6366F1',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s ease-out',
    flexShrink: 0,
  },
  addBtnDisabled: {
    background: '#475569',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
};

const hoverStyle = document.createElement('style');
hoverStyle.textContent = `
  [data-preset]:hover { transform: translateY(-2px); background: #475569 !important; }
  [data-preset-active]:hover { background: #818CF8 !important; }
  [data-addbtn]:hover:not(:disabled) { background: #818CF8 !important; }
  [data-removebtn]:hover:not(:disabled) { background: #EF4444 !important; }
  [data-select]:focus { border-color: #6366F1 !important; }
  [data-valueinput]:focus { border-color: #6366F1 !important; }
  [data-percentinput]:focus { border-color: #6366F1 !important; outline: none; }
`;
document.head.appendChild(hoverStyle);

export default StyleEditor;
