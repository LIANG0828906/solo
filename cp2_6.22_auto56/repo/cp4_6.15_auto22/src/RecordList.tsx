import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { FixedSizeList as List, areEqual } from 'react-window';
import { useCoffeeStore } from '@/store';
import { PRESET_BEANS } from '@/data/presetBeans';
import { BREW_METHOD_LABELS, FLAVOR_TAGS, DEFAULT_FILTER } from '@/types';
import type { BrewMethod, LogEntry } from '@/types';
import BrewMethodIcon from '@/components/BrewMethodIcon';
import StarRating from '@/components/StarRating';
import EmptyState from '@/components/EmptyState';
import { useDebouncedValue } from '@/hooks/useDebounce';

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `今天 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `昨天 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface RecordCardProps {
  log: LogEntry;
  isExpanded: boolean;
  toggleExpand: (id: string) => void;
  index: number;
}

const RecordCard = React.memo(function RecordCard({ log, isExpanded, toggleExpand, index }: RecordCardProps) {
  const flavorLabels = log.flavorTags
    .map((id) => FLAVOR_TAGS.find((t) => t.id === id)?.label)
    .filter(Boolean) as string[];

  return (
    <div
      className="px-1 py-1.5 animate-fade_in"
      style={{ animationDelay: `${Math.min(index * 20, 400)}ms`, animationFillMode: 'both' }}
    >
      <div
        className={`
          bg-white rounded-xl border border-coffee-100
          transition-all duration-200 ease-out
          hover:shadow-lg hover:border-coffee-200
          hover:-translate-y-0.5 cursor-pointer
          focus:outline-none focus-visible:ring-2 focus-visible:ring-amber
        `}
        onClick={() => toggleExpand(log.id)}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpand(log.id);
          }
        }}
      >
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-coffee-100 flex items-center justify-center flex-shrink-0">
            <BrewMethodIcon method={log.brewMethod} size={26} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-coffee-900 truncate">{log.bean.name}</span>
              <span className="text-xs px-2 py-0.5 bg-coffee-100 text-coffee-600 rounded-full">
                {BREW_METHOD_LABELS[log.brewMethod]}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-coffee-400">
              <span>{formatDate(log.createdAt)}</span>
              <StarRating rating={log.rating} onChange={() => {}} readonly size="sm" />
            </div>
          </div>
          <div
            className={`flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8D6E63" strokeWidth="2">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div
          className="overflow-hidden transition-all duration-400 ease-in-out"
          style={{
            maxHeight: isExpanded ? '600px' : '0px',
            opacity: isExpanded ? 1 : 0,
          }}
        >
          <div className="px-4 pb-4 pt-1 border-t border-coffee-50 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-coffee-50 rounded-lg px-3 py-2">
                <div className="text-xs text-coffee-400">产地</div>
                <div className="text-coffee-800 font-medium">{log.bean.origin} · {log.bean.roastLevel}</div>
              </div>
              <div className="bg-coffee-50 rounded-lg px-3 py-2">
                <div className="text-xs text-coffee-400">研磨度</div>
                <div className="text-coffee-800 font-medium">{log.grindSize}/10</div>
              </div>
              <div className="bg-coffee-50 rounded-lg px-3 py-2">
                <div className="text-xs text-coffee-400">水温</div>
                <div className="text-coffee-800 font-medium">{log.waterTemp}°C</div>
              </div>
              <div className="bg-coffee-50 rounded-lg px-3 py-2">
                <div className="text-xs text-coffee-400">粉水比</div>
                <div className="text-coffee-800 font-medium">1:{log.ratio}</div>
              </div>
              <div className="bg-coffee-50 rounded-lg px-3 py-2 col-span-2">
                <div className="text-xs text-coffee-400">冲煮时间</div>
                <div className="text-coffee-800 font-medium">{formatTime(log.brewTimeSeconds)}</div>
              </div>
            </div>

            {flavorLabels.length > 0 && (
              <div>
                <div className="text-xs text-coffee-400 mb-1">风味标签</div>
                <div className="flex flex-wrap gap-1">
                  {flavorLabels.map((label) => (
                    <span
                      key={label}
                      className="text-xs px-2 py-0.5 rounded-full bg-amber/20 text-amber-dark font-medium"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {log.customDescription && (
              <div>
                <div className="text-xs text-coffee-400 mb-1">备注</div>
                <p className="text-sm text-coffee-700 leading-relaxed">{log.customDescription}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, areEqual);

const ITEM_HEIGHT = 96;

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    logs: LogEntry[];
    expandedId: string | null;
    toggleExpand: (id: string) => void;
    expandedHeight: number;
  };
}

function Row({ index, style, data }: RowProps) {
  const log = data.logs[index];
  const isExpanded = data.expandedId === log.id;
  const expandedHeight = isExpanded ? data.expandedHeight : 0;

  return (
    <div style={{ ...style, height: (style.height as number) + expandedHeight }}>
      <RecordCard
        log={log}
        isExpanded={isExpanded}
        toggleExpand={data.toggleExpand}
        index={index}
      />
    </div>
  );
}

export default function RecordList() {
  const logs = useCoffeeStore((s) => s.logs);
  const customBeans = useCoffeeStore((s) => s.customBeans);
  const filter = useCoffeeStore((s) => s.filter);
  const setFilter = useCoffeeStore((s) => s.setFilter);
  const resetFilter = useCoffeeStore((s) => s.resetFilter);
  const getFilteredLogs = useCoffeeStore((s) => s.getFilteredLogs);
  const expandedId = useCoffeeStore((s) => s.expandedId);
  const toggleExpand = useCoffeeStore((s) => s.toggleExpand);
  const listRef = useRef<List>(null);

  const [filterInputs, setFilterInputs] = useState({
    beanId: filter.beanId,
    brewMethod: filter.brewMethod,
    minRating: filter.minRating,
    timeRange: filter.timeRange,
  });

  const debouncedFilters = useDebouncedValue(filterInputs, 80);

  useEffect(() => {
    setFilter({
      beanId: debouncedFilters.beanId,
      brewMethod: debouncedFilters.brewMethod,
      minRating: debouncedFilters.minRating,
      timeRange: debouncedFilters.timeRange,
    });
  }, [debouncedFilters, setFilter]);

  const allBeans = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    PRESET_BEANS.forEach((b) => map.set(b.id, { id: b.id, name: b.name }));
    customBeans.forEach((b) => map.set(b.id, { id: b.id, name: b.name }));
    logs.forEach((log) => {
      if (!map.has(log.bean.id)) {
        map.set(log.bean.id, { id: log.bean.id, name: log.bean.name });
      }
    });
    return Array.from(map.values());
  }, [logs, customBeans]);

  const filteredLogs = useMemo(() => getFilteredLogs(), [getFilteredLogs, filter]);

  const hasActiveFilter =
    filter.beanId !== null ||
    filter.brewMethod !== null ||
    filter.minRating !== null ||
    filter.timeRange !== 'all';

  const expandedHeight = 380;

  const rowData = useMemo(
    () => ({ logs: filteredLogs, expandedId, toggleExpand, expandedHeight }),
    [filteredLogs, expandedId, toggleExpand, expandedHeight]
  );

  useEffect(() => {
    if (listRef.current) {
      (listRef.current as unknown as { resetAfterIndex: (i: number) => void }).resetAfterIndex(0);
    }
  }, [expandedId]);

  const handleReset = useCallback(() => {
    setFilterInputs({ beanId: null, brewMethod: null, minRating: null, timeRange: 'all' });
    resetFilter();
  }, [resetFilter]);

  if (filteredLogs.length === 0) {
    return (
      <div className="space-y-4">
        <FilterBar
          allBeans={allBeans}
          filterInputs={filterInputs}
          setFilterInputs={setFilterInputs}
          hasActiveFilter={hasActiveFilter}
          onReset={handleReset}
          resultCount={0}
        />
        <EmptyState />
      </div>
    );
  }

  const useVirtualScroll = filteredLogs.length > 50;

  return (
    <div className="space-y-4">
      <FilterBar
        allBeans={allBeans}
        filterInputs={filterInputs}
        setFilterInputs={setFilterInputs}
        hasActiveFilter={hasActiveFilter}
        onReset={handleReset}
        resultCount={filteredLogs.length}
      />

      <div className="relative">
        {useVirtualScroll ? (
          <List
            ref={listRef}
            height={600}
            itemCount={filteredLogs.length}
            itemSize={ITEM_HEIGHT}
            width="100%"
            itemData={rowData}
            className="scrollbar-thin"
          >
            {Row as unknown as React.ComponentType<{
              index: number;
              style: React.CSSProperties;
              data: unknown;
            }>}
          </List>
        ) : (
          <div className="space-y-1 max-h-[600px] overflow-y-auto scrollbar-thin pr-1">
            {filteredLogs.map((log, index) => (
              <RecordCard
                key={log.id}
                log={log}
                isExpanded={expandedId === log.id}
                toggleExpand={toggleExpand}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface FilterBarProps {
  allBeans: { id: string; name: string }[];
  filterInputs: {
    beanId: string | null;
    brewMethod: BrewMethod | null;
    minRating: number | null;
    timeRange: '7d' | '30d' | 'all';
  };
  setFilterInputs: React.Dispatch<
    React.SetStateAction<{
      beanId: string | null;
      brewMethod: BrewMethod | null;
      minRating: number | null;
      timeRange: '7d' | '30d' | 'all';
    }>
  >;
  hasActiveFilter: boolean;
  onReset: () => void;
  resultCount: number;
}

function FilterBar({ allBeans, filterInputs, setFilterInputs, hasActiveFilter, onReset, resultCount }: FilterBarProps) {
  return (
    <div className="bg-coffee-100 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-coffee-900">冲煮记录</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-coffee-500">{resultCount} 条</span>
          {hasActiveFilter && (
            <button
              onClick={onReset}
              className="text-xs px-2 py-1 rounded-md text-coffee-600 hover:bg-coffee-200 transition-colors"
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <select
          value={filterInputs.beanId ?? ''}
          onChange={(e) =>
            setFilterInputs((prev) => ({ ...prev, beanId: e.target.value || null }))
          }
          className="px-2.5 py-2 text-sm rounded-lg border border-coffee-200 bg-white text-coffee-800
            focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition-colors"
        >
          <option value="">全部豆子</option>
          {allBeans.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          value={filterInputs.brewMethod ?? ''}
          onChange={(e) =>
            setFilterInputs((prev) => ({
              ...prev,
              brewMethod: (e.target.value as BrewMethod) || null,
            }))
          }
          className="px-2.5 py-2 text-sm rounded-lg border border-coffee-200 bg-white text-coffee-800
            focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition-colors"
        >
          <option value="">全部方式</option>
          <option value="pourover">手冲</option>
          <option value="espresso">意式</option>
          <option value="frenchPress">法压</option>
          <option value="aeropress">爱乐压</option>
        </select>

        <select
          value={filterInputs.minRating ?? ''}
          onChange={(e) =>
            setFilterInputs((prev) => ({
              ...prev,
              minRating: e.target.value ? Number(e.target.value) : null,
            }))
          }
          className="px-2.5 py-2 text-sm rounded-lg border border-coffee-200 bg-white text-coffee-800
            focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition-colors"
        >
          <option value="">全部评分</option>
          <option value="1">1 星以上</option>
          <option value="2">2 星以上</option>
          <option value="3">3 星以上</option>
          <option value="4">4 星以上</option>
          <option value="5">5 星</option>
        </select>

        <select
          value={filterInputs.timeRange}
          onChange={(e) =>
            setFilterInputs((prev) => ({
              ...prev,
              timeRange: e.target.value as '7d' | '30d' | 'all',
            }))
          }
          className="px-2.5 py-2 text-sm rounded-lg border border-coffee-200 bg-white text-coffee-800
            focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition-colors"
        >
          <option value="all">全部时间</option>
          <option value="7d">最近 7 天</option>
          <option value="30d">最近 30 天</option>
        </select>
      </div>
    </div>
  );
}
