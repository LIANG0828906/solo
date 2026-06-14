import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import TagCloud from 'react-tagcloud';
import type { ScoreRecord, Question } from '@/types';

type Dimension = 'class' | 'question' | 'student';

function getQuestionText(questions: Question[], id: string) {
  const q = questions.find((item) => item.id === id);
  return q ? (q.text.length > 20 ? q.text.slice(0, 20) + '...' : q.text) : '未知题目';
}

function extractMissedKeywords(records: ScoreRecord[], questions: Question[]) {
  const freq = new Map<string, number>();
  for (const r of records) {
    const q = questions.find((item) => item.id === r.questionId);
    if (!q) continue;
    const lower = r.studentAnswer.toLowerCase();
    for (const kw of q.keywords) {
      if (!lower.includes(kw.word.toLowerCase())) {
        freq.set(kw.word, (freq.get(kw.word) || 0) + 1);
      }
    }
  }
  return Array.from(freq.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
}

export default function AnalyticsDashboard() {
  const { questions, scoreRecords } = useStore();
  const [dimension, setDimension] = useState<Dimension>('class');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedQuestion, setSelectedQuestion] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');

  const classes = useMemo(
    () => Array.from(new Set(scoreRecords.map((r) => r.studentClass))),
    [scoreRecords]
  );

  const students = useMemo(
    () => Array.from(new Set(scoreRecords.map((r) => r.studentName))),
    [scoreRecords]
  );

  const filteredRecords = useMemo(() => {
    let recs = scoreRecords;
    if (selectedClass !== 'all') recs = recs.filter((r) => r.studentClass === selectedClass);
    if (selectedQuestion !== 'all') recs = recs.filter((r) => r.questionId === selectedQuestion);
    if (selectedStudent !== 'all') recs = recs.filter((r) => r.studentName === selectedStudent);
    return recs;
  }, [scoreRecords, selectedClass, selectedQuestion, selectedStudent]);

  const barData = useMemo(() => {
    if (dimension === 'class') {
      const grouped = new Map<string, { sum: number; count: number }>();
      for (const r of filteredRecords) {
        const g = grouped.get(r.studentClass) || { sum: 0, count: 0 };
        g.sum += r.totalScore;
        g.count += 1;
        grouped.set(r.studentClass, g);
      }
      return Array.from(grouped.entries()).map(([name, { sum, count }]) => ({
        name,
        average: Math.round((sum / count) * 10) / 10,
        count,
      }));
    }
    if (dimension === 'question') {
      const grouped = new Map<string, { sum: number; count: number; maxScore: number }>();
      for (const r of filteredRecords) {
        const q = questions.find((item) => item.id === r.questionId);
        const g = grouped.get(r.questionId) || { sum: 0, count: 0, maxScore: q?.maxScore || 10 };
        g.sum += r.totalScore;
        g.count += 1;
        grouped.set(r.questionId, g);
      }
      return Array.from(grouped.entries()).map(([id, { sum, count, maxScore }]) => ({
        name: getQuestionText(questions, id),
        average: Math.round((sum / count) * 10) / 10,
        rate: Math.round((sum / count / maxScore) * 1000) / 10,
        count,
      }));
    }
    const grouped = new Map<string, { sum: number; count: number }>();
    for (const r of filteredRecords) {
      const g = grouped.get(r.studentName) || { sum: 0, count: 0 };
      g.sum += r.totalScore;
      g.count += 1;
      grouped.set(r.studentName, g);
    }
    return Array.from(grouped.entries()).map(([name, { sum, count }]) => ({
      name,
      average: Math.round((sum / count) * 10) / 10,
      count,
    }));
  }, [dimension, filteredRecords, questions]);

  const lineData = useMemo(() => {
    const sorted = [...filteredRecords].sort(
      (a, b) => new Date(a.scoredAt).getTime() - new Date(b.scoredAt).getTime()
    );
    return sorted.map((r, i) => ({
      name: `#${i + 1}`,
      score: r.totalScore,
      student: r.studentName,
    }));
  }, [filteredRecords]);

  const cloudData = useMemo(
    () => extractMissedKeywords(filteredRecords, questions),
    [filteredRecords, questions]
  );

  const detailRecords = useMemo(() => {
    return filteredRecords
      .sort((a, b) => new Date(b.scoredAt).getTime() - new Date(a.scoredAt).getTime())
      .slice(0, 20);
  }, [filteredRecords]);

  if (scoreRecords.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#e0f7fa] rounded-full flex items-center justify-center">
          <BarChart3 size={28} className="text-[#80cbc4]" />
        </div>
        <p className="text-[#546e7a] text-sm">暂无评分数据，请先提交答案</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="w-full lg:w-52 shrink-0 space-y-4">
        <div className="bg-white rounded-xl border border-[#b2dfdb]/40 shadow-sm p-4">
          <h3 className="text-xs font-semibold text-[#00695c] mb-3">分析维度</h3>
          <div className="space-y-1">
            {([
              ['class', '按班级'],
              ['question', '按题目'],
              ['student', '按学生'],
            ] as [Dimension, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setDimension(key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  dimension === key
                    ? 'bg-[#00695c] text-white shadow-sm'
                    : 'text-[#546e7a] hover:bg-[#e0f7fa]'
                }`}
                style={{ minHeight: 44 }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#b2dfdb]/40 shadow-sm p-4">
          <h3 className="text-xs font-semibold text-[#00695c] mb-3">筛选</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#546e7a]">班级</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-sm border rounded-lg border-[#b2dfdb] focus:border-[#00695c] outline-none bg-white"
                style={{ minHeight: 44 }}
              >
                <option value="all">全部</option>
                {classes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#546e7a]">题目</label>
              <select
                value={selectedQuestion}
                onChange={(e) => setSelectedQuestion(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-sm border rounded-lg border-[#b2dfdb] focus:border-[#00695c] outline-none bg-white"
                style={{ minHeight: 44 }}
              >
                <option value="all">全部</option>
                {questions.map((q) => (
                  <option key={q.id} value={q.id}>{q.text.slice(0, 30)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#546e7a]">学生</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-sm border rounded-lg border-[#b2dfdb] focus:border-[#00695c] outline-none bg-white"
                style={{ minHeight: 44 }}
              >
                <option value="all">全部</option>
                {students.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        <div key={`bar-${dimension}`} className="bg-white rounded-xl border border-[#b2dfdb]/40 shadow-sm p-5 animate-fadeIn">
          <h3 className="text-sm font-semibold text-[#00695c] mb-4">平均分分布</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0f7fa" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#546e7a' }} />
                <YAxis tick={{ fontSize: 11, fill: '#546e7a' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #b2dfdb',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="average" fill="#00897b" radius={[4, 4, 0, 0]} name="平均分" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[#80cbc4] text-center py-8">无数据</p>
          )}
        </div>

        <div key={`line-${dimension}`} className="bg-white rounded-xl border border-[#b2dfdb]/40 shadow-sm p-5 animate-fadeIn">
          <h3 className="text-sm font-semibold text-[#00695c] mb-4">得分趋势</h3>
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0f7fa" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#546e7a' }} />
                <YAxis tick={{ fontSize: 11, fill: '#546e7a' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #b2dfdb',
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="score" stroke="#00695c" strokeWidth={2} dot={{ fill: '#00695c', r: 3 }} name="得分" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[#80cbc4] text-center py-8">无数据</p>
          )}
        </div>

        <div key={`cloud-${dimension}`} className="bg-white rounded-xl border border-[#b2dfdb]/40 shadow-sm p-5 animate-fadeIn">
          <h3 className="text-sm font-semibold text-[#00695c] mb-4">常见错误关键词</h3>
          {cloudData.length > 0 ? (
            <div className="flex justify-center">
              <TagCloud
                tags={cloudData}
                minSize={14}
                maxSize={36}
                colorOptions={{
                  luminosity: 'dark',
                  hue: 'teal',
                }}
                style={{
                  textAlign: 'center',
                  lineHeight: 2.2,
                }}
              />
            </div>
          ) : (
            <p className="text-sm text-[#80cbc4] text-center py-8">无遗漏关键词数据</p>
          )}
        </div>
      </div>

      <div className="w-full lg:w-72 shrink-0">
        <div key={`detail-${dimension}`} className="bg-white rounded-xl border border-[#b2dfdb]/40 shadow-sm p-4 animate-fadeIn">
          <h3 className="text-sm font-semibold text-[#00695c] mb-3">评分详情</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {detailRecords.length > 0 ? (
              detailRecords.map((r) => (
                <div key={r.id} className="p-3 bg-[#e0f7fa]/30 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[#00695c]">
                      {r.studentName}
                    </span>
                    <span className="text-sm font-bold text-[#00695c]">
                      {r.totalScore}
                    </span>
                  </div>
                  <p className="text-xs text-[#546e7a] mb-1 line-clamp-2">
                    {r.studentAnswer.slice(0, 60)}...
                  </p>
                  <p className="text-xs text-[#80cbc4]">
                    {new Date(r.scoredAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#80cbc4] text-center py-4">无记录</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
