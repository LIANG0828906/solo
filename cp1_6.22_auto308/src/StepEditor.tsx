import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Edit3, Trash2, GripVertical, Plus, MessageSquare } from 'lucide-react';
import { useRecipeStore } from '@/store';
import CommentRatingPanel from '@/CommentRatingPanel';

interface StepEditorProps {
  recipeId: string;
}

const StepEditor: React.FC<StepEditorProps> = ({ recipeId }) => {
  const recipe = useRecipeStore((state) => state.recipes.find((r) => r.id === recipeId));
  const addStep = useRecipeStore((state) => state.addStep);
  const updateStep = useRecipeStore((state) => state.updateStep);
  const deleteStep = useRecipeStore((state) => state.deleteStep);
  const reorderSteps = useRecipeStore((state) => state.reorderSteps);

  const [addingStep, setAddingStep] = useState(false);
  const [newStepText, setNewStepText] = useState('');
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  if (!recipe) return null;

  const steps = [...recipe.steps].sort((a, b) => a.order - b.order);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    reorderSteps(recipeId, result.source.index, result.destination.index);
  };

  const handleAddStep = () => {
    const trimmed = newStepText.trim();
    if (!trimmed) return;
    addStep(recipeId, trimmed);
    setNewStepText('');
    setAddingStep(false);
  };

  const handleStartEdit = (stepId: string, description: string) => {
    setEditingStepId(stepId);
    setEditText(description);
  };

  const handleSaveEdit = (stepId: string) => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    updateStep(recipeId, stepId, trimmed);
    setEditingStepId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingStepId(null);
    setEditText('');
  };

  const toggleComments = (stepId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  return (
    <div className="step-editor">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="steps">
          {(provided) => (
            <div
              className="step-list"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  {index > 0 && <div className="step-connector" />}
                  <Draggable draggableId={step.id} index={index}>
                    {(dragProvided, snapshot) => (
                      <div
                        className={`step-card${snapshot.isDragging ? ' step-card--dragging' : ''}`}
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        style={{
                          ...dragProvided.draggableProps.style,
                          ...(snapshot.isDragging && {
                            transform: `${dragProvided.draggableProps.style?.transform} scale(1.05)`,
                            opacity: 0.85,
                          }),
                        }}
                      >
                        <div
                          className="step-card__drag-handle"
                          {...dragProvided.dragHandleProps}
                        >
                          <GripVertical size={18} />
                        </div>

                        <div className="step-card__number">{index + 1}</div>

                        <div className="step-card__body">
                          {editingStepId === step.id ? (
                            <div className="edit-step-form">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                rows={3}
                              />
                              <div className="edit-step-form__actions">
                                <button className="btn btn--small btn--secondary" onClick={handleCancelEdit}>取消</button>
                                <button className="btn btn--small btn--primary" onClick={() => handleSaveEdit(step.id)}>保存</button>
                              </div>
                            </div>
                          ) : (
                            <p className="step-card__description">{step.description}</p>
                          )}

                          <div className="step-card__actions">
                            <button className="btn btn--icon" onClick={() => handleStartEdit(step.id, step.description)} title="编辑">
                              <Edit3 size={16} />
                            </button>
                            <button className="btn btn--icon" onClick={() => deleteStep(recipeId, step.id)} title="删除">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <button
                          className="step-card__comments-toggle"
                          onClick={() => toggleComments(step.id)}
                        >
                          <MessageSquare size={14} />
                          {expandedComments.has(step.id) ? '收起评论' : `评论 (${step.comments.length})`}
                        </button>

                        <div className={`step-card__comments${expandedComments.has(step.id) ? ' step-card__comments--expanded' : ''}`}>
                          <CommentRatingPanel
                            recipeId={recipeId}
                            stepId={step.id}
                            comments={step.comments}
                          />
                        </div>
                      </div>
                    )}
                  </Draggable>
                </React.Fragment>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {addingStep ? (
        <div className="add-step-form">
          <textarea
            value={newStepText}
            onChange={(e) => setNewStepText(e.target.value)}
            placeholder="描述这一步骤..."
            rows={3}
          />
          <div className="add-step-form__actions">
            <button className="btn btn--secondary" onClick={() => { setAddingStep(false); setNewStepText(''); }}>取消</button>
            <button className="btn btn--primary" onClick={handleAddStep} disabled={!newStepText.trim()}>添加步骤</button>
          </div>
        </div>
      ) : (
        <button className="add-step-btn" onClick={() => setAddingStep(true)}>
          <Plus size={18} />
          添加步骤
        </button>
      )}
    </div>
  );
};

export default StepEditor;
