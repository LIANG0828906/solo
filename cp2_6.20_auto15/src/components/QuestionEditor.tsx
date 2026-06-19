import React, { useState, useRef, useCallback, useEffect } from 'react';

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

const DraggableQuestionItem: React.FC<{
  question: Question;
  index: number;
  onUpdate: (updates: Partial<Question>) => void;
  onRemove: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
}> = ({ question, index, onUpdate, onRemove, onDragStart, onDragOver, onDragEnd }) => {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={`question-item ${dragOver ? 'drag-over' : ''}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(index);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
        onDragOver(index);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={() => setDragOver(false)}
      onDragEnd={onDragEnd}
    >
      <div className="question-item-header">
        <span className="drag-handle">⠿</span>
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
  const dragIndex = useRef<number | null>(null);
  const overIndex = useRef<number | null>(null);

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

  const handleDragStart = useCallback((index: number) => {
    dragIndex.current = index;
  }, []);

  const handleDragOver = useCallback((index: number) => {
    overIndex.current = index;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragIndex.current !== null && overIndex.current !== null && dragIndex.current !== overIndex.current) {
      onMoveQuestion(dragIndex.current, overIndex.current);
    }
    dragIndex.current = null;
    overIndex.current = null;
  }, [onMoveQuestion]);

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
            {questions.map((q, idx) => (
              <DraggableQuestionItem
                key={q.id}
                question={q}
                index={idx}
                onUpdate={(updates) => onUpdateQuestion(q.id, updates)}
                onRemove={() => onRemoveQuestion(q.id)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              />
            ))}
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
