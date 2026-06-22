import { useEffect, useRef, useState, memo } from 'react';
import { useParams } from 'react-router-dom';
import {
  GripVertical,
  Trash2,
  Plus,
  Star,
  Send,
  Save,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useSurveyStore } from '@/store/useSurveyStore';
import type { Question, QuestionType } from '@/types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  single: '单选题',
  multiple: '多选题',
  rating: '评分题',
};

const OPTION_MIN = 2;
const OPTION_MAX = 8;

interface QuestionCardProps {
  question: Question;
  index: number;
  isPublished: boolean;
  isDragging: boolean;
  dragOverIndex: number | null;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  onDragOver: (index: number) => void;
  onDrop: () => void;
  onUpdate: (questionId: string, updates: Partial<Question>) => void;
  onDelete: (questionId: string) => void;
}

const QuestionCard = memo(function QuestionCard({
  question,
  index,
  isPublished,
  isDragging,
  dragOverIndex,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onUpdate,
  onDelete,
}: QuestionCardProps) {
  const showTopIndicator = dragOverIndex === index;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(question.id, { title: e.target.value });
  };

  const handleOptionChange = (optionIndex: number, value: string) => {
    if (!question.options) return;
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    onUpdate(question.id, { options: newOptions });
  };

  const handleAddOption = () => {
    if (!question.options || question.options.length >= OPTION_MAX) return;
    onUpdate(question.id, {
      options: [...question.options, `选项${question.options.length + 1}`],
    });
  };

  const handleDeleteOption = (optionIndex: number) => {
    if (!question.options || question.options.length <= OPTION_MIN) return;
    const newOptions = question.options.filter((_, i) => i !== optionIndex);
    onUpdate(question.id, { options: newOptions });
  };

  const handleMaxRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(question.id, { maxRating: Number(e.target.value) });
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    const target = e.currentTarget;
    if (target.parentNode) {
      e.dataTransfer.setDragImage(target, 20, 20);
    }
    onDragStart(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDragOver(index);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDrop();
  };

  return (
    <div
      className={cn(
        'relative bg-white rounded-lg p-4 mb-3 transition-all',
        'shadow-[0_2px_8px_rgba(0,0,0,0.1)]',
        '[transition:transform_0.2s_cubic-bezier(0.34,1.56,0.64,1),opacity_0.2s]',
        isDragging && 'opacity-40'
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {showTopIndicator && (
        <div className="absolute -top-1.5 left-4 right-4 h-0.5 bg-blue-500 rounded" />
      )}
      <div className="flex items-center justify-between mb-3">
        <div
          draggable={!isPublished}
          onDragStart={handleDragStart}
          onDragEnd={onDragEnd}
          className={cn(
            'p-1 rounded',
            isPublished ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing hover:bg-gray-100'
          )}
        >
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium bg-blue-600 text-white px-2 py-0.5 rounded">
            {QUESTION_TYPE_LABEL[question.type]}
          </span>
          {!isPublished && (
            <button
              onClick={() => onDelete(question.id)}
              className="p-1 rounded hover:bg-red-50 text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <input
        type="text"
        value={question.title}
        onChange={handleTitleChange}
        disabled={isPublished}
        placeholder="请输入题目标题"
        className="w-full text-base py-2 border-none outline-none bg-transparent disabled:text-gray-500"
      />

      {(question.type === 'single' || question.type === 'multiple') && (
        <div className="space-y-2 mt-2">
          {question.options?.map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-center gap-2">
              <div className="w-4 text-sm text-gray-400 flex-shrink-0">
                {question.type === 'single' ? '○' : '□'}
              </div>
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                disabled={isPublished}
                placeholder={`选项${optionIndex + 1}`}
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
              />
              {!isPublished && question.options && question.options.length > OPTION_MIN && (
                <button
                  onClick={() => handleDeleteOption(optionIndex)}
                  className="p-1 rounded hover:bg-red-50 text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {!isPublished && (
            <button
              onClick={handleAddOption}
              disabled={!question.options || question.options.length >= OPTION_MAX}
              className={cn(
                'inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded',
                'disabled:text-gray-300 disabled:cursor-not-allowed'
              )}
            >
              <Plus className="w-4 h-4" />
              添加选项
            </button>
          )}
        </div>
      )}

      {question.type === 'rating' && (
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: question.maxRating || 5 }).map((_, i) => (
              <Star
                key={i}
                className="w-5 h-5 text-yellow-400 fill-yellow-400"
              />
            ))}
          </div>
          {!isPublished && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>最高星数：</span>
              <select
                value={question.maxRating || 5}
                onChange={handleMaxRatingChange}
                className="px-2 py-1 border border-gray-200 rounded outline-none focus:border-blue-400 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default function SurveyEditor() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const {
    currentSurvey,
    isLoading,
    loadSurvey,
    saveCurrentSurvey,
    publishCurrentSurvey,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    clearCurrent,
  } = useSurveyStore();

  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const isNewSurvey = !surveyId;
  const initializedRef = useRef(false);

  useEffect(() => {
    if (surveyId) {
      loadSurvey(surveyId);
    }
    return () => {
      clearCurrent();
      initializedRef.current = false;
    };
  }, [surveyId, loadSurvey, clearCurrent]);

  useEffect(() => {
    if (!isNewSurvey) return;
    if (initializedRef.current) return;
    initializedRef.current = true;
    addQuestion('single');
  }, [isNewSurvey, addQuestion]);

  const isPublished = currentSurvey?.isPublished || false;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentSurvey) return;
    updateQuestion('', { title: e.target.value });
    const updated = { ...currentSurvey, title: e.target.value };
    useSurveyStore.setState({ currentSurvey: updated });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentSurvey) return;
    const updated = { ...currentSurvey, description: e.target.value };
    useSurveyStore.setState({ currentSurvey: updated });
  };

  const handleDragStart = (index: number) => {
    setDragFromIndex(index);
  };

  const handleDragEnd = () => {
    setDragFromIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDrop = () => {
    if (dragFromIndex !== null && dragOverIndex !== null && dragFromIndex !== dragOverIndex) {
      reorderQuestions(dragFromIndex, dragOverIndex);
    }
    setDragFromIndex(null);
    setDragOverIndex(null);
  };

  if (isLoading && !isNewSurvey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!currentSurvey && !isNewSurvey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">问卷不存在</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 mr-4">
              <input
                type="text"
                value={currentSurvey?.title || ''}
                onChange={handleTitleChange}
                disabled={isPublished}
                placeholder="请输入问卷标题"
                className="w-full text-2xl font-bold py-1 border-none outline-none bg-transparent disabled:text-gray-500"
              />
              <textarea
                value={currentSurvey?.description || ''}
                onChange={handleDescriptionChange}
                disabled={isPublished}
                placeholder="请输入问卷说明（选填）"
                rows={2}
                className="w-full mt-2 text-gray-600 py-1 border-none outline-none bg-transparent resize-none disabled:text-gray-500"
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isPublished ? (
                <span className="text-sm font-medium bg-green-100 text-green-700 px-3 py-1.5 rounded">
                  已发布
                </span>
              ) : (
                <>
                  <button
                    onClick={saveCurrentSurvey}
                    disabled={isLoading}
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm',
                      'border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                  <button
                    onClick={publishCurrentSurvey}
                    disabled={isLoading}
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white',
                      'bg-blue-600 hover:bg-blue-700 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    <Send className="w-4 h-4" />
                    发布
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-0">
          {currentSurvey?.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              isPublished={isPublished}
              isDragging={dragFromIndex === index}
              dragOverIndex={dragOverIndex}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onUpdate={updateQuestion}
              onDelete={deleteQuestion}
            />
          ))}
        </div>

        {!isPublished && (
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={() => addQuestion('single')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加单选题
            </button>
            <button
              onClick={() => addQuestion('multiple')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加多选题
            </button>
            <button
              onClick={() => addQuestion('rating')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加评分题
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
