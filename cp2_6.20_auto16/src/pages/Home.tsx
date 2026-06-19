import { BookOpen, Sparkles, Feather, Calendar } from 'lucide-react';
import { useStore } from '../store';
import Portfolio from '../community/Portfolio';

export default function Home() {
  const currentUser = useStore((s) => s.currentUser);
  const poems = useStore((s) => s.poems);
  const collections = useStore((s) => s.collections);
  const inspirationCards = useStore((s) => s.inspirationCards);

  const today = new Date();
  const lunarDay = `今日宜作诗`;
  const dateStr = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const stats = [
    {
      label: '诗作',
      value: poems.length,
      icon: Feather,
      color: 'text-bark-400',
      bg: 'bg-bark-50',
      border: 'border-bark-200',
    },
    {
      label: '诗集',
      value: collections.length,
      icon: BookOpen,
      color: 'text-jade-400',
      bg: 'bg-jade-50',
      border: 'border-jade-200',
    },
    {
      label: '灵感',
      value: inspirationCards.length,
      icon: Sparkles,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
  ];

  return (
    <div className="min-h-screen bg-rice-200">
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse at 20% 0%, rgba(166, 124, 82, 0.25) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 100%, rgba(168, 221, 210, 0.25) 0%, transparent 50%)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-10 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bark-100 border border-bark-200 mb-6">
              <Calendar className="w-3.5 h-3.5 text-bark-400" />
              <span className="text-xs text-bark-400 font-serif">{dateStr}</span>
              <span className="mx-1 text-bark-200">·</span>
              <span className="text-xs text-jade-500 font-serif font-medium">{lunarDay}</span>
            </div>

            <h1 className="font-wenkai text-4xl md:text-5xl font-bold text-ink-500 mb-4 tracking-wide">
              欢迎回来，
              <span className="text-bark-500 relative inline-block">
                {currentUser.name}
                <span className="absolute -bottom-1 left-0 right-0 h-1 bg-bark-200 rounded-full opacity-60" />
              </span>
            </h1>
            <p className="text-ink-200 font-serif text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              笔墨纸砚已备，且将胸中丘壑，化作纸上烟霞。
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-2xl mx-auto">
            {stats.map((s, idx) => (
              <div
                key={s.label}
                className={`${s.bg} ${s.border} border rounded-xl p-4 md:p-5 ink-brush-shadow animate-fade-in-up`}
                style={{ animationDelay: `${idx * 80 + 100}ms` }}
              >
                <div className={`${s.bg} w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-3`}>
                  <s.icon className={`w-5 h-5 md:w-6 md:h-6 ${s.color}`} />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-ink-500 font-wenkai mb-1">
                  {s.value}
                </div>
                <div className="text-xs md:text-sm text-ink-200 font-serif">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        <Portfolio />
      </div>
    </div>
  );
}
