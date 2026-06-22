import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Film, Loader2 } from 'lucide-react';
import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window';
import { useWatchContext } from '../context/WatchContext';
import type { Show, FilterStatus, SortBy } from '../types';

const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' }> = ({ rating, size = 'sm' }) => {
  const starClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starClass} ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-600'}`}
        />
      ))}
    </div>
  );
};

interface ShowCardProps {
  show: Show;
  onClick: () => void;
  style?: React.CSSProperties;
}

const ShowCard: React.FC<ShowCardProps> = ({ show, onClick, style }) => {
  const formatProgress = () => {
    if (show.totalEpisodes === 0) {
      return 'S01E01';
    }
    const season = 1;
    const episode = 1;
    return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
  };

  const getStatusLabel = () => {
    switch (show.status) {
      case 'watching':
        return '正在追';
      case 'completed':
        return '已完结';
      case 'dropped':
        return '已弃剧';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (show.status) {
      case 'watching':
        return 'bg-blue-500/20 text-blue-400';
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'dropped':
        return 'bg-red-500/20 text-red-400';
      default:
        return '';
    }
  };

  return (
    <div
      style={style}
      onClick={onClick}
      className="w-[280px] h-[380px] bg-slate-800 rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
    >
      <div className="relative w-full h-[220px] rounded-lg overflow-hidden mb-3 bg-slate-700">
        {show.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${show.posterPath}`}
            alt={show.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-12 h-12 text-gray-500" />
          </div>
        )}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-medium ${getStatusColor()}`}>
          {getStatusLabel()}
        </div>
      </div>

      <div className="flex flex-col h-[calc(100%-220px-12px)]">
        <h3 className="text-white font-semibold text-base mb-2 line-clamp-2">{show.name}</h3>
        <div className="flex-1 flex flex-col justify-between">
          <p className="text-gray-400 text-sm">
            进度: {formatProgress()}
          </p>
          <div className="flex items-center justify-between">
            <StarRating rating={0} />
            <span className="text-gray-500 text-xs">
              {new Date(show.lastUpdatedAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const FilterBar: React.FC = () => {
  const { filterStatus, sortBy, setFilterStatus, setSortBy } = useWatchContext();

  const statusOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'watching', label: '正在追' },
    { value: 'completed', label: '已完结' },
    { value: 'dropped', label: '已弃剧' },
  ];

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'rating', label: '评分' },
    { value: 'addedAt', label: '添加时间' },
    { value: 'lastUpdatedAt', label: '更新时间' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">状态:</span>
        <div className="flex gap-1">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilterStatus(option.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                filterStatus === option.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">排序:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-sm border border-slate-700 focus:border-blue-500 outline-none transition-colors duration-200"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

const WatchList: React.FC = () => {
  const { shows, isLoading, filterStatus, sortBy } = useWatchContext();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const filteredAndSortedShows = useMemo(() => {
    let result = [...shows];

    if (filterStatus !== 'all') {
      result = result.filter((show) => show.status === filterStatus);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return 0;
        case 'addedAt':
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case 'lastUpdatedAt':
          return new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [shows, filterStatus, sortBy]);

  const handleCardClick = (id: string) => {
    navigate(`/detail/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-400">加载中...</p>
      </div>
    );
  }

  if (filteredAndSortedShows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Film className="w-16 h-16 text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg">暂无追剧记录</p>
        <p className="text-gray-500 text-sm mt-2">使用上方搜索栏添加你喜欢的剧集</p>
      </div>
    );
  }

  const useVirtualScroll = filteredAndSortedShows.length > 20;

  if (useVirtualScroll) {
    const cardWidth = 280;
    const cardHeight = 380;
    const gap = 24;
    const columnCount = Math.max(1, Math.floor((containerWidth + gap) / (cardWidth + gap)));
    const rowCount = Math.ceil(filteredAndSortedShows.length / Math.max(columnCount, 1));

    const Cell = ({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
      const index = rowIndex * columnCount + columnIndex;
      if (index >= filteredAndSortedShows.length) return null;

      const show = filteredAndSortedShows[index];
      const adjustedStyle = {
        ...style,
        left: Number(style.left) + columnIndex * gap,
        top: Number(style.top) + rowIndex * gap,
        width: cardWidth,
        height: cardHeight,
      };

      return (
        <ShowCard
          show={show}
          onClick={() => handleCardClick(show.id)}
          style={adjustedStyle}
        />
      );
    };

    return (
      <div className="watch-list-container">
        <FilterBar />
        <div
          ref={containerRef}
          className="grid-grid-container"
          style={{
            opacity: 0,
            animation: 'fadeIn 0.3s ease-in forwards',
            width: '100%',
          }}
        >
          {containerWidth > 0 && (
            <Grid
              columnCount={Math.max(columnCount, 1)}
              columnWidth={cardWidth + gap}
              rowCount={rowCount}
              rowHeight={cardHeight + gap}
              width={containerWidth}
              height={Math.min(rowCount * (cardHeight + gap), 800)}
              itemData={filteredAndSortedShows}
            >
              {Cell}
            </Grid>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="watch-list-container">
      <FilterBar />
      <div
        ref={containerRef}
        className="grid gap-6"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          opacity: 0,
          animation: 'fadeIn 0.3s ease-in forwards',
        }}
      >
        {filteredAndSortedShows.map((show) => (
          <ShowCard
            key={show.id}
            show={show}
            onClick={() => handleCardClick(show.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default WatchList;
