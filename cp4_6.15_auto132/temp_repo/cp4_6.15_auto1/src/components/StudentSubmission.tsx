import { useState } from 'react';
import { useStore } from '@/store';
import { scoreAnswer } from '@/utils/scoring';
import type { ScoreRecord, ScoringResult } from '@/types';
import AnimatedNumber from './AnimatedNumber';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function StudentSubmission() {
  const { questions, addScoreRecord } = useStore();
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);
  const charCount = answer.length;
  const refLength = selectedQuestion?.referenceAnswer?.length || 0;
  const progressPercent = refLength > 0 ? Math.min((charCount / refLength) * 100, 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion || !answer.trim() || !studentName.trim()) return;

    const scoringResult = scoreAnswer(selectedQuestion, answer);

    const record: ScoreRecord = {
      id: generateId(),
      questionId: selectedQuestion.id,
      studentName: studentName.trim(),
      studentClass: studentClass.trim() || '未分班',
      studentAnswer: answer,
      ...scoringResult,
      scoredAt: new Date().toISOString(),
    };

    addScoreRecord(record);
    setResult(scoringResult);
    setSubmitted(true);
  };

  const handleReset = () => {
    setAnswer('');
    setResult(null);
    setSubmitted(false);
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#e0f7fa] rounded-full flex items-center justify-center">
          <AlertCircle size={28} className="text-[#80cbc4]" />
        </div>
        <p className="text-[#546e7a] text-sm">暂无题目，请先在题目管理中添加</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-[#00695c] mb-6">学生提交</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#546e7a] mb-1">姓名</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border rounded-lg border-[#b2dfdb] focus:border-[#00695c] focus:ring-1 focus:ring-[#00695c]/20 outline-none transition-all"
              placeholder="请输入姓名"
              disabled={submitted}
              style={{ minHeight: 44 }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#546e7a] mb-1">班级</label>
            <input
              type="text"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border rounded-lg border-[#b2dfdb] focus:border-[#00695c] focus:ring-1 focus:ring-[#00695c]/20 outline-none transition-all"
              placeholder="请输入班级"
              disabled={submitted}
              style={{ minHeight: 44 }}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#546e7a] mb-1">选择题目</label>
          <select
            value={selectedQuestionId}
            onChange={(e) => {
              setSelectedQuestionId(e.target.value);
              if (submitted) handleReset();
            }}
            className="w-full px-3 py-2.5 text-sm border rounded-lg border-[#b2dfdb] focus:border-[#00695c] focus:ring-1 focus:ring-[#00695c]/20 outline-none transition-all bg-white"
            style={{ minHeight: 44 }}
          >
            <option value="">请选择题目</option>
            {questions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.text.slice(0, 50)}{q.text.length > 50 ? '...' : ''}（满分{q.maxScore}）
              </option>
            ))}
          </select>
        </div>

        {selectedQuestion && (
          <div className="bg-[#e0f7fa]/40 rounded-lg p-4 border border-[#b2dfdb]/30">
            <p className="text-sm font-medium text-[#00695c] mb-1">题目</p>
            <p className="text-sm text-[#37474f]">{selectedQuestion.text}</p>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-[#546e7a]">简答内容</label>
            <span className="text-xs text-[#80cbc4]">
              {charCount} 字
              {refLength > 0 && ` / 参考答案 ${refLength} 字`}
            </span>
          </div>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={8}
            className="w-full px-3 py-2.5 text-sm border rounded-lg border-[#b2dfdb] focus:border-[#00695c] focus:ring-1 focus:ring-[#00695c]/20 outline-none transition-all resize-y"
            placeholder="请输入你的答案..."
            disabled={submitted}
          />
          {refLength > 0 && (
            <div className="mt-2 h-2 bg-[#e0f7fa] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#4db6ac] to-[#00695c] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {!submitted ? (
          <button
            type="submit"
            disabled={!selectedQuestion || !answer.trim() || !studentName.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00695c] text-white text-sm rounded-lg hover:bg-[#004d40] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            style={{ minHeight: 44 }}
          >
            <Send size={16} /> 提交答案
          </button>
        ) : (
          <div className="animate-fadeIn">
            <div className="bg-white rounded-xl border border-[#b2dfdb]/40 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle size={24} className="text-[#00695c]" />
                <span className="text-sm font-semibold text-[#00695c]">评分完成</span>
              </div>

              <div className="flex items-center justify-center mb-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-[#00695c]">
                    <AnimatedNumber value={result?.totalScore || 0} decimals={1} />
                  </div>
                  <div className="text-xs text-[#80cbc4] mt-1">
                    / {selectedQuestion?.maxScore} 分
                  </div>
                </div>
              </div>

              {result && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-[#e0f7fa]/40 rounded-lg">
                      <div className="text-xs text-[#546e7a] mb-1">关键词</div>
                      <div className="text-lg font-bold text-[#00695c]">
                        <AnimatedNumber value={result.keywordScore * 100} decimals={0} />
                        <span className="text-xs font-normal">%</span>
                      </div>
                    </div>
                    <div className="text-center p-3 bg-[#e0f7fa]/40 rounded-lg">
                      <div className="text-xs text-[#546e7a] mb-1">长度比</div>
                      <div className="text-lg font-bold text-[#00695c]">
                        <AnimatedNumber value={result.lengthScore * 100} decimals={0} />
                        <span className="text-xs font-normal">%</span>
                      </div>
                    </div>
                    <div className="text-center p-3 bg-[#e0f7fa]/40 rounded-lg">
                      <div className="text-xs text-[#546e7a] mb-1">语义相似</div>
                      <div className="text-lg font-bold text-[#00695c]">
                        <AnimatedNumber value={result.semanticScore * 100} decimals={0} />
                        <span className="text-xs font-normal">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#e0f7fa]/30 rounded-lg p-3">
                    <p className="text-xs font-medium text-[#546e7a] mb-1">评语</p>
                    <p className="text-sm text-[#37474f]">{result.feedback}</p>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="w-full mt-4 px-4 py-2.5 bg-white text-[#00695c] text-sm rounded-lg border border-[#b2dfdb] hover:bg-[#e0f7fa] hover:-translate-y-0.5 transition-all duration-200"
                style={{ minHeight: 44 }}
              >
                继续作答
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
