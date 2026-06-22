import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useSurveyStore } from '@/store/useSurveyStore';
import type { Survey } from '@/types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function truncate(text: string, maxLength: number) {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

function SurveyCard({ survey, onClick }: { survey: Survey; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg p-4 cursor-pointer transition-all duration-200',
        'shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)]'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 mr-3">
          {survey.title || '未命名问卷'}
        </h3>
        <span
          className={cn(
            'text-xs font-medium px-2 py-1 rounded',
            survey.isPublished
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          )}
        >
          {survey.isPublished ? '已发布' : '草稿'}
        </span>
      </div>
      {survey.description && (
        <p className="text-sm text-gray-500 mb-3">
          {truncate(survey.description, 60)}
        </p>
      )}
      <p className="text-xs text-gray-400">
        创建于 {formatDate(survey.createdAt)}
      </p>
      <p className="text-xs text-gray-400 mt-1">
          {survey.questions.length} 道题目
        </p>
    </div>
  );
}

export default function SurveyList() {
  const navigate = useNavigate();
  const { surveys, isLoading, loadSurveys, createSurveyAndGo } = useSurveyStore();

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  const handleCreate = () => {
    createSurveyAndGo(
      { title: '未命名问卷', description: '', questions: [] },
      navigate
    );
  };

  const handleCardClick = (survey: Survey) => {
    if (survey.isPublished) {
      navigate(`/dashboard/${survey.id}`);
    } else {
      navigate(`/editor/${survey.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">我的问卷</h1>
        <button
          onClick={handleCreate}
          disabled={isLoading}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium',
            'bg-blue-600 hover:bg-blue-700 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Plus className="w-4 h-4" />
          创建新问卷
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      )}

      {!isLoading && surveys.length === 0 && (
        <div className="text-center py-20">
          <div className="text-gray-400 text-lg">暂无问卷，点击右上角创建</div>
        </div>
      )}

      {!isLoading && surveys.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surveys.map((survey) => (
            <SurveyCard
              key={survey.id}
              survey={survey}
              onClick={() => handleCardClick(survey)}
            />
          ))}
        </div>
      )}
    </div>
    </div>
  );
}
