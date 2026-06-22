import { useFlashcardStore } from "@/store";
import {
  isToday,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import { BookOpen, Flame, Target, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Dashboard() {
  const navigate = useNavigate();
  const { getDueCards, getMasteryPercentage, stats, cards } = useFlashcardStore();
  const [ringOffset, setRingOffset] = useState(CIRCUMFERENCE);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const dueCount = getDueCards().length;
  const mastery = getMasteryPercentage();
  const streakDays = stats.streakDays;

  useEffect(() => {
    const timer = setTimeout(() => {
      setRingOffset(CIRCUMFERENCE - (mastery / 100) * CIRCUMFERENCE);
    }, 100);
    return () => clearTimeout(timer);
  }, [mastery]);

  const reviewDays = useMemo(() => {
    const days = new Set<string>();
    cards.forEach((card) => {
      if (card.nextReview) {
        const d = parseISO(card.nextReview);
        days.add(format(d, "yyyy-MM-dd"));
      }
    });
    return days;
  }, [cards]);

  const todayScheduled = useMemo(() => {
    const now = new Date();
    return cards.filter(
      (card) => card.nextReview && isSameDay(parseISO(card.nextReview), now)
    ).length;
  }, [cards]);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const leadingEmpty = getDay(startOfMonth(calendarMonth));

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-6 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gradient">
          Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-2 animate-scale-in">
            <BookOpen className="w-6 h-6 text-blue-400" />
            <span className="text-sm text-white/60">Due Today</span>
            <span className="text-4xl font-bold text-white">{dueCount}</span>
            {todayScheduled > 0 && (
              <span className="text-xs text-white/40">
                {todayScheduled} scheduled
              </span>
            )}
          </div>

          <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-2 animate-scale-in">
            <Flame className="w-6 h-6 text-orange-400" />
            <span className="text-sm text-white/60">Streak</span>
            <span className="text-4xl font-bold text-white">
              {streakDays}
              <span className="text-lg text-white/50 ml-1">days</span>
            </span>
          </div>

          <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-2 animate-scale-in">
            <Target className="w-6 h-6 text-purple-400" />
            <span className="text-sm text-white/60">Mastery</span>
            <div className="relative w-32 h-32">
              <svg
                className="w-full h-full -rotate-90"
                viewBox="0 0 128 128"
              >
                <circle
                  cx="64"
                  cy="64"
                  r={RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <circle
                  cx="64"
                  cy="64"
                  r={RADIUS}
                  fill="none"
                  stroke="url(#masteryGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={ringOffset}
                  className="progress-ring-circle"
                />
                <defs>
                  <linearGradient
                    id="masteryGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-white">
                  {Math.round(mastery)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/study")}
          className="btn-spring glass glow-border rounded-xl px-8 py-3 text-lg font-semibold text-white hover:scale-105 transition-transform w-full md:w-auto"
        >
          Start Review
        </button>

        <div className="glass-card rounded-2xl p-6 animate-slide-down">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setCalendarMonth((m) => subMonths(m, 1))
                }
                className="text-white/60 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-white font-semibold min-w-[140px] text-center">
                {format(calendarMonth, "MMMM yyyy")}
              </span>
              <button
                onClick={() =>
                  setCalendarMonth((m) => addMonths(m, 1))
                }
                className="text-white/60 hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="w-5" />
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-white/40 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingEmpty }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {calendarDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const hasReview = reviewDays.has(key);
              const today = isToday(day);
              const inMonth = isSameMonth(day, calendarMonth);
              return (
                <div
                  key={key}
                  className={`calendar-day flex flex-col items-center justify-center rounded-lg py-1.5 text-sm${
                    today
                      ? " bg-blue-500/30 text-white font-bold"
                      : inMonth
                        ? " text-white/70"
                        : " text-white/20"
                  }`}
                >
                  {format(day, "d")}
                  {hasReview && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
