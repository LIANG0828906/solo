import { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  GripVertical,
  Trash2,
  Plus,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Edit3,
} from 'lucide-react';
import {
  Question,
  QuestionType,
  QuestionTypeLabel,
  generateId,
  QuestionOption,
} from '@/utils/questionTypes';
import { useSurveyStore } from '@/store';
import RippleButton from './RippleButton';
import { cn } from '@/lib/utils';

interface SortableQuestionItemProps {
  question: Question;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateQuestion: (updates: Partial<Question>) => void;
  onDeleteQuestion: () => void;
}

function SortableQuestionItem({
  question,
  index,
  isExpanded,
  onToggleExpand,
  onUpdateQuestion,
  onDeleteQuestion,
}: SortableQuestionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleAddOption = () => {
    const newOption: QuestionOption = { id: generateId(), label: '' };
    onUpdateQuestion({ options: [...(question.options || []), newOption] });
  };

  const handleUpdateOption = (optionId: string, label: string) => {
    onUpdateQuestion({
      options: (question.options || []).map((o) =>
        o.id === optionId ? { ...o, label } : o,
      ),
    });
  };

  const handleDeleteOption = (optionId: string) => {
    onUpdateQuestion({
      options: (question.options || []).filter((o) => o.id !== optionId),
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'card p-4 mb-3',
        isDragging && 'sortable-dragging',
        'sortable-item',
      )}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-gray-100 rounded transition-colors"
          type="button"
        >
          <GripVertical size={20} className="text-gray-400" />
        </button>

        <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
          {index + 1}
        </span>

        <span
          className={cn(
            'badge',
            question.type === QuestionType.TEXT ? 'badge-gray' : 'badge-primary',
          )}
        >
          {QuestionTypeLabel[question.type]}
        </span>

        <div className="flex-1 truncate text-sm font-medium">
          {question.title || <span className="text-gray-400">未填写题干</span>}
        </div>

        <button
          type="button"
          onClick={onToggleExpand}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <ChevronUp size={18} className="text-gray-500" />
          ) : (
            <ChevronDown size={18} className="text-gray-500" />
          )}
        </button>

        <button
          type="button"
          onClick={onToggleExpand}
          className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors"
        >
          <Edit3 size={16} className="text-primary" />
        </button>

        <button
          type="button"
          onClick={onDeleteQuestion}
          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={16} className="text-red-500" />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 fade-in">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              题目类型
            </label>
            <select
              className="select max-w-xs"
              value={question.type}
              onChange={(e) => {
                const newType = e.target.value as QuestionType;
                const updates: Partial<Question> = { type: newType };
                if (
                  (newType === QuestionType.SINGLE_CHOICE ||
                    newType === QuestionType.MULTIPLE_CHOICE) &&
                  (!question.options || question.options.length === 0)
                ) {
                  updates.options = [
                    { id: generateId(), label: '' },
                    { id: generateId(), label: '' },
                  ];
                } else if (newType === QuestionType.TEXT) {
                  updates.options = undefined;
                }
                onUpdateQuestion(updates);
              }}
            >
              <option value={QuestionType.SINGLE_CHOICE}>单选题</option>
              <option value={QuestionType.MULTIPLE_CHOICE}>多选题</option>
              <option value={QuestionType.TEXT}>文本题</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              题干
            </label>
            <input
              type="text"
              className="input"
              placeholder="请输入题目内容..."
              value={question.title}
              onChange={(e) => onUpdateQuestion({ title: e.target.value })}
            />
          </div>

          {(question.type === QuestionType.SINGLE_CHOICE ||
            question.type === QuestionType.MULTIPLE_CHOICE) && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                选项管理
              </label>
              <div className="space-y-2">
                {(question.options || []).map((option, optIdx) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-6 flex-shrink-0">
                      {String.fromCharCode(65 + optIdx)}.
                    </span>
                    <input
                      type="text"
                      className="input flex-1"
                      placeholder={`选项 ${optIdx + 1}`}
                      value={option.label}
                      onChange={(e) =>
                        handleUpdateOption(option.id, e.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteOption(option.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-2 text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
              >
                <Plus size={16} /> 添加选项
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">必答</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) =>
                  onUpdateQuestion({ required: e.target.checked })
                }
              />
              <span className="slider" />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewQuestion({
  question,
  index,
}: {
  question: Question;
  index: number;
}) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="text-base font-medium mb-3">
        <span className="mr-1">{index + 1}.</span>
        {question.title}
        {question.required && <span className="required-mark">*</span>}
      </div>

      {question.type === QuestionType.SINGLE_CHOICE && (
        <div className="radio-group">
          {(question.options || []).map((option, idx) => (
            <label key={option.id}>
              <input type="radio" name={`preview-${question.id}`} disabled />
              <span className="text-sm">
                {String.fromCharCode(65 + idx)}. {option.label}
              </span>
            </label>
          ))}
        </div>
      )}

      {question.type === QuestionType.MULTIPLE_CHOICE && (
        <div className="checkbox-group">
          {(question.options || []).map((option, idx) => (
            <label key={option.id}>
              <input type="checkbox" disabled />
              <span className="text-sm">
                {String.fromCharCode(65 + idx)}. {option.label}
              </span>
            </label>
          ))}
        </div>
      )}

      {question.type === QuestionType.TEXT && (
        <textarea
          className="textarea"
          placeholder="请输入您的回答..."
          disabled
        />
      )}
    </div>
  );
}

export default function QuestionEditor() {
  const { getSurvey, routeParams, navigate, addSurvey, updateSurvey } =
    useSurveyStore();

  const editId = routeParams.id;
  const existingSurvey = editId ? getSurvey(editId) : undefined;

  const [title, setTitle] = useState(existingSurvey?.title || '');
  const [description, setDescription] = useState(
    existingSurvey?.description || '',
  );
  const [questions, setQuestions] = useState<Question[]>(
    existingSurvey?.questions || [],
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [previewKey, setPreviewKey] = useState(0);
  const [mobileShowEditor, setMobileShowEditor] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setPreviewKey((k) => k + 1);
  }, [title, description, questions]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((q) => q.id === active.id);
        const newIndex = items.findIndex((q) => q.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
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

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: generateId(),
      type: QuestionType.SINGLE_CHOICE,
      title: '',
      required: false,
      options: [
        { id: generateId(), label: '' },
        { id: generateId(), label: '' },
      ],
    };
    setQuestions((prev) => [...prev, newQuestion]);
    setExpandedIds((prev) => new Set([...prev, newQuestion.id]));
  };

  const handleUpdateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    );
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const validate = (): string | null => {
    if (!title.trim()) {
      return '请输入问卷标题';
    }
    if (questions.length === 0) {
      return '请至少添加一个问题';
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.title.trim()) {
        return `第 ${i + 1} 题：题干不能为空`;
      }
      if (
        q.type === QuestionType.SINGLE_CHOICE ||
        q.type === QuestionType.MULTIPLE_CHOICE
      ) {
        if (!q.options || q.options.length < 2) {
          return `第 ${i + 1} 题：至少需要 2 个选项`;
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].label.trim()) {
            return `第 ${i + 1} 题：第 ${j + 1} 个选项不能为空`;
          }
        }
      }
    }
    return null;
  };

  const handleSave = () => {
    const error = validate();
    if (error) {
      alert(error);
      return;
    }

    const surveyData = {
      title: title.trim(),
      description: description.trim(),
      questions,
    };

    if (existingSurvey) {
      updateSurvey(existingSurvey.id, surveyData);
    } else {
      addSurvey(surveyData);
    }

    navigate('/');
  };

  const previewContent = useMemo(
    () => (
      <div key={previewKey} className="fade-in-slow">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">{title || '未命名问卷'}</h1>
          {description && (
            <p className="text-gray-500 text-sm">{description}</p>
          )}
        </div>
        {questions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            暂无问题，请在左侧添加
          </div>
        ) : (
          questions.map((q, idx) => (
            <PreviewQuestion key={q.id} question={q} index={idx} />
          ))
        )}
      </div>
    ),
    [previewKey, title, description, questions],
  );

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center gap-3 shadow-sm z-10">
        <RippleButton
          variant="ghost"
          onClick={() => navigate('/')}
          className="!px-2 !py-2"
        >
          <ArrowLeft size={20} />
        </RippleButton>

        <div className="flex-1 min-w-0 flex flex-col md:flex-row gap-2">
          <input
            type="text"
            className="input md:max-w-sm font-medium"
            placeholder="问卷标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            className="input flex-1"
            placeholder="问卷描述（可选）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={() => setMobileShowEditor((v) => !v)}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {mobileShowEditor ? (
            <X size={20} className="text-gray-600" />
          ) : (
            <Menu size={20} className="text-gray-600" />
          )}
        </button>

        <RippleButton variant="primary" onClick={handleSave}>
          保存
        </RippleButton>
      </header>

      <div className="flex-1 overflow-hidden flex editor-split">
        <div
          className={cn(
            'editor-left w-1/2 overflow-y-auto p-4 md:p-6 pb-28',
            'md:block',
            mobileShowEditor ? 'block' : 'hidden',
          )}
        >
          {questions.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-sm mb-2">还没有问题</div>
              <div className="text-xs">点击下方按钮添加第一个问题</div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                {questions.map((q, idx) => (
                  <SortableQuestionItem
                    key={q.id}
                    question={q}
                    index={idx}
                    isExpanded={expandedIds.has(q.id)}
                    onToggleExpand={() => toggleExpand(q.id)}
                    onUpdateQuestion={(updates) =>
                      handleUpdateQuestion(q.id, updates)
                    }
                    onDeleteQuestion={() => handleDeleteQuestion(q.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          <div className="fixed left-0 right-0 md:right-auto md:w-[calc(50%-0px)] bottom-0 p-4 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent pt-8 z-10">
            <RippleButton
              variant="primary"
              onClick={handleAddQuestion}
              className="w-full !py-3 !text-base shadow-lg"
            >
              <Plus size={20} /> 添加问题
            </RippleButton>
          </div>
        </div>

        <div
          className={cn(
            'editor-right w-1/2 overflow-y-auto p-4 md:p-6 bg-gray-100',
            'md:block',
            mobileShowEditor ? 'hidden' : 'block',
          )}
        >
          <div className="card p-6 min-h-full" style={{ padding: '24px' }}>
            {previewContent}
          </div>
        </div>
      </div>
    </div>
  );
}
