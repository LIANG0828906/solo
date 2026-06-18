import { useState, useMemo } from 'react';
import { useSurveyStore } from '@/store';
import { Survey } from '@/utils/questionTypes';
import { Search, Plus, ClipboardList } from 'lucide-react';
import RippleButton from './RippleButton';
import SurveyCard from './SurveyCard';

type SortOrder = 'newest' | 'oldest';

export default function SurveyList() {
  const { surveys, responses, navigate } = useSurveyStore();
  const [searchText, setSearchText] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const responseCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of responses) {
      map[r.surveyId] = (map[r.surveyId] || 0) + 1;
    }
    return map;
  }, [responses]);

  const filteredAndSortedSurveys = useMemo(() => {
    let result: Survey[] = [...surveys];

    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(keyword) ||
          s.description.toLowerCase().includes(keyword)
      );
    }

    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [surveys, searchText, sortOrder]);

  const handleSurveyClick = (surveyId: string) => {
    navigate('/survey-detail', { id: surveyId });
  };

  const handleCreateSurvey = () => {
    navigate('/survey-create');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <nav
        className="w-full h-16 flex items-center justify-between px-6 sticky top-0 z-10 shadow-md"
        style={{ backgroundColor: '#1E88E5' }}
      >
        <h1 className="text-xl font-bold text-white">问卷平台</h1>
        <RippleButton variant="secondary" onClick={handleCreateSurvey}>
          <Plus className="w-4 h-4" />
          创建问卷
        </RippleButton>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: 'var(--color-text-secondary)' }}
            />
            <input
              type="text"
              placeholder="搜索问卷标题或描述..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="select sm:w-48"
          >
            <option value="newest">最近优先</option>
            <option value="oldest">最早优先</option>
          </select>
        </div>

        {filteredAndSortedSurveys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <ClipboardList
              className="w-20 h-20 mb-4"
              style={{ color: 'var(--color-border)' }}
            />
            <h2
              className="text-xl font-medium mb-2"
              style={{ color: 'var(--color-text)' }}
            >
              暂无问卷
            </h2>
            <p
              className="text-sm mb-6"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              点击创建问卷开始
            </p>
            <RippleButton variant="primary" onClick={handleCreateSurvey}>
              <Plus className="w-4 h-4" />
              创建问卷
            </RippleButton>
          </div>
        ) : (
          <div className="survey-grid grid gap-6">
            {filteredAndSortedSurveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                responseCount={responseCountMap[survey.id] || 0}
                onClick={() => handleSurveyClick(survey.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
