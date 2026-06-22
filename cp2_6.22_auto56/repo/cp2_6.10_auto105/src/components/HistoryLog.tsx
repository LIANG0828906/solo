import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Filter, Clock, Scale, Menu, X } from 'lucide-react';
import { useStore } from '@/store';
import type { TripLog, CargoType } from '@/types';
import { CARGO_NAMES } from '@/types';
import { cn } from '@/lib/utils';

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (ms: number): string => {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) {
    return `${days}天${hours}小时`;
  }
  return `${hours}小时`;
};

const getTooltipContent = (log: TripLog): string => {
  return JSON.stringify(
    {
      编号: log.id,
      驼队: log.caravanName,
      路线: `${log.origin} → ${log.destination}`,
      出发时间: formatDate(log.departTime),
      到达时间: formatDate(log.arriveTime),
      行程耗时: formatDuration(log.duration),
      总重量: `${log.totalWeight}kg`,
      消耗补给: {
        水: `${log.suppliesConsumed.water}L`,
        草料: `${log.suppliesConsumed.forage}kg`,
        马蹄铁: log.suppliesConsumed.horseshoes,
      },
      剩余货物: Object.entries(log.remainingCargo).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [CARGO_NAMES[key as CargoType]]: value,
        }),
        {}
      ),
    },
    null,
    2
  );
};

export default function HistoryLog() {
  const { tripLogs } = useStore();
  const [filterCaravan, setFilterCaravan] = useState<string>('');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [showFilter, setShowFilter] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredLog, setHoveredLog] = useState<string | null>(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const caravanNames = useMemo(() => {
    const names = new Set(tripLogs.map((log) => log.caravanName));
    return Array.from(names);
  }, [tripLogs]);

  const filteredLogs = useMemo(() => {
    return tripLogs
      .filter((log) => {
        if (filterCaravan && log.caravanName !== filterCaravan) return false;
        if (dateStart && log.departTime < new Date(dateStart).getTime())
          return false;
        if (dateEnd && log.arriveTime > new Date(dateEnd).getTime() + 86400000)
          return false;
        return true;
      })
      .sort((a, b) => b.arriveTime - a.arriveTime);
  }, [tripLogs, filterCaravan, dateStart, dateEnd]);

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `history-logs-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setFilterCaravan('');
    setDateStart('');
    setDateEnd('');
  };

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-amber-100 shadow-md md:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <AnimatePresence>
        {(isMobileMenuOpen || isDesktop) && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed top-0 left-0 h-full w-96 max-w-full z-40',
              'backdrop-blur-md bg-[rgba(255,255,245,0.85)]',
              'border-r border-amber-200 shadow-xl',
              'flex flex-col',
              'hidden md:flex',
              isMobileMenuOpen && 'flex md:hidden'
            )}
          >
            <div className="p-4 border-b border-amber-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                  <Clock className="text-amber-600" />
                  历史行程日志
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFilter(!showFilter)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      showFilter
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    )}
                    title="筛选"
                  >
                    <Filter size={18} />
                  </button>
                  <button
                    onClick={handleExport}
                    className="p-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                    title="导出JSON"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showFilter && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pt-2 border-t border-amber-200">
                      <div>
                        <label className="block text-sm font-medium text-amber-800 mb-1">
                          驼队名称
                        </label>
                        <select
                          value={filterCaravan}
                          onChange={(e) => setFilterCaravan(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="">全部驼队</option>
                          {caravanNames.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-amber-800 mb-1">
                            开始日期
                          </label>
                          <input
                            type="date"
                            value={dateStart}
                            onChange={(e) => setDateStart(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-amber-800 mb-1">
                            结束日期
                          </label>
                          <input
                            type="date"
                            value={dateEnd}
                            onChange={(e) => setDateEnd(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={resetFilters}
                        className="w-full py-2 text-sm text-amber-700 hover:text-amber-900 underline"
                      >
                        重置筛选条件
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-2 text-sm text-amber-700">
                共 {filteredLogs.length} 条记录
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-amber-600">
                  <Clock size={48} className="mb-2 opacity-50" />
                  <p>暂无行程记录</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-amber-300 to-amber-200" />

                  <div className="space-y-4">
                    {filteredLogs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{
                          scale: 1.02,
                          transition: {
                            type: 'ease-out',
                            duration: 0.3,
                          },
                        }}
                        className="relative pl-10"
                        onMouseEnter={() => setHoveredLog(log.id)}
                        onMouseLeave={() => setHoveredLog(null)}
                      >
                        <div className="absolute left-0 top-4 z-10 w-6 h-6 rounded-full bg-[#f4e4c1] border-2 border-amber-500 flex items-center justify-center">
                          <span className="text-sm">⌛</span>
                        </div>

                        <div
                          className={cn(
                            'p-4 rounded-lg shadow-md',
                            'bg-[#f4e4c1]',
                            'border border-amber-300',
                            'relative overflow-hidden'
                          )}
                          style={{
                            backgroundImage: `
                              linear-gradient(90deg, rgba(139, 90, 43, 0.05) 1px, transparent 1px),
                              linear-gradient(rgba(139, 90, 43, 0.05) 1px, transparent 1px)
                            `,
                            backgroundSize: '20px 20px',
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-amber-900">
                              {log.caravanName}
                            </span>
                            <span className="text-xs text-amber-700 bg-amber-200 px-2 py-1 rounded-full">
                              #{log.id}
                            </span>
                          </div>

                          <div className="text-amber-800 font-medium mb-2">
                            {log.origin} → {log.destination}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm text-amber-700 mb-2">
                            <div>
                              <span className="text-amber-600">出发：</span>
                              {formatDate(log.departTime)}
                            </div>
                            <div>
                              <span className="text-amber-600">到达：</span>
                              {formatDate(log.arriveTime)}
                            </div>
                            <div>
                              <span className="text-amber-600">
                                <Clock size={12} className="inline mr-1" />
                                耗时：
                              </span>
                              {formatDuration(log.duration)}
                            </div>
                            <div>
                              <span className="text-amber-600">
                                <Scale size={12} className="inline mr-1" />
                                总重：
                              </span>
                              {log.totalWeight}kg
                            </div>
                          </div>

                          <div className="border-t border-amber-300 pt-2 mt-2">
                            <div className="text-xs text-amber-600 mb-1">
                              消耗补给：
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                💧 {log.suppliesConsumed.water}L
                              </span>
                              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                🌾 {log.suppliesConsumed.forage}kg
                              </span>
                              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                🔩 {log.suppliesConsumed.horseshoes}
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-amber-300 pt-2 mt-2">
                            <div className="text-xs text-amber-600 mb-1">
                              剩余货物：
                            </div>
                            <div className="flex flex-wrap gap-1 text-xs">
                              {Object.entries(log.remainingCargo).map(
                                ([key, value]) =>
                                  value > 0 && (
                                    <span
                                      key={key}
                                      className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded"
                                    >
                                      {CARGO_NAMES[key as CargoType]}:{' '}
                                      {value}
                                    </span>
                                  )
                              )}
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {hoveredLog === log.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute left-full top-0 ml-4 z-50 w-80 max-w-[calc(100vw-420px)]"
                            >
                              <div className="bg-gray-900 text-green-400 p-4 rounded-lg shadow-2xl font-mono text-xs overflow-auto max-h-96">
                                <pre>{getTooltipContent(log)}</pre>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
