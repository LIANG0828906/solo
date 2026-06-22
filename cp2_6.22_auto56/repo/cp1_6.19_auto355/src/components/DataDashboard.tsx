import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Clock,
  Users,
  BarChart3,
  Calendar,
  X,
  Filter,
  Star,
} from 'lucide-react';
import { useSurveyStore } from '@/store/useSurveyStore';
import ChartCanvas from './ChartCanvas';
import type {
  SurveyResponse,
  PieChartDatum,
  BarChartDatum,
  LineChartDatum,
  Question,
} from '@/types';

const cardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  padding: 20,
};

const fadeInUpStyle = (index: number): React.CSSProperties => ({
  opacity: 0,
  animation: `fadeInUp 0.4s ease-out ${0.1 * index}s forwards`,
});

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}秒`;
  if (s === 0) return `${m}分钟`;
  return `${m}分${s}秒`;
}

function getAnswerDisplay(question: Question, value: string | string[] | number): string {
  if (question.type === 'rating') {
    return `${value} 星`;
  }
  if (Array.isArray(value)) {
    return value.join('、');
  }
  return String(value);
}

export default function DataDashboard() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const loadSurvey = useSurveyStore((s) => s.loadSurvey);
  const loadResponses = useSurveyStore((s) => s.loadResponses);
  const currentSurvey = useSurveyStore((s) => s.currentSurvey);
  const responses = useSurveyStore((s) => s.responses);
  const isLoading = useSurveyStore((s) => s.isLoading);
  const error = useSurveyStore((s) => s.error);

  const [timeRange, setTimeRange] = useState<{ start: string; end: string } | null>(null);
  const [barFilter, setBarFilter] = useState<{ questionId: string; option: string } | null>(null);

  useEffect(() => {
    if (surveyId) {
      loadSurvey(surveyId);
      loadResponses(surveyId);
    }
  }, [surveyId, loadSurvey, loadResponses]);

  const filteredResponses = useMemo(() => {
    let result = [...responses];

    if (timeRange) {
      result = result.filter((r) => {
        const dateLabel = formatDate(r.submittedAt);
        return dateLabel >= timeRange.start && dateLabel <= timeRange.end;
      });
    }

    if (barFilter) {
      result = result.filter((r) => {
        const answer = r.answers.find((a) => a.questionId === barFilter.questionId);
        if (!answer) return false;
        if (Array.isArray(answer.value)) {
          return answer.value.includes(barFilter.option);
        }
        return answer.value === barFilter.option;
      });
    }

    return result;
  }, [responses, timeRange, barFilter]);

  const avgCompletionTime = useMemo(() => {
    if (filteredResponses.length === 0) return 0;
    const total = filteredResponses.reduce((sum, r) => sum + r.completionTime, 0);
    return total / filteredResponses.length;
  }, [filteredResponses]);

  const lineChartData = useMemo((): LineChartDatum[] => {
    const dayMap = new Map<string, number>();
    responses.forEach((r) => {
      const label = formatDate(r.submittedAt);
      dayMap.set(label, (dayMap.get(label) || 0) + 1);
    });
    const sorted = Array.from(dayMap.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
    return sorted.map(([label, value]) => ({ label, value }));
  }, [responses]);

  const handleTimeRangeSelect = (startLabel: string, endLabel: string) => {
    setTimeRange({ start: startLabel, end: endLabel });
  };

  const resetTimeRange = () => {
    setTimeRange(null);
  };

  const clearBarFilter = () => {
    setBarFilter(null);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div style={cardStyle}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-sm text-gray-500">问卷标题</div>
                <div className="text-xl font-bold text-gray-900">{currentSurvey.title}</div>
                <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>创建时间：{formatDate(currentSurvey.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-sm text-gray-500">总回复数</div>
                <div className="text-4xl font-bold text-blue-500">{filteredResponses.length}</div>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-sm text-gray-500">平均完成时间</div>
                <div className="text-4xl font-bold text-gray-900">
                  {(avgCompletionTime / 60).toFixed(1)}
                  <span className="ml-1 text-lg font-normal text-gray-500">分钟</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-xl font-bold text-gray-900">题目统计</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {currentSurvey.questions.map((question, index) => (
                <div
                  key={question.id}
                  style={{ ...cardStyle, ...fadeInUpStyle(index) }}
                >
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">{question.title}</h3>
                    <span className="flex-shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {question.type === 'single'
                        ? '单选'
                        : question.type === 'multiple'
                          ? '多选'
                          : '评分'}
                    </span>
                  </div>
                  <QuestionChart
                    question={question}
                    responses={filteredResponses}
                    onBarClick={(option) =>
                      setBarFilter({ questionId: question.id, option })
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">回复时间趋势</h2>
              <button
                onClick={resetTimeRange}
                disabled={!timeRange}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  timeRange
                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    : 'text-gray-400'
                }`}
              >
                <X className="h-4 w-4" />
                重置时间范围
              </button>
            </div>
            <div style={cardStyle}>
              <div className="overflow-x-auto">
                <ChartCanvas
                  type="line"
                  data={lineChartData}
                  width={800}
                  height={280}
                  onTimeRangeSelect={handleTimeRangeSelect}
                />
              </div>
              {timeRange && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  <Filter className="h-4 w-4" />
                  当前时间范围：{timeRange.start} ~ {timeRange.end}
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                回复详情（共 {filteredResponses.length} 条）
              </h2>
              {barFilter && (
                <div className="inline-flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-1.5 text-sm text-orange-700">
                  <Filter className="h-4 w-4" />
                  当前筛选：{barFilter.option}
                  <button
                    onClick={clearBarFilter}
                    className="ml-1 rounded p-0.5 hover:bg-orange-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div style={cardStyle}>
              <ResponseTable
                questions={currentSurvey.questions}
                responses={filteredResponses}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function QuestionChart({
  question,
  responses,
  onBarClick,
}: {
  question: Question;
  responses: SurveyResponse[];
  onBarClick?: (option: string) => void;
}) {
  const pieData = useMemo((): PieChartDatum[] => {
    const countMap = new Map<string, number>();
    question.options?.forEach((o) => countMap.set(o, 0));
    responses.forEach((r) => {
      const answer = r.answers.find((a) => a.questionId === question.id);
      if (answer && typeof answer.value === 'string') {
        countMap.set(answer.value, (countMap.get(answer.value) || 0) + 1);
      }
    });
    return Array.from(countMap.entries()).map(([label, value]) => ({ label, value }));
  }, [question, responses]);

  const barData = useMemo((): BarChartDatum[] => {
    const countMap = new Map<string, number>();
    question.options?.forEach((o) => countMap.set(o, 0));
    responses.forEach((r) => {
      const answer = r.answers.find((a) => a.questionId === question.id);
      if (answer && Array.isArray(answer.value)) {
        answer.value.forEach((v) => {
          countMap.set(v, (countMap.get(v) || 0) + 1);
        });
      }
    });
    return Array.from(countMap.entries()).map(([label, value]) => ({ label, value }));
  }, [question, responses]);

  const { avg, distribution } = useMemo(() => {
    const ratingCounts = new Map<number, number>();
    let sum = 0;
    let count = 0;
    responses.forEach((r) => {
      const answer = r.answers.find((a) => a.questionId === question.id);
      if (answer && typeof answer.value === 'number') {
        sum += answer.value;
        count++;
        ratingCounts.set(answer.value, (ratingCounts.get(answer.value) || 0) + 1);
      }
    });
    const maxRating = question.maxRating || 5;
    const distribution: { stars: number; count: number }[] = [];
    for (let s = 1; s <= maxRating; s++) {
      distribution.push({ stars: s, count: ratingCounts.get(s) || 0 });
    }
    return { avg: count > 0 ? sum / count : 0, distribution };
  }, [question, responses]);

  if (question.type === 'single') {
    return (
      <div className="flex justify-center">
        <ChartCanvas type="pie" data={pieData} width={320} height={240} />
      </div>
    );
  }

  if (question.type === 'multiple') {
    return (
      <div className="overflow-x-auto">
        <ChartCanvas
          type="bar"
          data={barData}
          width={400}
          height={240}
          onBarClick={(_, datum) => onBarClick?.(datum.label)}
        />
      </div>
    );
  }

  if (question.type === 'rating') {
    const maxRating = question.maxRating || 5;
    const fullStars = Math.floor(avg);
    const hasHalf = avg - fullStars >= 0.5;

    return (
      <div>
        <div className="mb-4 flex items-center gap-3">
          <span className="text-4xl font-bold text-gray-900">{avg.toFixed(1)}</span>
          <div className="flex items-center">
            {Array.from({ length: maxRating }, (_, i) => i + 1).map((s) => (
              <Star
                key={s}
                size={22}
                fill={s <= fullStars || (s === fullStars + 1 && hasHalf) ? '#FFB300' : 'none'}
                stroke={s <= fullStars || (s === fullStars + 1 && hasHalf) ? '#FFB300' : '#ccc'}
                strokeWidth={2}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">平均分</span>
        </div>
        <div className="overflow-x-auto">
          <ChartCanvas type="rating" data={distribution} width={400} height={200} />
        </div>
      </div>
    );
  }

  return null;
}

function ResponseTable({
  questions,
  responses,
}: {
  questions: Question[];
  responses: SurveyResponse[];
}) {
  const displayCount = Math.min(responses.length, 200);
  const displayResponses = responses.slice(0, displayCount);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="border-b border-gray-200 px-3 py-3 text-left text-sm font-semibold text-gray-700">
              #
            </th>
            {questions.map((q) => (
              <th
                key={q.id}
                className="border-b border-gray-200 px-3 py-3 text-left text-sm font-semibold text-gray-700"
              >
                <div className="max-w-xs truncate" title={q.title}>
                  {q.title}
                </div>
              </th>
            ))}
            <th className="border-b border-gray-200 px-3 py-3 text-left text-sm font-semibold text-gray-700">
              提交时间
            </th>
            <th className="border-b border-gray-200 px-3 py-3 text-left text-sm font-semibold text-gray-700">
              用时
            </th>
          </tr>
        </thead>
        <tbody>
          {displayResponses.map((r, idx) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="border-b border-gray-100 px-3 py-2.5 text-sm text-gray-500">
                {idx + 1}
              </td>
              {questions.map((q) => {
                const answer = r.answers.find((a) => a.questionId === q.id);
                return (
                  <td
                    key={q.id}
                    className="border-b border-gray-100 px-3 py-2.5 text-sm text-gray-700"
                  >
                    <div className="max-w-xs truncate" title={answer ? getAnswerDisplay(q, answer.value) : ''}>
                      {answer ? getAnswerDisplay(q, answer.value) : '-'}
                    </div>
                  </td>
                );
              })}
              <td className="border-b border-gray-100 px-3 py-2.5 text-sm text-gray-500">
                {formatDateTime(r.submittedAt)}
              </td>
              <td className="border-b border-gray-100 px-3 py-2.5 text-sm text-gray-500">
                {formatDuration(r.completionTime)}
              </td>
            </tr>
          ))}
          {displayResponses.length === 0 && (
            <tr>
              <td
                colSpan={questions.length + 3}
                className="px-3 py-8 text-center text-gray-400"
              >
                暂无回复数据
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {responses.length > 200 && (
        <div className="mt-3 text-sm text-gray-500">
          仅显示前 200 条，共 {responses.length} 条回复
        </div>
      )}
    </div>
  );
}
