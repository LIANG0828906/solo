import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GripVertical, Trash2, Copy, Plus, X } from 'lucide-react';
import type { Question, QuestionType } from '../shared/types';

interface QuestionEditorProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

const questionTypeLabels: Record<QuestionType, string> = {
  single: '单选题',
  multiple: '多选题',
  text: '文本题',
  rating: '评分题',
};

export default function QuestionEditor({ questions, onChange }: QuestionEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: uuidv4(),
      type,
      title: '',
      required: true,
      options: type === 'single' || type === 'multiple' ? ['选项1', '选项2'] : undefined,
      maxRating: type === 'rating' ? 5 : undefined,
    };
    onChange([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    onChange(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const deleteQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
  };

  const duplicateQuestion = (id: string) => {
    const index = questions.findIndex((q) => q.id === id);
    if (index === -1) return;

    const original = questions[index];
    const copy: Question = {
      ...original,
      id: uuidv4(),
      title: original.title + ' (副本)',
    };

    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, copy);
    onChange(newQuestions);
  };

  const addOption = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question || !question.options) return;

    const newOptionNum = question.options.length + 1;
    updateQuestion(questionId, {
      options: [...question.options, `选项${newOptionNum}`],
    });
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question || !question.options) return;

    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    updateQuestion(questionId, { options: newOptions });
  };

  const deleteOption = (questionId: string, optionIndex: number) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question || !question.options || question.options.length <= 2) return;

    const newOptions = question.options.filter((_, i) => i !== optionIndex);
    updateQuestion(questionId, { options: newOptions });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newQuestions = [...questions];
    const [draggedItem] = newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(dropIndex, 0, draggedItem);
    onChange(newQuestions);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {(['single', 'multiple', 'text', 'rating'] as QuestionType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => addQuestion(type)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Plus size={16} />
            添加{questionTypeLabels[type]}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <div
            key={question.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`card p-4 question-item ${
              draggedIndex === index ? 'dragging' : ''
            } ${dragOverIndex === index ? 'drag-over' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div
                className="cursor-grab text-gray-400 hover:text-gray-600 mt-2"
                style={{ touchAction: 'none' }}
              >
                <GripVertical size={20} />
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                    {questionTypeLabels[question.type]}
                  </span>
                  <span className="text-sm text-gray-500">第 {index + 1} 题</span>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => duplicateQuestion(question.id)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="复制题目"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteQuestion(question.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="删除题目"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <input
                  type="text"
                  value={question.title}
                  onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                  placeholder="请输入题目标题"
                  className="font-medium"
                />

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(e) =>
                        updateQuestion(question.id, { required: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    必填
                  </label>
                </div>

                {(question.type === 'single' || question.type === 'multiple') && question.options && (
                  <div className="space-y-2 pl-4">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 w-6">{optIndex + 1}.</span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                          placeholder={`选项${optIndex + 1}`}
                          className="flex-1"
                        />
                        {question.options!.length > 2 && (
                          <button
                            type="button"
                            onClick={() => deleteOption(question.id, optIndex)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(question.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus size={14} />
                      添加选项
                    </button>
                  </div>
                )}

                {question.type === 'rating' && (
                  <div className="flex items-center gap-3 pl-4">
                    <span className="text-sm text-gray-600">最高评分：</span>
                    <select
                      value={question.maxRating || 5}
                      onChange={(e) =>
                        updateQuestion(question.id, { maxRating: parseInt(e.target.value, 10) })
                      }
                      className="w-24"
                    >
                      <option value={3}>3星</option>
                      <option value={5}>5星</option>
                      <option value={10}>10星</option>
                    </select>
                    <div className="star-rating">
                      {Array.from({ length: question.maxRating || 5 }).map((_, i) => (
                        <span key={i} className="star active">
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {question.type === 'text' && (
                  <div className="pl-4">
                    <textarea
                      placeholder="文本输入框预览"
                      disabled
                      rows={3}
                      className="bg-gray-50 text-gray-400"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <div className="card p-8 text-center text-gray-500">
            <p>暂无题目，请点击上方按钮添加题目</p>
          </div>
        )}
      </div>
    </div>
  );
}
