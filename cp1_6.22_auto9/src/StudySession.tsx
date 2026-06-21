import { useFlashcardStore } from "@/store";
import type { Rating } from "@/spacedRepetition";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  format,
  parseISO,
} from "date-fns";
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Calendar,
  Sparkles,
  Brain,
  Zap,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

const RATING_CONFIG: Record<Rating, { label: string; classes: string; icon: typeof Zap }> = {
  easy: { label: "简单", classes: "bg-gradient-to-r from-emerald-500 to-green-400 shadow-emerald-500/30", icon: Zap },
  medium: { label: "中等", classes: "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-amber-500/30", icon: Brain },
  hard: { label: "困难", classes: "bg-gradient-to-r from-rose-500 to-red-400 shadow-rose-500/30", icon: Sparkles },
};

export default function StudySession() {
  const navigate = useNavigate();
  const { getDueCards, reviewCard, cards } = useFlashcardStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const dueCards = useMemo(() => getDueCards(), [cards]);
  const isComplete = currentIndex >= dueCards.length && dueCards.length > 0;
  const currentCard = dueCards[currentIndex] ?? null;

  const reviewDays = useMemo(() => {
    const days = new Set<string>();
    cards.forEach((c) => {
      const d = parseISO(c.nextReview);
      if (isSameMonth(d, calendarMonth)) {
        days.add(format(d, "yyyy-MM-dd"));
      }
    });
    return days;
  }, [cards, calendarMonth]);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    const allDays = eachDayOfInterval({ start, end });
    const leadingEmpty = getDay(start);
    return { allDays, leadingEmpty };
  }, [calendarMonth]);

  const handleFlip = useCallback(() => {
    if (!isFlipped && !isAnimating) setIsFlipped(true);
  }, [isFlipped, isAnimating]);

  const handleRate = useCallback(
    (rating: Rating) => {
      if (!currentCard || isAnimating) return;
      reviewCard(currentCard.id, rating);
      setIsAnimating(true);
      setTimeout(() => {
        setIsFlipped(false);
        setCurrentIndex((i) => i + 1);
        setIsAnimating(false);
      }, 300);
    },
    [currentCard, isAnimating, reviewCard]
  );

  const progress = dueCards.length > 0 ? ((currentIndex) / dueCards.length) * 100 : 0;

  if (dueCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 animate-fade-in px-4">
        <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-gradient">暂无待复习卡片</h2>
        <p className="text-gray-400 text-center">所有卡片都已复习完毕，休息一下吧</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/30 btn-spring"
        >
          返回首页
        </button>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 animate-fade-in px-4">
        <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center animate-float">
          <Trophy className="w-12 h-12 text-amber-400" />
        </div>
        <h2 className="text-3xl font-bold text-gradient">恭喜完成!</h2>
        <div className="glass-card p-6 rounded-2xl text-center space-y-2">
          <p className="text-lg">本次复习 <span className="font-bold text-indigo-300">{dueCards.length}</span> 张卡片</p>
          <p className="text-gray-400">继续保持，记忆会更牢固</p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/30 btn-spring"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>第 {currentIndex + 1} 张 / 共 {dueCards.length} 张</span>
        <button
          onClick={() => { setIsFlipped(false); }}
          className="flex items-center gap-1 hover:text-indigo-300 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          翻回
        </button>
      </div>

      <div className="flip-card mx-auto" style={{ maxWidth: 480, aspectRatio: "3/4" }}>
        <div
          className={`flip-card-inner ${isFlipped ? "flipped" : ""}`}
          onClick={handleFlip}
        >
          <div className="flip-card-front glass-card glow-border animate-float flex items-center justify-center p-8 cursor-pointer" style={{ zIndex: isFlipped ? 0 : 2 }}>
            <div className="text-center space-y-4">
              <Brain className="w-8 h-8 mx-auto text-indigo-400/60" />
              <p className="text-xl font-semibold leading-relaxed">{currentCard.front}</p>
              <p className="text-xs text-gray-500">点击翻转查看答案</p>
            </div>
          </div>
          <div className="flip-card-back glass-card glow-border flex items-center justify-center p-8 cursor-default" style={{ zIndex: isFlipped ? 2 : 0 }}>
            <div className="text-center space-y-4">
              <Sparkles className="w-8 h-8 mx-auto text-purple-400/60" />
              <p className="text-base text-gray-300 leading-relaxed">{currentCard.back}</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`flex gap-3 justify-center transition-all duration-300 ${
          isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {(Object.entries(RATING_CONFIG) as [Rating, typeof RATING_CONFIG.easy][]).map(
          ([rating, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={rating}
                onClick={() => handleRate(rating)}
                className={`btn-spring px-5 py-2.5 rounded-xl text-white font-semibold shadow-lg ${config.classes} flex items-center gap-1.5`}
              >
                <Icon className="w-4 h-4" />
                {config.label}
              </button>
            );
          }
        )}
      </div>

      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
            <Calendar className="w-4 h-4 text-indigo-400" />
            {format(calendarMonth, "yyyy年M月")}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
          {WEEKDAYS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: calendarDays.leadingEmpty }).map((_, i) => (
            <div key={`e${i}`} />
          ))}
          {calendarDays.allDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const hasReview = reviewDays.has(key);
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={key}
                className={`calendar-day rounded-lg p-1 text-center text-xs ${
                  isSameMonth(day, calendarMonth) ? "text-gray-400" : "text-gray-600"
                } ${isToday ? "bg-indigo-500/30 text-indigo-300 font-bold" : ""}`}
              >
                <span>{format(day, "d")}</span>
                {hasReview && (
                  <div className="mt-0.5 flex justify-center">
                    <div className={`w-1 h-1 rounded-full ${isToday ? "bg-indigo-300" : "bg-purple-400"}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
