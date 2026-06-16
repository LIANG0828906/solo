import { useNavigate } from 'react-router-dom';
import { usePodcastStore, type ProgramStatus } from '@/store';
import { Eye, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const STATUS_LABELS: Record<ProgramStatus, string> = {
  draft: '草稿',
  recording: '录制中',
  editing: '剪辑中',
  published: '已发布',
};

export default function PreviewSelect() {
  const { programs } = usePodcastStore();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (e: React.MouseEvent, programId: string) => {
    e.stopPropagation();
    const link = `${window.location.origin}/preview/${programId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(programId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-slate-800">预览管理</h1>
        <p className="text-sm text-slate-400 mt-1">选择节目生成发布预告页面</p>
      </div>

      {programs.length === 0 && (
        <div className="card-base text-center py-16">
          <div className="text-6xl mb-4">👁️</div>
          <h3 className="font-display font-semibold text-lg text-slate-600 mb-2">暂无节目</h3>
          <p className="text-sm text-slate-400">先创建节目后即可生成预览页面</p>
        </div>
      )}

      <div className="space-y-3">
        {programs.map((program) => {
          const statusColor =
            program.status === 'draft' ? '#94a3b8' :
            program.status === 'recording' ? '#3b82f6' :
            program.status === 'editing' ? '#f59e0b' : '#22c55e';

          return (
            <div
              key={program.id}
              onClick={() => navigate(`/preview/${program.id}`)}
              className="card-base flex items-center gap-4 cursor-pointer group hover:shadow-md transition-shadow"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${
                    program.status === 'draft' ? '#94a3b8, #64748b' :
                    program.status === 'recording' ? '#3b82f6, #6366f1' :
                    program.status === 'editing' ? '#f59e0b, #f97316' : '#22c55e, #10b981'
                  })`,
                }}
              >
                {program.title.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-sm text-slate-800 truncate">
                  {program.title}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
                  >
                    {STATUS_LABELS[program.status]}
                  </span>
                  {program.publishDate && (
                    <span className="text-[10px] text-slate-300">发布: {program.publishDate}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleCopyLink(e, program.id)}
                  className="btn-press p-2 rounded-md bg-slate-100 text-slate-500 hover:text-accent"
                  title="复制预览链接"
                >
                  {copiedId === program.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/preview/${program.id}`);
                  }}
                  className="btn-press p-2 rounded-md bg-slate-100 text-slate-500 hover:text-accent"
                  title="查看预览"
                >
                  <Eye size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
