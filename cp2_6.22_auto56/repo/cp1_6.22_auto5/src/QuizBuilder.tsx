import { useState, useCallback } from 'react';
import { ArrowLeft, Plus, Trash2, Check, Copy, ExternalLink } from 'lucide-react';
import { createExam } from './api';
import type { Question, DragOption, DropZone } from './types';

const generateId = () => Math.random().toString(36).substring(2, 10);

const defaultOption = (): DragOption => ({
  id: generateId(),
  content: '',
  type: 'text' as const,
});

const defaultDropZone = (): DropZone => ({
  id: generateId(),
  label: '',
});

const defaultQuestion = (index: number): Question => ({
  id: generateId(),
  title: `第 ${index} 题`,
  options: [defaultOption(), defaultOption(), defaultOption()],
  dropZones: [defaultDropZone(), defaultDropZone(), defaultDropZone()],
  correctMapping: {},
});

interface QuizBuilderProps {
  onBack: () => void;
  onExamCreated: (id: string) => void;
}

export default function QuizBuilder({ onBack, onExamCreated }: QuizBuilderProps) {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    defaultQuestion(1),
    defaultQuestion(2),
    defaultQuestion(3),
  ]);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(questions[0].id);
  const [createdExamId, setCreatedExamId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const addQuestion = useCallback(() => {
    if (questions.length >= 5) return;
    const newIndex = questions.length + 1;
    const newQuestion = defaultQuestion(newIndex);
    setQuestions([...questions, newQuestion]);
    setExpandedQuestion(newQuestion.id);
  }, [questions]);

  const removeQuestion = useCallback((id: string) => {
    if (questions.length <= 3) return;
    setQuestions(questions.filter((q) => q.id !== id));
    if (expandedQuestion === id) {
      setExpandedQuestion(questions[0].id === id ? questions[1]?.id : questions[0].id);
    }
  }, [questions, expandedQuestion]);

  const updateQuestionTitle = useCallback((id: string, value: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, title: value } : q)));
  }, [questions]);

  const addOption = useCallback((questionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, options: [...q.options, defaultOption()] } : q
      )
    );
  }, [questions]);

  const removeOption = useCallback((questionId: string, optionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.filter((o) => o.id !== optionId),
              correctMapping: Object.fromEntries(
                Object.entries(q.correctMapping).filter(([key]) => key !== optionId)
              ),
            }
          : q
      )
    );
  }, [questions]);

  const updateOption = useCallback((questionId: string, optionId: string, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((o) => (o.id === optionId ? { ...o, content: value } : o)),
            }
          : q
      )
    );
  }, [questions]);

  const addDropZone = useCallback((questionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, dropZones: [...q.dropZones, defaultDropZone()] } : q
      )
    );
  }, [questions]);

  const removeDropZone = useCallback((questionId: string, zoneId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              dropZones: q.dropZones.filter((d) => d.id !== zoneId),
              correctMapping: Object.fromEntries(
                Object.entries(q.correctMapping).filter(([_, value]) => value !== zoneId)
              ),
            }
          : q
      )
    );
  }, [questions]);

  const updateDropZoneLabel = useCallback((questionId: string, zoneId: string, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              dropZones: q.dropZones.map((d) => (d.id === zoneId ? { ...d, label: value } : d)),
            }
          : q
      )
    );
  }, [questions]);

  const updateCorrectMapping = useCallback(
    (questionId: string, optionId: string, zoneId: string) => {
      setQuestions(
        questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                correctMapping: {
                  ...q.correctMapping,
                  [optionId]: zoneId,
                },
              }
            : q
        )
      );
    },
    [questions]
  );

  const handleSubmit = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await createExam(title, questions);
      setCreatedExamId(result.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setIsSubmitting(false);
    }
  }, [title, questions]);

  const copyLink = useCallback(() => {
    if (!createdExamId) return;
    const link = `${window.location.origin}${window.location.pathname}#quiz/${createdExamId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [createdExamId]);

  if (createdExamId) {
    const quizLink = `${window.location.origin}${window.location.pathname}#quiz/${createdExamId}`;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <header className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-800">创建成功</h1>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center animate-slide-in-up">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">测验创建成功！</h2>
            <p className="text-gray-600 mb-6">
              已创建 "{title}"，共 {questions.length} 道题目
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500 mb-2">学生访问链接：</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-4 py-3 rounded-lg border text-sm text-gray-700 overflow-x-auto">
                  {quizLink}
                </code>
                <button
                  onClick={copyLink}
                  className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
              onClick={onBack}
              className="flex-1 py-3 px-6 btn-secondary rounded-xl font-medium"
            >
              返回首页
            </button>
            <button
              onClick={() => onExamCreated(createdExamId)}
              className="flex-1 py-3 px-6 btn-primary rounded-xl font-medium flex items-center justify-center gap-2"
            >
              预览测验
              <ExternalLink className="w-5 h-5" />
            </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 pb-32">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-800">创建测验</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 animate-slide-in-down">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 mb-6 shadow-md animate-slide-in-up">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            测验标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入测验标题"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        {questions.map((question, qIndex) => (
          <div
            key={question.id}
            className="bg-white rounded-2xl shadow-md mb-6 overflow-hidden animate-slide-in-up"
            style={{ animationDelay: `${(qIndex + 1) * 0.1}s` }}
          >
            <div
              className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 cursor-pointer flex items-center justify-between"
              onClick={() =>
                setExpandedQuestion(
                  expandedQuestion === question.id ? null : question.id
                )
              }
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold">
                  {qIndex + 1}
                </div>
                <span className="text-white font-medium">
                  {question.title || `第 ${qIndex + 1} 题`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/80 text-sm">
                  {question.options.length} 个选项 · {question.dropZones.length} 个目标区
                </span>
                {questions.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeQuestion(question.id);
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </div>

            {expandedQuestion === question.id && (
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    题目描述
                  </label>
                  <input
                    type="text"
                    value={question.title}
                    onChange={(e) => updateQuestionTitle(question.id, e.target.value)}
                    placeholder="请输入题目描述"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                    可拖拽选项
                    </label>
                    <button
                      onClick={() => addOption(question.id)}
                      className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      添加选项
                    </button>
                  </div>
                  <div className="space-y-3">
                    {question.options.map((option, oIndex) => (
                      <div
                        key={option.id}
                        className="flex items-center gap-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                          {String.fromCharCode(65 + oIndex)}
                        </div>
                        <input
                          type="text"
                          value={option.content}
                          onChange={(e) =>
                            updateOption(question.id, option.id, e.target.value)
                          }
                          placeholder={`选项 ${String.fromCharCode(65 + oIndex)}`}
                          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                        />
                        {question.options.length > 1 && (
                          <button
                            onClick={() => removeOption(question.id, option.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      目标放置区
                    </label>
                    <button
                      onClick={() => addDropZone(question.id)}
                      className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      添加目标区
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {question.dropZones.map((zone, zIndex) => (
                      <div
                        key={zone.id}
                        className="flex items-center gap-2"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-medium">
                          {zIndex + 1}
                        </div>
                        <input
                          type="text"
                          value={zone.label}
                          onChange={(e) =>
                            updateDropZoneLabel(question.id, zone.id, e.target.value)
                          }
                          placeholder={`目标区 ${zIndex + 1}`}
                          className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                        />
                        {question.dropZones.length > 1 && (
                          <button
                            onClick={() => removeDropZone(question.id, zone.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    正确答案映射（将选项拖到正确的目标区）
                  </label>
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <div
                        key={option.id}
                        className="flex items-center gap-3"
                      >
                        <div className="w-28 flex-shrink-0">
                          <span className="text-sm text-gray-600">
                            选项 {String.fromCharCode(65 + oIndex)}:
                          </span>
                        </div>
                        <div className="flex-1 bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 truncate">
                          {option.content || '(未填写)'}
                        </div>
                        <span className="text-gray-400">→</span>
                        <select
                          value={question.correctMapping[option.id] || ''}
                          onChange={(e) =>
                            updateCorrectMapping(question.id, option.id, e.target.value)
                          }
                          className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
                        >
                          <option value="">请选择目标区</option>
                          {question.dropZones.map((zone, zIndex) => (
                            <option key={zone.id} value={zone.id}>
                              {zone.label || `目标区 ${zIndex + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {questions.length < 5 && (
          <button
            onClick={addQuestion}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 mb-6"
          >
            <Plus className="w-5 h-5" />
            添加题目 ({questions.length}/5)
          </button>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-500">
            共 {questions.length} 道题目
          </div>
          <button
            onClick={handleSubmit}
            disabled={!title || isSubmitting}
            className="px-8 py-3 btn-primary rounded-xl font-medium"
          >
            {isSubmitting ? '创建中...' : '创建测验'}
          </button>
        </div>
      </div>
    </div>
  );
}
