import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Users } from 'lucide-react';
import { SubmissionList } from '@/components/SubmissionList';
import { StatsPanel } from '@/components/StatsPanel';
import { essayApi } from '@/services/api';
import type { EssaySubmission, StatsResponse } from '@/types';

const MOCK_STATS: StatsResponse = {
  totalSubmissions: 12,
  scoreDistribution: {
    '90-100': 2,
    '80-89': 4,
    '70-79': 3,
    '60-69': 2,
    '0-59': 1,
  },
  errorTypeCount: {
    spelling: 15,
    punctuation: 8,
    grammar: 10,
  },
  averageScore: 76.5,
};

const MOCK_SUBMISSIONS: EssaySubmission[] = [
  {
    id: '1',
    title: '信息技术对教育的影响',
    content: '随着科技的飞速发展，教育领域也发生了深刻的变革...',
    submittedAt: '2024-01-15T10:30:00Z',
    errors: [
      { id: 'e1', type: 'spelling', text: '便倢', offset: 10, length: 2, suggestion: '便捷', message: '错别字' },
    ],
    structure: { hasIntro: true, hasBody: true, hasConclusion: true, introPercent: 15, bodyPercent: 70, conclusionPercent: 15, suggestions: [] },
    scores: { grammar: 4, structure: 5, vocabulary: 4, relevance: 5, total: 92 },
  },
  {
    id: '2',
    title: '我的理想',
    content: '每个人都有自己的理想，而我的理想是成为一名科学家...',
    submittedAt: '2024-01-14T14:20:00Z',
    errors: [
      { id: 'e1', type: 'grammar', text: '因为所以', offset: 50, length: 4, suggestion: '因此', message: '关联词使用不当' },
    ],
    structure: { hasIntro: true, hasBody: true, hasConclusion: true, introPercent: 20, bodyPercent: 60, conclusionPercent: 20, suggestions: [] },
    scores: { grammar: 3, structure: 4, vocabulary: 3, relevance: 4, total: 72 },
  },
  {
    id: '3',
    title: '环境保护从我做起',
    content: '地球是我们共同的家园，保护环境是每个人的责任...',
    submittedAt: '2024-01-13T09:15:00Z',
    errors: [],
    structure: { hasIntro: true, hasBody: true, hasConclusion: true, introPercent: 12, bodyPercent: 75, conclusionPercent: 13, suggestions: [] },
    scores: { grammar: 5, structure: 5, vocabulary: 4, relevance: 5, total: 95 },
  },
];

export function TeacherPage() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<EssaySubmission[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<EssaySubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [subs, statsData] = await Promise.all([
          essayApi.getEssayList(),
          essayApi.getStats(),
        ]);
        setSubmissions(subs);
        setStats(statsData);
      } catch {
        setSubmissions(MOCK_SUBMISSIONS);
        setStats(MOCK_STATS);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF8E7]">
      <header className="bg-white/80 backdrop-blur-sm border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>

          <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users size={20} className="text-green-600" />
            教师端 · 批改管理
          </h1>

          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
            <BarChart3 size={16} />
            <span>班级统计</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#FF7043] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0 space-y-6">
              {stats && <StatsPanel stats={stats} />}
            </div>

            <aside className="w-full lg:w-80 flex-shrink-0">
              <SubmissionList
                submissions={submissions}
                selectedId={selectedSubmission?.id}
                onSelect={setSelectedSubmission}
              />
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default TeacherPage;
