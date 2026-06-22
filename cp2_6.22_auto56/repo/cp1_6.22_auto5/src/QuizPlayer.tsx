import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCcw, Send, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getExam, submitAnswers } from './api';
import type { Exam, StudentAnswer, QuestionResult } from './types';

interface PlacementState {
  [questionId: string]: {
    [optionId: string]: string | null;
  };
}

interface QuizPlayerProps {
  examId: string;
  onBack: () => void;
}

export default function QuizPlayer({ examId, onBack }: QuizPlayerProps) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placements, setPlacements] = useState<PlacementState>({});
  const [results, setResults] = useState<QuestionResult[] | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedOption, setSelectedOption] = useState<{
    optionId: string;
    questionId: string;
  } | null>(null);
  const [scoreAnimation, setScoreAnimation] = useState(false);

  const dragImageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadExam = async () => {
      try {
        setLoading(true);
        const data = await getExam(examId);
        setExam(data);

        const initialPlacements: PlacementState = {};
        data.questions.forEach((q) => {
          initialPlacements[q.id] = {};
          q.options.forEach((o) => {
            initialPlacements[q.id][o.id] = null;
          });
        });
        setPlacements(initialPlacements);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [examId]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, optionId: string, questionId: string, content: string) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify({ optionId, questionId, content }));

      if (e.target instanceof HTMLElement) {
        e.target.classList.add('dragging');
      }

      if (dragImageRef.current) {
        dragImageRef.current.textContent = content;
        dragImageRef.current.style.position = 'absolute';
        dragImageRef.current.style.top = '-1000px';
        document.body.appendChild(dragImageRef.current);
        e.dataTransfer.setDragImage(dragImageRef.current, 50, 20);
      }
    },
    []
  );

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedOption(null);
    if (e.target instanceof HTMLElement) {
      e.target.classList.remove('dragging');
    }
    if (dragImageRef.current && dragImageRef.current.parentNode) {
      dragImageRef.current.parentNode.removeChild(dragImageRef.current);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add('drop-highlight');
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove('drop-highlight');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, questionId: string, zoneId: string) => {
      e.preventDefault();
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.classList.remove('drop-highlight');
      }

      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (data.questionId === questionId) {
          setPlacements((prev) => ({
            ...prev,
            [questionId]: {
              ...prev[questionId],
              [data.optionId]: zoneId,
            },
          }));
        }
      } catch {
        // Ignore
      }
    },
    []
  );

  const handleOptionClick = useCallback(
    (optionId: string, questionId: string) => {
      if (!isMobile || results) return;

      if (selectedOption?.optionId === optionId) {
        setSelectedOption(null);
      } else {
        setSelectedOption({ optionId, questionId });
      }
    },
    [isMobile, results, selectedOption]
  );

  const handleZoneClick = useCallback(
    (questionId: string, zoneId: string) => {
      if (!isMobile || results) return;

      if (selectedOption && selectedOption.questionId === questionId) {
        setPlacements((prev) => ({
          ...prev,
          [questionId]: {
            ...prev[questionId],
            [selectedOption.optionId]: zoneId,
          },
        }));
        setSelectedOption(null);
      }
    },
    [isMobile, results, selectedOption]
  );

  const handleRemovePlacement = useCallback(
    (questionId: string, optionId: string) => {
      if (results) return;
      setPlacements((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          [optionId]: null,
        },
      }));
    },
    [results]
  );

  const handleSubmit = useCallback(async () => {
    if (!exam || submitting) return;

    const answers: StudentAnswer[] = exam.questions.map((q) => {
      const questionPlacements = placements[q.id] || {};
      const filteredPlacements: Record<string, string> = {};
      Object.entries(questionPlacements).forEach(([key, value]) => {
        if (value !== null) {
          filteredPlacements[key] = value;
        }
      });
      return {
        questionId: q.id,
        placements: filteredPlacements,
      };
    });

    try {
      setSubmitting(true);
      const response = await submitAnswers(examId, { answers });
      setResults(response.results);
      setScoreAnimation(true);
      setTimeout(() => setScoreAnimation(false), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }, [exam, examId, placements, submitting]);

  const handleReset = useCallback(() => {
    if (!exam) return;

    const initialPlacements: PlacementState = {};
    exam.questions.forEach((q) => {
      initialPlacements[q.id] = {};
      q.options.forEach((o) => {
        initialPlacements[q.id][o.id] = null;
      });
    });

    setPlacements(initialPlacements);
    setResults(null);
    setSelectedOption(null);
    setError(null);
  }, [exam]);

  const getOptionResultStatus = useCallback(
    (questionId: string, optionId: string): 'correct' | 'wrong' | null => {
      if (!results) return null;
      const result = results.find((r) => r.questionId === questionId);
      if (!result) return null;
      if (result.correctPlacements.includes(optionId)) return 'correct';
      if (result.wrongPlacements.includes(optionId)) return 'wrong';
      return null;
    },
    [results]
  );

  const getPlacedOptionsForZone = useCallback(
    (questionId: string, zoneId: string) => {
      if (!exam) return [];
      const question = exam.questions.find((q) => q.id === questionId);
      if (!question) return [];

      return question.options.filter(
        (o) => placements[questionId]?.[o.id] === zoneId
      );
    },
    [exam, placements]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载测验中...</p>
        </div>
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">加载失败</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 btn-primary rounded-xl font-medium"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (!exam) return null;

  const totalScore = results ? results.reduce((sum, r) => sum + r.score, 0) : 0;
  const maxScore = results ? results.reduce((sum, r) => sum + r.total, 0) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 pb-40">
      <div ref={(el) => { dragImageRef.current = el; }} className="hidden" />

      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-800 truncate">{exam.title}</h1>
            <p className="text-xs text-gray-500">
              共 {exam.questions.length} 道题目
            </p>
          </div>
          {results && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white ${scoreAnimation ? 'animate-pulse-once' : ''}`}
            >
              <span className="text-sm">得分</span>
              <span className="text-2xl font-bold">{totalScore}</span>
              <span className="text-sm opacity-80">/ {maxScore}</span>
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-slide-in-down">
            {error}
          </div>
        </div>
      )}

      {isMobile && !results && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-slide-in-down">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>移动端模式：先点击选中选项，再点击目标区完成放置</span>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {exam.questions.map((question, qIndex) => {
          const result = results?.find((r) => r.questionId === question.id);

          return (
            <div
              key={question.id}
              className="question-card bg-white rounded-2xl shadow-lg overflow-hidden animate-slide-in-up relative"
              style={{ animationDelay: `${qIndex * 0.1}s` }}
            >
              {result && (
                <div className="result-overlay absolute inset-0 z-10 bg-white/95 animate-fade-in flex flex-col">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            result.score === result.total
                              ? 'bg-green-100'
                              : 'bg-orange-100'
                          }`}
                        >
                          {result.score === result.total ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : (
                            <XCircle className="w-6 h-6 text-orange-500" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            第 {qIndex + 1} 题
                          </h3>
                          <p className="text-sm text-gray-500">
                            得分：{result.score} / {result.total}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-6">
                    <p className="text-sm text-gray-700 mb-4 font-medium">正确答案：</p>
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => {
                        const correctZoneId = result.correctMapping[option.id];
                        const correctZone = question.dropZones.find(
                          (z) => z.id === correctZoneId
                        );
                        const status = getOptionResultStatus(question.id, option.id);

                        return (
                          <div
                            key={option.id}
                            className="flex items-center gap-3 text-sm"
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                status === 'correct'
                                  ? 'bg-green-100'
                                  : status === 'wrong'
                                  ? 'bg-red-100'
                                  : 'bg-gray-100'
                              }`}
                            >
                              {status === 'correct' ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : status === 'wrong' ? (
                                <XCircle className="w-4 h-4 text-red-500" />
                              ) : (
                                <span className="text-gray-500 text-xs">
                                  {String.fromCharCode(65 + oIndex)}
                                </span>
                              )}
                            </div>
                            <span className="text-gray-700">{option.content}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-blue-600 font-medium">
                              {correctZone?.label || correctZoneId}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                    {qIndex + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {question.title}
                  </h3>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">
                      可拖拽选项
                    </h4>
                    <div className="space-y-3">
                      {question.options.map((option, oIndex) => {
                        const isPlaced = !!placements[question.id]?.[option.id];
                        const isSelected =
                          selectedOption?.optionId === option.id &&
                          selectedOption?.questionId === question.id;
                        const status = getOptionResultStatus(question.id, option.id);

                        if (isPlaced && !results) return null;

                        return (
                          <div
                            key={option.id}
                            draggable={!isMobile && !results}
                            onDragStart={(e) =>
                              handleDragStart(e, option.id, question.id, option.content)
                            }
                            onDragEnd={handleDragEnd}
                            onClick={() => handleOptionClick(option.id, question.id)}
                            className={`option-card p-4 rounded-xl border-2 transition-all duration-200 ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
                                : status === 'correct'
                                ? 'correct-border bg-green-50'
                                : status === 'wrong'
                                ? 'wrong-border bg-red-50'
                                : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                                  status === 'correct'
                                    ? 'bg-green-200 text-green-700'
                                    : status === 'wrong'
                                    ? 'bg-red-200 text-red-700'
                                    : 'bg-white text-gray-600 border border-gray-200'
                                }`}
                              >
                                {String.fromCharCode(65 + oIndex)}
                              </div>
                              <span className="text-gray-800">{option.content}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">
                      目标放置区
                    </h4>
                    <div className="space-y-3">
                      {question.dropZones.map((zone, zIndex) => {
                        const placedOptions = getPlacedOptionsForZone(question.id, zone.id);

                        return (
                          <div
                            key={zone.id}
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, question.id, zone.id)}
                            onClick={() => handleZoneClick(question.id, zone.id)}
                            className={`drop-zone min-h-[80px] p-4 rounded-xl border-2 border-dashed transition-all duration-200 ${
                              selectedOption?.questionId === question.id
                                ? 'cursor-pointer border-blue-400 bg-blue-50/50'
                                : 'border-gray-300 bg-gray-50'
                            }`}
                          >
                            <div className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center text-xs font-medium">
                                {zIndex + 1}
                              </span>
                              <span>{zone.label}</span>
                            </div>
                            <div className="space-y-2">
                              {placedOptions.map((option) => {
                                const status = getOptionResultStatus(
                                  question.id,
                                  option.id
                                );

                                return (
                                  <div
                                    key={option.id}
                                    className={`p-3 rounded-lg border-2 flex items-center justify-between ${
                                      status === 'correct'
                                        ? 'correct-border bg-green-50'
                                        : status === 'wrong'
                                        ? 'wrong-border bg-red-50'
                                        : 'border-blue-300 bg-blue-50'
                                    }`}
                                  >
                                    <span className="text-sm text-gray-700">
                                      {option.content}
                                    </span>
                                    {!results && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemovePlacement(question.id, option.id);
                                        }}
                                        className="p-1 hover:bg-white/50 rounded transition-colors"
                                      >
                                        <XCircle className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                              {placedOptions.length === 0 && (
                                <div className="text-sm text-gray-400 text-center py-2">
                                  {isMobile ? '点击选择选项后放置到这里' : '拖拽选项到这里'}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="text-sm text-gray-500 hidden sm:block">
            {results
              ? `总分：${totalScore} / ${maxScore}`
              : `已完成 ${
                  Object.values(placements).flatMap((q) => Object.values(q).filter(Boolean)).length
                } / ${exam.questions.reduce((sum, q) => sum + q.options.length, 0)} 个放置`}
          </div>
          <div className="flex gap-3 ml-auto">
            <button
              onClick={handleReset}
              className="px-6 py-3 btn-secondary rounded-xl font-medium flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              重新作答
            </button>
            {!results && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 btn-primary rounded-xl font-medium flex items-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {submitting ? '提交中...' : '提交答案'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
