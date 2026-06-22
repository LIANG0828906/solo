import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Send, Lightbulb } from 'lucide-react';
import type { Unit, QuizResult } from '@/types';
import { useLearningStore } from '@/store/useLearningStore';

interface QuizEngineProps {
  unit: Unit;
}

const QuizEngine: React.FC<QuizEngineProps> = ({ unit }) => {
  const { submitQuiz } = useLearningStore();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    setAnswers({});
    setResult(null);
    setExpandedQuestions(new Set());
  }, [unit.id]);

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    if (result) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length === 0) return;

    setIsSubmitting(true);
    try {
      const quizResult = await submitQuiz(unit.id, answers);
      if (quizResult) {
        setResult(quizResult);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleQuestionExpand = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const getOptionStyle = (questionId: string, optionIndex: number) => {
    const userAnswer = answers[questionId];
    const isSelected = userAnswer === optionIndex;

    if (!result) {
      return isSelected
        ? 'border-orange-500 bg-orange-50 text-orange-700'
        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50';
    }

    const detail = result.details.find((d) => d.questionId === questionId);
    if (!detail) return 'border-gray-200';

    const isCorrect = optionIndex === detail.correctAnswer;
    const isUserAnswer = optionIndex === detail.userAnswer;

    if (isCorrect) {
      return 'border-green-500 bg-green-50 text-green-700';
    }
    if (isUserAnswer && !isCorrect) {
      return 'border-red-500 bg-red-50 text-red-700';
    }
    return 'border-gray-200 opacity-60';
  };

  const answeredCount = Object.keys(answers).length;
  const totalCount = unit.quiz.length;

  return (
    <div
      className="bg-white rounded-xl shadow-lg p-5 border border-gray-100"
      style={{
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-lg" style={{ color: '#1a365d' }}>
          单元测验
        </h4>
        <span className="text-sm text-gray-500">
          共 {totalCount} 题
        </span>
      </div>

      <div className="space-y-5">
        {unit.quiz.map((question, qIndex) => {
          const isExpanded = expandedQuestions.has(question.id);
          const detail = result?.details.find((d) => d.questionId === question.id);

          return (
            <div
              key={question.id}
              className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
              style={{
                animation: `fadeIn 0.4s ease forwards`,
                animationDelay: `${qIndex * 0.1}s`,
                opacity: 0,
              }}
            >
              <div className="flex items-start gap-2 mb-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: '#1a365d' }}
                >
                  {qIndex + 1}
                </span>
                <p className="font-medium text-gray-800">{question.question}</p>
              </div>

              <div className="space-y-2 ml-8">
                {question.options.map((option, oIndex) => (
                  <div
                    key={oIndex}
                    onClick={() => handleSelectAnswer(question.id, oIndex)}
                    className={`
                      px-3 py-2 rounded-lg border-2 cursor-pointer
                      transition-all duration-200 text-sm
                      ${getOptionStyle(question.id, oIndex)}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {String.fromCharCode(65 + oIndex)}.
                      </span>
                      <span>{option}</span>
                      {result && detail && oIndex === detail.correctAnswer && (
                        <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                      )}
                      {result && detail && oIndex === detail.userAnswer && !detail.isCorrect && (
                        <XCircle className="w-4 h-4 text-red-500 ml-auto" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {result && detail && (
                <div className="ml-8 mt-3">
                  <button
                    onClick={() => toggleQuestionExpand(question.id)}
                    className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 font-medium"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>查看解析</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {isExpanded && (
                    <div
                      className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200"
                      style={{ animation: 'fadeIn 0.2s ease' }}
                    >
                      <p className="text-sm text-gray-700">{detail.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!result ? (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">
              已作答 {answeredCount}/{totalCount} 题
            </span>
            <div className="h-2 flex-1 mx-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(answeredCount / totalCount) * 100}%`,
                  backgroundColor: '#ed8936',
                }}
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={answeredCount === 0 || isSubmitting}
            className={`
              w-full py-3 rounded-xl font-bold text-white btn-ripple
              transition-all duration-300 flex items-center justify-center gap-2
              ${answeredCount === 0 || isSubmitting
                ? 'bg-gray-300 cursor-not-allowed'
                : 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
              }
            `}
            style={{
              backgroundColor: answeredCount === 0 || isSubmitting ? undefined : '#ed8936',
            }}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin w-5 h-5"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                提交中...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                提交答案
              </>
            )}
          </button>
        </div>
      ) : (
        <div
          className="mt-5 pt-4 border-t border-gray-100"
          style={{ animation: 'fadeIn 0.3s ease' }}
        >
          <div
            className={`
              p-4 rounded-xl text-center
              ${result.score >= 80
                ? 'bg-green-50 border border-green-200'
                : result.score >= 60
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-red-50 border border-red-200'
              }
            `}
          >
            <p className="text-sm text-gray-500 mb-1">本次得分</p>
            <p
              className={`text-3xl font-bold ${
                result.score >= 80
                  ? 'text-green-600'
                  : result.score >= 60
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {result.score}分
            </p>
            <p className="text-sm text-gray-500 mt-1">
              正确 {result.correctCount}/{result.totalCount} 题
            </p>
            {result.score < 60 && (
              <p className="text-sm text-red-500 mt-2 font-medium">
                ⚠️ 正确率低于60%，建议加强复习
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizEngine;
