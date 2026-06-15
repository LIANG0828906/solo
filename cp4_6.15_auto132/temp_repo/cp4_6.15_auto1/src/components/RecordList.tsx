import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { saveAs } from 'file-saver';
import { Download, Filter } from 'lucide-react';

export default function RecordList() {
  const { questions, scoreRecords } = useStore();
  const [filterStudent, setFilterStudent] = useState<string>('all');
  const [filterQuestion, setFilterQuestion] = useState<string>('all');

  const students = useMemo(
    () => Array.from(new Set(scoreRecords.map((r) => r.studentName))),
    [scoreRecords]
  );

  const filtered = useMemo(() => {
    let recs = scoreRecords;
    if (filterStudent !== 'all') recs = recs.filter((r) => r.studentName === filterStudent);
    if (filterQuestion !== 'all') recs = recs.filter((r) => r.questionId === filterQuestion);
    return recs.sort((a, b) => new Date(b.scoredAt).getTime() - new Date(a.scoredAt).getTime());
  }, [scoreRecords, filterStudent, filterQuestion]);

  const handleExportCSV = () => {
    const header = '原题,满分,学生姓名,班级,学生答案,总分,得分率,关键词得分,长度得分,语义得分,评语,评分时间';
    const rows = filtered.map((r) => {
      const q = questions.find((item) => item.id === r.questionId);
      const maxScore = q?.maxScore || 10;
      const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
      const keywordActual = Math.round(r.keywordScore * maxScore * 0.5 * 100) / 100;
      const lengthActual = Math.round(Math.min(r.lengthScore, 1) * maxScore * 0.2 * 100) / 100;
      const semanticActual = Math.round(r.semanticScore * maxScore * 0.3 * 100) / 100;
      const scoreRate = Math.round((r.totalScore / maxScore) * 1000) / 10;
      return [
        escape(q?.text || ''),
        maxScore,
        escape(r.studentName),
        escape(r.studentClass),
        escape(r.studentAnswer),
        r.totalScore,
        `${scoreRate}%`,
        keywordActual,
        lengthActual,
        semanticActual,
        escape(r.feedback),
        new Date(r.scoredAt).toLocaleString('zh-CN'),
      ].join(',');
    });
    const csv = '\uFEFF' + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `评分记录_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  if (scoreRecords.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#e0f7fa] rounded-full flex items-center justify-center">
          <Filter size={28} className="text-[#80cbc4]" />
        </div>
        <p className="text-[#546e7a] text-sm">暂无评分记录</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#00695c]">评分记录</h2>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#00695c] text-white text-sm rounded-lg hover:bg-[#004d40] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
          style={{ minHeight: 44 }}
        >
          <Download size={16} /> 导出CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={filterStudent}
          onChange={(e) => setFilterStudent(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg border-[#b2dfdb] focus:border-[#00695c] outline-none bg-white"
          style={{ minHeight: 44 }}
        >
          <option value="all">全部学生</option>
          {students.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterQuestion}
          onChange={(e) => setFilterQuestion(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg border-[#b2dfdb] focus:border-[#00695c] outline-none bg-white"
          style={{ minHeight: 44 }}
        >
          <option value="all">全部题目</option>
          {questions.map((q) => (
            <option key={q.id} value={q.id}>{q.text.slice(0, 30)}</option>
          ))}
        </select>
        <span className="flex items-center text-xs text-[#80cbc4]">
          共 {filtered.length} 条记录
        </span>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const q = questions.find((q) => q.id === r.questionId);
          return (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-[#b2dfdb]/40 shadow-sm p-4 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-medium text-[#37474f]">
                    {q?.text || '已删除的题目'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#546e7a]">{r.studentName}</span>
                    <span className="text-xs text-[#80cbc4]">·</span>
                    <span className="text-xs text-[#546e7a]">{r.studentClass}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-bold text-[#00695c]">{r.totalScore}</div>
                  <div className="text-xs text-[#80cbc4]">/ {q?.maxScore || 10}</div>
                </div>
              </div>

              <div className="mb-2">
                <p className="text-xs text-[#546e7a] mb-1">学生答案</p>
                <p className="text-sm text-[#37474f] bg-[#e0f7fa]/30 rounded-lg p-2.5 line-clamp-3">
                  {r.studentAnswer}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="text-center bg-[#e0f7fa]/20 rounded-lg py-1.5">
                  <div className="text-xs text-[#546e7a]">关键词</div>
                  <div className="text-sm font-semibold text-[#00695c]">{(r.keywordScore * 100).toFixed(0)}%</div>
                </div>
                <div className="text-center bg-[#e0f7fa]/20 rounded-lg py-1.5">
                  <div className="text-xs text-[#546e7a]">长度</div>
                  <div className="text-sm font-semibold text-[#00695c]">{(r.lengthScore * 100).toFixed(0)}%</div>
                </div>
                <div className="text-center bg-[#e0f7fa]/20 rounded-lg py-1.5">
                  <div className="text-xs text-[#546e7a]">语义</div>
                  <div className="text-sm font-semibold text-[#00695c]">{(r.semanticScore * 100).toFixed(0)}%</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-[#546e7a]">{r.feedback}</p>
                <span className="text-xs text-[#80cbc4] shrink-0 ml-2">
                  {new Date(r.scoredAt).toLocaleString('zh-CN')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
