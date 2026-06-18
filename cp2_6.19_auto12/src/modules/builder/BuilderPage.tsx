import React, { useState, useCallback, useEffect } from 'react';
import { GripVertical, Trash2, RotateCcw, BarChart3, AlertTriangle } from 'lucide-react';
import { QuestionEditor } from './QuestionEditor';
import { storage } from '../../utils/storage';
import type { Question, Page } from '../../types';

interface BuilderPageProps {
  onNavigate: (page: Page) => void;
}

interface DragState {
  isDragging: boolean;
  draggedIndex: number | null;
  dragOverIndex: number | null;
}

export const BuilderPage: React.FC<BuilderPageProps> = ({ onNavigate }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedIndex: null,
    dragOverIndex: null,
  });

  useEffect(() => {
    const saved = storage.getQuestions();
    if (saved.length > 0) {
      setQuestions(saved);
    }
  }, []);

  useEffect(() => {
    storage.setQuestions(questions);
  }, [questions]);

  const handleSaveQuestion = useCallback((question: Question) => {
    setQuestions((prev) => [...prev, question]);
  }, []);

  const handleDeleteQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragState({ isDragging: true, draggedIndex: index, dragOverIndex: null });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = '0.5';
    }, 0);
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDragState({ isDragging: false, draggedIndex: null, dragOverIndex: null });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragState.dragOverIndex !== index) {
      setDragState((prev) => ({ ...prev, dragOverIndex: index }));
    }
  }, [dragState.dragOverIndex]);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = dragState.draggedIndex;
    if (dragIndex === null || dragIndex === dropIndex) return;

    setQuestions((prev) => {
      const newQuestions = [...prev];
      const [draggedItem] = newQuestions.splice(dragIndex, 1);
      newQuestions.splice(dropIndex, 0, draggedItem);
      return newQuestions;
    });
    setDragState({ isDragging: false, draggedIndex: null, dragOverIndex: null });
  }, [dragState.draggedIndex]);

  const handleReset = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const confirmReset = useCallback(() => {
    setQuestions([]);
    storage.clearAll();
    setShowConfirm(false);
  }, []);

  const cancelReset = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const handleGoToStats = useCallback(() => {
    onNavigate('stats');
  }, [onNavigate]);

  const getAccuracyColor = (rate: number): string => {
    if (rate > 0.8) return '#4caf50';
    if (rate >= 0.5) return '#ff9800';
    return '#e53935';
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1a237e] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">互动式练习题管理系统</h1>
          <button
            onClick={handleGoToStats}
            disabled={questions.length < 3}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              questions.length >= 3
                ? 'bg-white text-[#1a237e] hover:bg-gray-100 active:scale-[0.98]'
                : 'bg-white/30 text-white/60 cursor-not-allowed'
            }`}
          >
            <BarChart3 size={18} />
            查看统计
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-2/5">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">
                创建题目
              </h2>
              <QuestionEditor onSave={handleSaveQuestion} />
              <p className="mt-4 text-sm text-gray-500">
                已创建 {questions.length}/3+ 道题目
              </p>
            </div>
          </div>

          <div className="w-full lg:w-3/5">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">
                  题目预览
                </h2>
                <button
                  onClick={handleReset}
                  disabled={questions.length === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    questions.length > 0
                      ? 'text-red-600 hover:bg-red-50 active:scale-[0.98]'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <RotateCcw size={18} />
                  一键重置
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-lg">暂无题目</p>
                  <p className="text-sm mt-2">在左侧创建至少3道题目开始使用</p>
                </div>
              ) : (
                <div
                  className={`space-y-4 max-h-[600px] overflow-y-auto pr-2 ${
                    dragState.isDragging ? 'select-none' : ''
                  }`}
                >
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`bg-white border-2 rounded-xl p-5 cursor-move transition-all duration-300 ${
                        dragState.dragOverIndex === index &&
                        dragState.draggedIndex !== index
                          ? 'border-[#1a237e] shadow-lg scale-[1.02]'
                          : 'border-gray-200 shadow-sm hover:shadow-md'
                      } ${
                        dragState.draggedIndex === index
                          ? 'opacity-50 shadow-xl'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 text-gray-400 hover:text-[#1a237e] transition-colors cursor-grab active:cursor-grabbing">
                          <GripVertical size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="font-medium text-gray-800 text-[14px] font-roboto">
                              {index + 1}. {question.title}
                            </h3>
                            <button
                              onClick={() =>
                                handleDeleteQuestion(question.id)
                              }
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="mt-3 space-y-2">
                            {question.options.map(
                              (option, optIndex) => (
                                <div
                                  key={option.id}
                                  className={`px-3 py-2 rounded-lg text-[14px] font-roboto transition-all duration-200 ${
                                    optIndex ===
                                    question.correctOptionIndex
                                      ? 'bg-green-100 text-green-800 border border-green-300'
                                      : 'bg-gray-50 text-gray-700 border border-gray-200'
                                  }`}
                                >
                                  <span className="font-medium mr-2">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                  {option.text}
                                  {optIndex ===
                                    question.correctOptionIndex && (
                                    <span className="ml-2 text-green-600 text-xs">
                                      ✓ 正确答案
                                    </span>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 animate-[shake_0.4s_ease-in-out]">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-semibold">确认重置</h3>
            </div>
            <p className="text-gray-600 mb-6">
              此操作将清空所有题目和模拟数据，且无法恢复。确定要继续吗？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelReset}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
