import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useSurveyStore } from '@/store';
import { QuestionType, Question, SurveyAnswer } from '@/utils/questionTypes';
import RippleButton from './RippleButton';

export default function FillSurvey() {
  const { routeParams, getSurvey, addResponse, navigate } = useSurveyStore();
  const surveyId = routeParams.id;
  const survey = getSurvey(surveyId);

  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (survey) {
      const initialAnswers: Record<string, string | string[]> = {};
      survey.questions.forEach((q) => {
        if (q.type === QuestionType.MULTIPLE_CHOICE) {
          initialAnswers[q.id] = [];
        } else {
          initialAnswers[q.id] = '';
        }
      });
      setAnswers(initialAnswers);
    }
  }, [survey]);

  if (!survey) {
    return (
      <div className="min-h-screen">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 h-14 flex items-center px-4">
          <button
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold ml-2">填写问卷</h1>
        </div>
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
          <div className="text-center">
            <div className="text-gray-400 text-lg mb-2">问卷不存在</div>
            <RippleButton variant="primary" onClick={() => navigate('/')}>
              返回首页
            </RippleButton>
          </div>
        </div>
      </div>
    );
  }

  const handleSingleChoice = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleMultipleChoice = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || [];
      const exists = current.includes(optionId);
      return {
        ...prev,
        [questionId]: exists
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      };
    });
  };

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const validateAnswers = (): boolean => {
    for (const question of survey.questions) {
      if (!question.required) continue;
      const value = answers[question.id];
      if (question.type === QuestionType.SINGLE_CHOICE) {
        if (typeof value !== 'string' || value.length === 0) return false;
      } else if (question.type === QuestionType.MULTIPLE_CHOICE) {
        if (!Array.isArray(value) || value.length === 0) return false;
      } else if (question.type === QuestionType.TEXT) {
        if (typeof value !== 'string' || value.trim().length === 0) return false;
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateAnswers()) {
      alert('请完成所有必答题');
      return;
    }
    const answerList: SurveyAnswer[] = survey.questions.map((q) => ({
      questionId: q.id,
      value: answers[q.id],
    }));
    addResponse({ surveyId, answers: answerList });
    setShowSuccess(true);
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  const renderQuestion = (question: Question, index: number) => {
    const selectedValue = answers[question.id];

    return (
      <div key={question.id} className="mb-8 last:mb-0">
        <div className="mb-3">
          <span className="font-medium">
            {index + 1}. {question.title}
          </span>
          {question.required && <span className="required-mark">*</span>}
        </div>

        {question.type === QuestionType.SINGLE_CHOICE && question.options && (
          <div className="radio-group">
            {question.options.map((option) => (
              <label
                key={option.id}
                className={selectedValue === option.id ? 'selected' : ''}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={selectedValue === option.id}
                  onChange={() => handleSingleChoice(question.id, option.id)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === QuestionType.MULTIPLE_CHOICE && question.options && (
          <div className="checkbox-group">
            {question.options.map((option) => (
              <label
                key={option.id}
                className={
                  Array.isArray(selectedValue) &&
                  selectedValue.includes(option.id)
                    ? 'selected'
                    : ''
                }
              >
                <input
                  type="checkbox"
                  value={option.id}
                  checked={
                    Array.isArray(selectedValue) &&
                    selectedValue.includes(option.id)
                  }
                  onChange={() => handleMultipleChoice(question.id, option.id)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === QuestionType.TEXT && (
          <textarea
            className="textarea"
            placeholder="请输入您的回答..."
            value={(selectedValue as string) || ''}
            onChange={(e) => handleTextChange(question.id, e.target.value)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 h-14 flex items-center px-4">
        <button
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold ml-2">填写问卷</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto pb-28">
        <div
          className="bg-white p-6 fade-in"
          style={{ borderRadius: '12px' }}
        >
          <h1 className="text-xl font-bold mb-2">{survey.title}</h1>
          <p className="text-sm text-gray-500 mb-6">{survey.description}</p>

          {survey.questions.map((q, idx) => renderQuestion(q, idx))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex justify-center">
        <RippleButton
          variant="primary"
          onClick={handleSubmit}
          className="w-full max-w-2xl"
        >
          提交问卷
        </RippleButton>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 fade-in">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-success)' }} />
            <p className="text-lg font-medium" style={{ color: 'var(--color-success)' }}>
              提交成功
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
