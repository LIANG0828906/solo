import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Inspiration, FilterParams, PRESET_TAGS, PRESET_STATUSES, TAG_COLORS } from '../types';
import { fetchInspirations } from '../api';
import InspirationCard from './InspirationCard';

interface InspirationPanelProps {
  filterParams: FilterParams;
  onSelectInspiration: (id: string) => void;
  onDataLoaded: (data: Inspiration[]) => void;
}

const InspirationPanel: React.FC<InspirationPanelProps> = ({
  filterParams,
  onSelectInspiration,
  onDataLoaded,
}) => {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimerRef = useRef<number | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(filterParams.search);

  useEffect(() => {
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = window.setTimeout(() => {
      setDebouncedSearch(filterParams.search);
    }, 150);
    return () => {
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    };
  }, [filterParams.search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchInspirations({
      tag: filterParams.tag,
      status: filterParams.status,
      search: debouncedSearch,
    })
      .then((res) => {
        if (!cancelled) {
          setInspirations(res);
          onDataLoaded(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filterParams.tag, filterParams.status, debouncedSearch, onDataLoaded]);

  const handleCardClick = useCallback(
    (id: string) => {
      onSelectInspiration(id);
    },
    [onSelectInspiration]
  );

  const tagInitials: Record<string, string> = {
    设计: '设',
    技术: '技',
    商业: '商',
    个人: '个',
  };

  return (
    <div>
      <div className="controls">
        <input
          type="text"
          className="search-box"
          placeholder="搜索灵感..."
          defaultValue={filterParams.search}
          onInput={(e) => {
            const target = e.target as HTMLInputElement;
            const ev = new CustomEvent('searchChange', { detail: target.value });
            document.dispatchEvent(ev);
          }}
        />
        <div className="filter-row">
          <div className="filter-group">
            <span className="filter-label">标签:</span>
            <div className="tag-filters">
              <button
                type="button"
                className={`tag-filter-all ${!filterParams.tag ? 'active' : ''}`}
                onClick={() => {
                  const ev = new CustomEvent('tagChange', { detail: '' });
                  document.dispatchEvent(ev);
                }}
              >
                全
              </button>
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-filter ${filterParams.tag === tag ? 'active' : ''}`}
                  style={{ backgroundColor: TAG_COLORS[tag] }}
                  title={tag}
                  onClick={() => {
                    const ev = new CustomEvent('tagChange', {
                      detail: filterParams.tag === tag ? '' : tag,
                    });
                    document.dispatchEvent(ev);
                  }}
                >
                  {tagInitials[tag]}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">状态:</span>
            <div className="status-filters">
              <button
                type="button"
                className={`status-filter ${!filterParams.status ? 'active' : ''}`}
                onClick={() => {
                  const ev = new CustomEvent('statusChange', { detail: '' });
                  document.dispatchEvent(ev);
                }}
              >
                全部
              </button>
              {PRESET_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`status-filter ${filterParams.status === s ? 'active' : ''}`}
                  onClick={() => {
                    const ev = new CustomEvent('statusChange', {
                      detail: filterParams.status === s ? '' : s,
                    });
                    document.dispatchEvent(ev);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-title">加载中...</div>
        </div>
      ) : inspirations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">暂无灵感</div>
          <div className="empty-desc">点击右下角按钮创建你的第一条灵感吧</div>
        </div>
      ) : (
        <div className="masonry">
          {inspirations.map((item) => (
            <InspirationCard
              key={item.id}
              inspiration={item}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InspirationPanel;
