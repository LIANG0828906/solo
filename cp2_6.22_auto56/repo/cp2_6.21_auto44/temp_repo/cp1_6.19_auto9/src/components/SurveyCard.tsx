import { Survey } from '@/utils/questionTypes';
import { FileText, MessageSquare, Calendar } from 'lucide-react';

interface SurveyCardProps {
  survey: Survey;
  responseCount: number;
  onClick: () => void;
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function SurveyCard({ survey, responseCount, onClick }: SurveyCardProps) {
  return (
    <div
      className="card card-hover cursor-pointer overflow-hidden fade-in"
      onClick={onClick}
    >
      <div className="h-1 w-full" style={{ backgroundColor: '#1E88E5' }} />
      <div className="p-5">
        <h3
          className="text-lg font-semibold truncate mb-2"
          style={{ color: 'var(--color-text)' }}
        >
          {survey.title}
        </h3>
        <p
          className="text-sm mb-4 line-clamp-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {survey.description}
        </p>

        <div className="flex gap-2 mb-4 flex-wrap">
          <span className="badge badge-primary">
            <FileText className="w-3 h-3 mr-1" />
            {survey.questions.length} 个问题
          </span>
          <span className="badge badge-gray">
            <MessageSquare className="w-3 h-3 mr-1" />
            {responseCount} 条回复
          </span>
        </div>

        <div
          className="flex items-center gap-1.5 text-xs pt-3 border-t"
          style={{
            color: 'var(--color-text-secondary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>创建于 {formatDate(survey.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
