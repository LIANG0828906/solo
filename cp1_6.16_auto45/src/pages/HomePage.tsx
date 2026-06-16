import { useEffect, useState, useRef, useCallback } from "react";
import { Search, CalendarDays } from "lucide-react";
import EventCard from "@/components/EventCard";
import { useEventStore } from "@/stores/eventStore";

export default function HomePage() {
  const { events, loading, searchKeyword, dateFrom, dateTo, fetchEvents, setSearchKeyword, setDateFilter } =
    useEventStore();
  const [localKeyword, setLocalKeyword] = useState(searchKeyword);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const debouncedSearch = useCallback((keyword: string) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchKeyword(keyword);
    }, 300);
  }, [setSearchKeyword]);

  useEffect(() => {
    debouncedSearch(localKeyword);
    return () => clearTimeout(debounceRef.current);
  }, [localKeyword, debouncedSearch]);

  useEffect(() => {
    fetchEvents();
  }, [searchKeyword, dateFrom, dateTo, fetchEvents]);

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-6xl font-extrabold gradient-text mb-4">
          IndieVibe
        </h1>
        <p className="text-gray-400 text-lg">发现独立音乐，感受现场魅力</p>
      </section>

      <section className="glass rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索活动、音乐人..."
              value={localKeyword}
              onChange={(e) => setLocalKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50 transition-colors"
            />
          </div>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFilter(e.target.value, dateTo)}
                className="pl-9 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-purple/50 transition-colors"
              />
            </div>
            <span className="text-gray-500">至</span>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateFilter(dateFrom, e.target.value)}
                className="pl-9 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-purple/50 transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl aspect-[3/4] animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">暂无活动</p>
          <p className="text-gray-600 text-sm mt-2">试试调整搜索条件</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
