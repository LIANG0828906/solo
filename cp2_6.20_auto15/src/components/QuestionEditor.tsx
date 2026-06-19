import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useRef, useCallback } from 'react';

interface Question {
  id: string;
  type: string;
  title: string;
  required: boolean;
  options?: string[];
}

interface Props {
  title: string;
  description: string;
  questions: Question[];
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onAddQuestion: (type: string) => void;
  onUpdateQuestion: (id: string, updates: Partial<Question>) => void;
  onRemoveQuestion: (id: string) => void;
  onMoveQuestion: (fromIndex: number, toIndex: number) => void;
  onPublish: () => void;
  publishing: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  radio: '🔘 单选',
  checkbox: '☑️ 多选',
  rating: '⭐ 评分',
  text: '📝 文本',
};

const SortableQuestionItem: React.FC<{
  question: Question;
  index: number;
  onUpdate: (updates: Partial<Question>) => void;
  onRemove: () => void;
}> = ({ question, onUpdate, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="question-item-sortable-wrapper">
      <div className={`question-item ${isDragging ? 'question-item-dragging' : ''}`}>
        <div className="question-item-header">
          <button
            className="drag-handle-btn"
            {...attributes}
            {...listeners}
            title="拖拽排序"
          >
            ⠿
          </button>
          <span className="question-type-badge">{TYPE_LABELS[question.type]}</span>
          <label className="required-toggle">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
            />
            <span>必答</span>
          </label>
          <button className="btn-icon btn-remove" onClick={onRemove} title="删除">✕</button>
        </div>

        <input
          type="text"
          className="question-title-input"
          placeholder="请输入题目..."
          value={question.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
        />

        {(question.type === 'radio' || question.type === 'checkbox') && (
          <div className="options-editor">
            {question.options!.map((opt, oi) => (
              <div key={oi} className="option-editor-row">
                <span className="option-marker">{question.type === 'radio' ? '○' : '□'}</span>
                <input
                  type="text"
                  className="option-input"
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...question.options!];
                    newOpts[oi] = e.target.value;
                    onUpdate({ options: newOpts });
                  }}
                />
                {question.options!.length > 1 && (
                  <button
                    className="btn-icon btn-remove-option"
                    onClick={() => {
                      const newOpts = question.options!.filter((_, i) => i !== oi);
                      onUpdate({ options: newOpts });
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              className="btn-add-option"
              onClick={() => onUpdate({ options: [...question.options!, `选项${question.options!.length + 1}`] })}
            >
              + 添加选项
            </button>
          </div>
        )}

        {question.type === 'rating' && (
          <div className="rating-preview-editor">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className="rating-star-editor">★</span>
            ))}
            <span className="rating-hint">1-5分评分</span>
          </div>
        )}

        {question.type === 'text' && (
          <div className="text-preview-editor">
            <div className="text-placeholder">文本回答区域</div>
          </div>
        )}
      </div>
    </div>
  );
};

const PreviewPanel: React.FC<{
  title: string;
  description: string;
  questions: Question[];
}> = ({ title, description, questions }) => (
  <div className="preview-panel">
    <div className="preview-header">实时预览</div>
    <div className="preview-content">
      <h2 className="preview-title">{title || '未命名问卷'}</h2>
      <p className="preview-desc">{description || '问卷描述'}</p>
      <div className="preview-questions">
        {questions.map((q, idx) => (
          <div key={q.id} className="preview-question">
            <label className="preview-question-label">
              {idx + 1}. {q.title || '未命名题目'}
              {q.required && <span className="required-mark">*</span>}
            </label>
            {q.type === 'radio' && (
              <div className="preview-options">
                {q.options?.map((opt, oi) => (
                  <label key={oi} className="preview-option">
                    <input type="radio" disabled name={`preview-${q.id}`} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}
            {q.type === 'checkbox' && (
              <div className="preview-options">
                {q.options?.map((opt, oi) => (
                  <label key={oi} className="preview-option">
                    <input type="checkbox" disabled />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}
            {q.type === 'rating' && (
              <div className="preview-rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className="preview-star">☆</span>
                ))}
              </div>
            )}
            {q.type === 'text' && (
              <textarea className="preview-textarea" disabled placeholder="文本回答区域" rows={2} />
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const QuestionEditor: React.FC<Props> = ({
  title,
  description,
  questions,
  onTitleChange,
  onDescriptionChange,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion,
  onMoveQuestion,
  onPublish,
  publishing,
}) => {
  const [splitPos, setSplitPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingSplit = useRef(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onMoveQuestion(oldIndex, newIndex);
      }
    }
  };

  const onMouseDownSplit = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingSplit.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!draggingSplit.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitPos(Math.max(25, Math.min(75, pct)));
    };
    const onUp = () => {
      draggingSplit.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  const onTouchDownSplit = useCallback((e: React.TouchEvent) => {
    draggingSplit.current = true;
    const onMove = (ev: TouchEvent) => {
      if (!draggingSplit.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.touches[0].clientX - rect.left) / rect.width) * 100;
      setSplitPos(Math.max(25, Math.min(75, pct)));
    };
    const onUp = () => {
      draggingSplit.current = false;
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onUp);
  }, []);

  const activeQuestion = activeId ? questions.find((q) => q.id === activeId) : null;

  return (
    <div className="editor-container" style={{ animation: 'fadeIn 300ms ease-out' }}>
      <div className="editor-meta">
        <input
          type="text"
          className="survey-title-editor"
          placeholder="输入问卷标题..."
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
        <textarea
          className="survey-desc-editor"
          placeholder="输入问卷描述（可选）..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={2}
        />
      </div>

      <div className="add-question-bar">
        <span className="add-label">添加题目：</span>
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <button key={type} className="btn btn-add-q" onClick={() => onAddQuestion(type)}>
            {label}
          </button>
        ))}
      </div>

      <div className="split-container" ref={containerRef}>
        <div className="split-left" style={{ width: `${splitPos}%` }}>
          <div className="edit-panel">
            <div className="edit-panel-header">题目编辑</div>
            {questions.length === 0 && (
              <div className="empty-state">
                <p>点击上方按钮添加第一个题目</p>
              </div>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                {questions.map((q) => (
                  <SortableQuestionItem
                    key={q.id}
                    question={q}
                    index={questions.indexOf(q)}
                    onUpdate={(updates) => onUpdateQuestion(q.id, updates)}
                    onRemove={() => onRemoveQuestion(q.id)}
                  />
                ))}
              </SortableContext>
              <DragOverlay>
                {activeQuestion ? (
                  <div className="question-item question-item-overlay">
                    <div className="question-item-header">
                      <span className="drag-handle">⠿</span>
                      <span className="question-type-badge">
                        {TYPE_LABELS[activeQuestion.type]}
                      </span>
                    </div>
                    <div className="question-title-input overlay-placeholder">
                      {activeQuestion.title || '未命名题目'}
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>

        <div
          className="split-divider"
          onMouseDown={onMouseDownSplit}
          onTouchStart={onTouchDownSplit}
        >
          <div className="split-divider-line" />
        </div>

        <div className="split-right" style={{ width: `${100 - splitPos}%` }}>
          <PreviewPanel title={title} description={description} questions={questions} />
        </div>
      </div>

      <div className="publish-bar">
        <button
          className="btn btn-primary btn-publish"
          onClick={onPublish}
          disabled={publishing || !title.trim()}
        >
          {publishing ? <span className="spinner-sm" /> : '🚀 发布问卷'}
        </button>
      </div>
    </div>
  );
};

export default QuestionEditor;
