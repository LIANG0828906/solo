import { FileText, Clock } from 'lucide-react';
import type { EssaySubmission } from '@/types';
import { SCORE_COLORS, getScoreLevel } from '@/types';

interface SubmissionListProps {
  submissions: EssaySubmission[];
  onSelect?: (submission: EssaySubmission) => void;
  selectedId?: string;
}

export function SubmissionList({
  submissions,
  onSelect,
  selectedId,
}: SubmissionListProps) {
  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
        <FileText className="mx-auto text-gray-300 mb-3" size={48} />
        <p className="text-gray-500">暂无提交记录</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <FileText size={18} className="text-blue-500" />
          提交列表
          <span className="ml-auto text-sm font-normal text-gray-500">
            共 {submissions.length} 篇
          </span>
        </h3>
      </div>

      <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
        {submissions.map((submission) => {
          const level = getScoreLevel(submission.scores.total);
          const isSelected = submission.id === selectedId;

          return (
            <button
              key={submission.id}
              onClick={() => onSelect?.(submission)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                isSelected ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-800 truncate">
                    {submission.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>
                      {new Date(submission.submittedAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs text-gray-500">
                      错误 {submission.errors.length} 处
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {submission.content.length} 字
                    </span>
                  </div>
                </div>

                <div
                  className="text-xl font-bold"
                  style={{ color: SCORE_COLORS[level] }}
                >
                  {submission.scores.total}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SubmissionList;
