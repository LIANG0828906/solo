import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Check } from 'lucide-react';
import { useSurveyStore } from '@/store/useSurveyStore';
import type { ResponseAnswer } from '@/types';

export default function SurveyForm() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const loadSurvey = useSurveyStore((s) => s.loadSurvey);
  const submitSurveyResponse = useSurveyStore((s) => s.submitSurveyResponse);
  const currentSurvey = useSurveyStore((s) => s.currentSurvey);
  const isLoading = useSurveyStore((s) => s.isLoading);
  const error = useSurveyStore((s) => s.error);

  const [answers, setAnswers] = useState<Map<string, string | string[] | number>>(new Map());
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (surveyId) {
      loadSurvey(surveyId);
    }
  }, [surveyId, loadSurvey]);

  const totalQuestions = currentSurvey?.questions.length || 0;
  const answeredCount = useMemo(() => {
    let count = 0;
    currentSurvey?.questions.forEach((q) => {
      const val = answers.get(q.id);
      if (val !== undefined && val !== null) {
        if (Array.isArray(val)) {
          if (val.length > 0) count++;
        } else if (typeof val === 'string') {
          if (val.length > 0) count++;
        } else {
          count++;
        }
      }
    });
    return count;
  }, [answers, currentSurvey]);

  const allRequiredAnswered = useMemo(() => {
    if (!currentSurvey) return false;
    return currentSurvey.questions
      .filter((q) => q.required)
      .every((q) => {
        const val = answers.get(q.id);
        if (val === undefined || val === null) return false;
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === 'string') return val.length > 0;
        return true;
      });
  }, [answers, currentSurvey]);

  const handleSingleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(questionId, value);
      return next;
    });
  };

  const handleMultipleAnswer = (questionId: string, option: string, checked: boolean) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      const current = (next.get(questionId) as string[]) || [];
      if (checked) {
        next.set(questionId, [...current, option]);
      } else {
        next.set(questionId, current.filter((o) => o !== option));
      }
      return next;
    });
  };

  const handleRating = (questionId: string, value: number) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(questionId, value);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!surveyId || !currentSurvey) return;
    const answersArray: ResponseAnswer[] = [];
    answers.forEach((value, questionId) => {
      answersArray.push({ questionId, value });
    });
    const completionTime = Math.round((Date.now() - startTime) / 1000);
    await submitSurveyResponse(surveyId, answersArray, completionTime);
    setSubmitted(true);
  };

  if (isLoading && !currentSurvey) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!currentSurvey) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        问卷不存在
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-500" style={{ transform: 'scale(1.2)' }}>
          <Check className="h-12 w-12 text-white" strokeWidth={3} />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">感谢您的参与！</h1>
        <p className="mb-8 text-gray-500">您的回答已成功提交</p>
        <button
          onClick={() => navigate('/')}
          className="rounded-lg bg-blue-500 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-600"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{currentSurvey.title}</h1>
          <p className="mt-2 text-gray-500">{currentSurvey.description}</p>
        </header>

        <div className="space-y-4">
          {currentSurvey.questions.map((question) => (
            <div
              key={question.id}
              style={{
                background: 'white',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: 20,
                marginBottom: 16,
              }}
            >
              <div className="flex items-start justify-between">
                <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
                  {question.title}
                </h3>
                {question.required && (
                  <span className="ml-2 text-red-500" style={{ fontWeight: 600 }}>*</span>
                )}
              </div>

              {question.type === 'single' && question.options && (
                <div className="space-y-3">
                  {question.options.map((option) => {
                    const checked = answers.get(question.id) === option;
                    return (
                      <label
                        key={option}
                        className="flex cursor-pointer items-center"
                        style={{ gap: 12 }}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={checked}
                          onChange={() => handleSingleAnswer(question.id, option)}
                          className="h-4 w-4 accent-blue-500"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {question.type === 'multiple' && question.options && (
                <div className="space-y-3">
                  {question.options.map((option) => {
                    const current = (answers.get(question.id) as string[]) || [];
                    const checked = current.includes(option);
                    return (
                      <label
                        key={option}
                        className="flex cursor-pointer items-center"
                        style={{ gap: 12 }}
                      >
                        <input
                          type="checkbox"
                          value={option}
                          checked={checked}
                          onChange={(e) => handleMultipleAnswer(question.id, option, e.target.checked)}
                          className="h-4 w-4 accent-blue-500"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {question.type === 'rating' && (
                <RatingInput
                  maxRating={question.maxRating || 5}
                  value={(answers.get(question.id) as number) || 0}
                  onChange={(v) => handleRating(question.id, v)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'sticky',
          bottom: 0,
          background: 'white',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
          padding: '12px 16px',
          zIndex: 50,
        }}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 text-sm text-gray-600">
              进度 {answeredCount}/{totalQuestions}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-blue-500"
                style={{
                  width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!allRequiredAnswered || isLoading}
            className={`flex-shrink-0 rounded-lg px-6 py-2 font-medium text-white transition-colors ${
              allRequiredAnswered && !isLoading
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'cursor-not-allowed bg-gray-300'
            }`}
          >
            {isLoading ? '提交中...' : '提交'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RatingInput({
  maxRating,
  value,
  onChange,
}: {
  maxRating: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = hoverValue || value;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          className="p-0.5"
        >
          <Star
            size={28}
            fill={star <= displayValue ? '#FFB300' : 'none'}
            stroke={star <= displayValue ? '#FFB300' : '#ccc'}
            strokeWidth={2}
            className="transition-colors"
          />
        </button>
      ))}
    </div>
  );
}
