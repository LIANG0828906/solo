import { ChevronDown, ChevronUp, Lightbulb, MapPin } from 'lucide-react';
import type { BadSmell, Severity } from '@/types';
import { useAppStore } from '@/store';

interface BadSmellCardProps {
  smell: BadSmell;
  index: number;
}

const severityConfig: Record<Severity, { bar: string; label: string; bg: string; text: string }> = {
  high: {
    bar: '#EF4444',
    label: '严重',
    bg: 'bg-red-500/20',
    text: 'text-red-400',
  },
  medium: {
    bar: '#F59E0B',
    label: '中等',
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
  },
  low: {
    bar: '#10B981',
    label: '低',
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
  },
};

export default function BadSmellCard({ smell, index }: BadSmellCardProps) {
  const selectedSmellId = useAppStore((s) => s.selectedSmellId);
  const expandedSmellIds = useAppStore((s) => s.expandedSmellIds);
  const selectSmell = useAppStore((s) => s.selectSmell);
  const toggleExpand = useAppStore((s) => s.toggleExpand);

  const config = severityConfig[smell.severity];
  const isSelected = selectedSmellId === smell.id;
  const isExpanded = expandedSmellIds.has(smell.id);

  const handleCardClick = () => {
    selectSmell(smell.id);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpand(smell.id);
  };

  return (
    <div
      className="w-full max-w-[320px] rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02]"
      style={{
        backgroundColor: '#334155',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        transform: 'translateX(60px)',
        opacity: 0,
        animation: `slideIn 0.4s ease forwards`,
        animationDelay: `${index * 60}ms`,
        outline: isSelected ? '2px solid #60A5FA' : 'none',
      }}
      onClick={handleCardClick}
    >
      <div
        className="h-1 rounded-t-xl"
        style={{ backgroundColor: config.bar, borderRadius: '12px 12px 0 0' }}
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-white font-semibold text-base leading-tight flex-1">
            {smell.name}
          </h3>
          <button
            onClick={handleToggleExpand}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-600/50 flex-shrink-0"
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
          >
            {config.label}
          </span>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <MapPin size={12} />
            <span>
              第 {smell.position.startLine}
              {smell.position.endLine !== smell.position.startLine
                ? `-${smell.position.endLine}`
                : ''}{' '}
              行
            </span>
          </div>
        </div>

        <div
          className="overflow-hidden transition-all duration-300"
          style={{
            maxHeight: isExpanded ? '2000px' : '0px',
            opacity: isExpanded ? 1 : 0,
          }}
        >
          <div className="pt-2 space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed">
              {smell.description}
            </p>

            <div
              className="rounded-lg p-3 overflow-x-auto"
              style={{ backgroundColor: '#0F172A', borderRadius: '8px' }}
            >
              <pre className="text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
                <code>{smell.codeSnippet}</code>
              </pre>
            </div>

            <div className="flex gap-2 items-start bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <Lightbulb
                size={16}
                className="text-blue-400 flex-shrink-0 mt-0.5"
              />
              <p className="text-slate-300 text-sm leading-relaxed">
                {smell.suggestion}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(60px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
