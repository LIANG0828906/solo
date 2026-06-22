import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Eye,
  Star,
  Calendar,
  Loader2,
  Film,
} from 'lucide-react';
import { getShowDetail, addWatchRecord } from '../api/client';
import type { ShowDetail, WatchRecord } from '../types';

const StarRating: React.FC<{
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  onChange?: (rating: number) => void;
}> = ({ rating, size = 'sm', readonly = true, onChange }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const starSizeClass = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-transform duration-150 ${!readonly && 'hover:scale-110'}`}
        >
          <Star
            className={`${starSizeClass} ${star <= displayRating ? 'text-amber-500 fill-amber-500' : 'text-gray-600'} transition-colors duration-150`}
          />
        </button>
      ))}
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  return (
    <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
};

interface TimelineItemProps {
  record: WatchRecord;
  isLast: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ record, isLast }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatEpisode = (season: number, episode: number) => {
    return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
  };

  return (
    <div className="relative pl-8 pb-6">
      {!isLast && (
        <div className="absolute left-[5px] top-3 bottom-0 w-0.5 bg-emerald-500" />
      )}
      <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />

      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">{formatDate(record.watchedAt)}</span>
          <span className="text-cyan-400 font-medium">
            {formatEpisode(record.season, record.episode)}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <StarRating rating={record.rating} size="sm" />
        </div>

        {record.comment && (
          <p className="text-gray-300 text-sm">{record.comment}</p>
        )}
      </div>
    </div>
  );
};

const AddRecordForm: React.FC<{
  onSubmit: (record: { season: number; episode: number; rating: number; comment: string }) => void;
  isSubmitting: boolean;
  totalSeasons: number;
  totalEpisodes: number;
}> = ({ onSubmit, isSubmitting, totalSeasons, totalEpisodes }) => {
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({ season, episode, rating, comment });
    setComment('');
    setRating(0);
  };

  const seasonOptions = Array.from({ length: Math.max(totalSeasons, 10) }, (_, i) => i + 1);
  const episodeOptions = Array.from({ length: Math.max(totalEpisodes, 24) }, (_, i) => i + 1);

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-white text-lg font-semibold mb-4">新增观看记录</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-gray-400 text-sm mb-1.5">季数</label>
          <select
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-500 outline-none transition-colors duration-200"
          >
            {seasonOptions.map((s) => (
              <option key={s} value={s}>
                第 {s} 季
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-1.5">集数</label>
          <select
            value={episode}
            onChange={(e) => setEpisode(Number(e.target.value))}
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-500 outline-none transition-colors duration-200"
          >
            {episodeOptions.map((e) => (
              <option key={e} value={e}>
                第 {e} 集
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-gray-400 text-sm mb-1.5">评分</label>
        <StarRating rating={rating} size="lg" readonly={false} onChange={setRating} />
      </div>

      <div className="mb-6">
        <label className="block text-gray-400 text-sm mb-1.5">短评</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="写下你的观剧感受..."
          rows={3}
          className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-500 outline-none transition-colors duration-200 resize-none placeholder-gray-500"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="w-full bg-blue-500 text-white py-2.5 rounded-lg font-medium hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            提交中...
          </>
        ) : (
          '添加记录'
        )}
      </button>
    </form>
  );
};

const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDetail, setShowDetail] = useState<ShowDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShowDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getShowDetail(id);
      setShowDetail(data);
    } catch (err) {
      setError('加载剧集详情失败');
      console.error('Failed to fetch show detail:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShowDetail();
  }, [fetchShowDetail]);

  const handleAddRecord = async (record: {
    season: number;
    episode: number;
    rating: number;
    comment: string;
  }) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await addWatchRecord(id, record);
      await fetchShowDetail();
    } catch (err) {
      console.error('Failed to add watch record:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatYear = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).getFullYear();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !showDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || '未找到剧集信息'}</p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-500 hover:text-blue-400 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const sortedRecords = [...showDetail.records].sort(
    (a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
  );

  return (
    <div className="min-h-screen pb-12">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回列表</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-shrink-0">
          {showDetail.posterPath ? (
            <img
              src={`https://image.tmdb.org/t/p/w300${showDetail.posterPath}`}
              alt={showDetail.name}
              className="w-[200px] h-[300px] rounded-xl object-cover shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-[200px] h-[300px] bg-slate-800 rounded-xl flex items-center justify-center">
              <Film className="w-16 h-16 text-gray-600" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">{showDetail.name}</h1>
          <p className="text-gray-400 mb-4">{formatYear(showDetail.firstAirDate)}</p>

          {showDetail.genres && showDetail.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {showDetail.genres.map((genre, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-slate-800 text-gray-300 rounded-full text-sm"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {showDetail.overview && (
            <p className="text-gray-300 leading-relaxed">{showDetail.overview}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Film className="w-6 h-6" />}
          label="总集数"
          value={showDetail.stats.totalEpisodes || showDetail.totalEpisodes}
          color="#8B5CF6"
        />
        <StatCard
          icon={<Eye className="w-6 h-6" />}
          label="已看集数"
          value={showDetail.stats.watchedEpisodes}
          color="#06B6D4"
        />
        <StatCard
          icon={<Star className="w-6 h-6" />}
          label="平均评分"
          value={showDetail.stats.averageRating.toFixed(1)}
          color="#F59E0B"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          label="追剧天数"
          value={showDetail.stats.daysTracked}
          color="#10B981"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-white mb-4">观看记录</h2>

          {sortedRecords.length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-8 text-center">
              <Play className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">暂无观看记录</p>
              <p className="text-gray-500 text-sm mt-1">开始记录你的观剧历程吧</p>
            </div>
          ) : (
            <div>
              {sortedRecords.map((record, index) => (
                <TimelineItem
                  key={record.id}
                  record={record}
                  isLast={index === sortedRecords.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <AddRecordForm
            onSubmit={handleAddRecord}
            isSubmitting={isSubmitting}
            totalSeasons={showDetail.totalSeasons || 10}
            totalEpisodes={showDetail.totalEpisodes || 24}
          />
        </div>
      </div>
    </div>
  );
};

export default DetailPage;
