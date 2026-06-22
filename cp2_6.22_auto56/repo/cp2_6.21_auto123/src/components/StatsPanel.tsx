import { useMemo } from 'react';
import { FileCode2, Braces, Terminal, Layout, Palette, Type, TrendingUp } from 'lucide-react';
import type { Snippet } from '@/types';

interface StatsPanelProps {
  snippets: Snippet[];
}

const LANGUAGE_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  javascript: { label: 'JavaScript', icon: <Braces size={16} />, color: '#f1fa8c', bg: 'rgba(241, 250, 140, 0.12)' },
  typescript: { label: 'TypeScript', icon: <Type size={16} />, color: '#8be9fd', bg: 'rgba(139, 233, 253, 0.12)' },
  python: { label: 'Python', icon: <Terminal size={16} />, color: '#bd93f9', bg: 'rgba(189, 147, 249, 0.12)' },
  html: { label: 'HTML', icon: <Layout size={16} />, color: '#ff79c6', bg: 'rgba(255, 121, 198, 0.12)' },
  css: { label: 'CSS', icon: <Palette size={16} />, color: '#50fa7b', bg: 'rgba(80, 250, 123, 0.12)' },
};

function isWithinLast7Days(dateStr: string): boolean {
  const date = new Date(dateStr);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  return date >= sevenDaysAgo;
}

export default function StatsPanel({ snippets }: StatsPanelProps) {
  const stats = useMemo(() => {
    const total = snippets.length;
    const recentCount = snippets.filter((s) => isWithinLast7Days(s.created_at)).length;
    const langCounts: Record<string, number> = {};
    for (const lang of Object.keys(LANGUAGE_META)) {
      langCounts[lang] = 0;
    }
    for (const s of snippets) {
      if (langCounts[s.language] !== undefined) {
        langCounts[s.language]++;
      }
    }
    return { total, recentCount, langCounts };
  }, [snippets]);

  return (
    <div className="w-full mb-6 animate-fadeIn">
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        }}
      >
        <div
          className="flex items-center gap-3 rounded-xl p-4 border"
          style={{
            backgroundColor: 'rgba(189, 147, 249, 0.08)',
            borderColor: 'rgba(189, 147, 249, 0.2)',
            transition: 'all var(--transition-base)',
          }}
        >
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ backgroundColor: 'rgba(189, 147, 249, 0.18)' }}
          >
            <FileCode2 size={18} style={{ color: '#bd93f9' }} />
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: '#bd93f9' }}>
              {stats.total}
            </div>
            <div className="text-xs" style={{ color: 'var(--border-color)' }}>
              总片段
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-3 rounded-xl p-4 border"
          style={{
            backgroundColor: 'rgba(80, 250, 123, 0.08)',
            borderColor: 'rgba(80, 250, 123, 0.2)',
            transition: 'all var(--transition-base)',
          }}
        >
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ backgroundColor: 'rgba(80, 250, 123, 0.18)' }}
          >
            <TrendingUp size={18} style={{ color: '#50fa7b' }} />
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: '#50fa7b' }}>
              {stats.recentCount}
            </div>
            <div className="text-xs" style={{ color: 'var(--border-color)' }}>
              近7天新增
            </div>
          </div>
        </div>

        {Object.entries(LANGUAGE_META).map(([lang, meta]) => (
          <div
            key={lang}
            className="flex items-center gap-3 rounded-xl p-4 border"
            style={{
              backgroundColor: meta.bg,
              borderColor: meta.color + '33',
              transition: 'all var(--transition-base)',
            }}
          >
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg"
              style={{ backgroundColor: meta.color + '22' }}
            >
              <span style={{ color: meta.color }}>{meta.icon}</span>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: meta.color }}>
                {stats.langCounts[lang]}
              </div>
              <div className="text-xs" style={{ color: 'var(--border-color)' }}>
                {meta.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
