import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { usePodcastStore, type ProgramStatus } from '@/store';

const STATUS_LABELS: Record<ProgramStatus, string> = {
  draft: '草稿',
  recording: '录制中',
  editing: '剪辑中',
  published: '已发布',
};

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { programs, guests } = usePodcastStore();
  const program = programs.find((p) => p.id === id);

  const [daysLeft, setDaysLeft] = useState(0);
  const [hoursLeft, setHoursLeft] = useState(0);
  const [minutesLeft, setMinutesLeft] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!program?.publishDate) return;
    const calc = () => {
      const diff = new Date(program.publishDate).getTime() - Date.now();
      if (diff <= 0) {
        setDaysLeft(0);
        setHoursLeft(0);
        setMinutesLeft(0);
        setSecondsLeft(0);
        return;
      }
      setDaysLeft(Math.floor(diff / (1000 * 60 * 60 * 24)));
      setHoursLeft(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      setMinutesLeft(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
      const newSec = Math.floor((diff % (1000 * 60)) / 1000);
      if (newSec !== secondsLeft) setAnimKey((k) => k + 1);
      setSecondsLeft(newSec);
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [program?.publishDate, secondsLeft]);

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1a2e' }}>
        <div className="text-center">
          <h3 className="font-display font-semibold text-lg text-slate-400 mb-4">节目不存在</h3>
          <button onClick={() => navigate('/')} className="btn-press px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const linkedGuests = guests.filter((g) => program.guestIds.includes(g.id));
  const initial = program.title.charAt(0).toUpperCase();
  const gradientAngle = Math.abs(program.title.charCodeAt(0) % 360);
  const gradientColors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];
  const c1 = gradientColors[program.title.length % gradientColors.length];
  const c2 = gradientColors[(program.title.length + 2) % gradientColors.length];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isZero = daysLeft === 0 && hoursLeft === 0 && minutesLeft === 0 && secondsLeft === 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: '#1a1a2e' }}>
      <div className="max-w-md w-full space-y-8 text-center animate-fade-in">
        <svg
          width="160"
          height="160"
          viewBox="0 0 160 160"
          className="mx-auto"
        >
          <defs>
            <linearGradient id="coverGrad" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform={`rotate(${gradientAngle})`}>
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
          </defs>
          <rect width="160" height="160" rx="24" fill="url(#coverGrad)" />
          <text
            x="80"
            y="95"
            textAnchor="middle"
            fill="white"
            fontSize="72"
            fontWeight="800"
            fontFamily="Outfit, sans-serif"
          >
            {initial}
          </text>
        </svg>

        <div>
          <h1 className="font-display font-bold text-2xl text-gray-200 mb-2">{program.title}</h1>
          <span
            className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full"
            style={{
              backgroundColor:
                program.status === 'draft' ? 'rgba(148,163,184,0.15)' :
                program.status === 'recording' ? 'rgba(59,130,246,0.15)' :
                program.status === 'editing' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
              color:
                program.status === 'draft' ? '#94a3b8' :
                program.status === 'recording' ? '#3b82f6' :
                program.status === 'editing' ? '#f59e0b' : '#22c55e',
            }}
          >
            {STATUS_LABELS[program.status]}
          </span>
        </div>

        {program.description && (
          <p className="text-sm text-gray-400 leading-relaxed">{program.description}</p>
        )}

        {linkedGuests.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs text-gray-500 font-medium">本期嘉宾</h3>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {linkedGuests.map((guest) => (
                <div key={guest.id} className="flex flex-col items-center gap-1">
                  {guest.avatarUrl ? (
                    <img src={guest.avatarUrl} alt={guest.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: guest.color }}
                    >
                      {guest.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[10px] text-gray-400">{guest.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {program.publishDate && (
          <div className="space-y-3 pt-4">
            <h3 className="text-xs text-gray-500 font-medium">
              {isZero ? '🎉 已发布！' : '距离发布'}
            </h3>
            <div className="flex items-center justify-center gap-3">
              {[
                { value: daysLeft, label: '天' },
                { value: hoursLeft, label: '时' },
                { value: minutesLeft, label: '分' },
                { value: secondsLeft, label: '秒' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="bg-white/5 rounded-lg px-4 py-3 min-w-[56px]">
                    <span
                      key={animKey + i}
                      className="font-display font-extrabold text-3xl text-gray-200 inline-block animate-scale-bounce"
                    >
                      {String(item.value).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleCopyLink}
          className="btn-press inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/15"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? '链接已复制' : '复制链接分享'}
        </button>

        <div>
          <button
            onClick={() => navigate('/')}
            className="btn-press inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
          >
            <ArrowLeft size={12} />
            返回管理
          </button>
        </div>
      </div>
    </div>
  );
}
