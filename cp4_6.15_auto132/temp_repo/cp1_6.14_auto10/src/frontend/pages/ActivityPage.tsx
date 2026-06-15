import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  User,
  Star,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  Activity,
  Rating,
  getActivity,
  registerActivity,
  unregisterActivity,
  getRatings,
  createRating,
} from '../utils/apiClient';
import { useUserStore } from '../store/useUserStore';
import { formatDateTime, getStatusText, getStatusColor } from '../utils/format';

export default function ActivityPage() {
  const { activityId } = useParams<{ activityId?: string }>();
  const navigate = useNavigate();
  const { user, fetchUser } = useUserStore();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hoverScore, setHoverScore] = useState(0);

  const RATING_WINDOW_MS = 24 * 60 * 60 * 1000;

  const loadData = useCallback(async () => {
    if (!activityId) return;
    setLoading(true);
    setError(null);
    try {
      const [act, rateList] = await Promise.all([
        getActivity(activityId),
        getRatings(activityId),
      ]);
      setActivity(act);
      setRatings(rateList);

      const now = Date.now();
      const isEnded = act.status === 'ended';
      const withinWindow = isEnded && now - act.endTime <= RATING_WINDOW_MS;

      if (user) {
        const rated = rateList.some((r) => r.userId === user.id);
        setHasRated(rated);
        setCanRate(isEnded && withinWindow && !rated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [activityId, user]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRegister = async () => {
    if (!activityId || !activity) return;
    setRegistering(true);
    try {
      if (isRegistered) {
        await unregisterActivity(activityId);
        setIsRegistered(false);
        setActivity((prev) =>
          prev
            ? { ...prev, currentParticipants: Math.max(0, prev.currentParticipants - 1) }
            : null
        );
      } else {
        await registerActivity(activityId);
        setIsRegistered(true);
        setActivity((prev) =>
          prev
            ? {
                ...prev,
                currentParticipants: prev.currentParticipants + 1,
              }
            : null
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setRegistering(false);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityId || ratingScore < 1 || !user) return;
    setSubmittingRating(true);
    try {
      const newRating = await createRating(activityId, {
        score: ratingScore,
        comment: ratingComment,
      });
      setRatings((prev) => [newRating, ...prev]);
      setHasRated(true);
      setCanRate(false);
      setRatingScore(0);
      setRatingComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交评分失败');
    } finally {
      setSubmittingRating(false);
    }
  };

  const avgScore =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (error && !activity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-gray-600">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-gray-400" />
        <p className="text-gray-600">活动不存在</p>
        <Link
          to="/"
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          返回首页
        </Link>
      </div>
    );
  }

  const isFull = activity.currentParticipants >= activity.maxParticipants;
  const isEnded = activity.status === 'ended';

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to={`/groups/${activity.groupId}`}
        className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-primary-500 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>返回小组</span>
      </Link>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  {activity.title}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  activity.status
                )}`}
                >
                  {getStatusText(activity.status)}
                </span>
              </div>
              {activity.description && (
                <p className="text-gray-600 mt-2">{activity.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="text-primary-500" size={24} />
              <div>
                <p className="text-xs text-gray-500">开始时间</p>
                <p className="font-medium text-gray-800">
                  {formatDateTime(activity.startTime)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <MapPin className="text-primary-500" size={24} />
              <div>
                <p className="text-xs text-gray-500">活动地点</p>
                <p className="font-medium text-gray-800">{activity.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Users className="text-primary-500" size={24} />
              <div>
                <p className="text-xs text-gray-500">参与人数</p>
                <p className="font-medium text-gray-800">
                  {activity.currentParticipants}/{activity.maxParticipants} 人
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {!isEnded && (
              <button
                onClick={handleRegister}
                disabled={registering || (isFull && !isRegistered)}
                className={`relative btn-ripple flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  isRegistered
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : isFull
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-500 text-white hover:bg-primary-600 shadow-md hover:shadow-lg'
                }`}
              >
                {registering ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isRegistered ? (
                  <XCircle size={20} />
                ) : (
                  <CheckCircle2 size={20} />
                )}
                <span>
                  {registering
                    ? '处理中...'
                    : isRegistered
                    ? '取消报名'
                    : isFull
                    ? '名额已满'
                    : '立即报名'}
                </span>
              </button>
            )}
            {isEnded && (
              <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium">
                <AlertCircle size={20} />
                <span>活动已结束</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEnded && (
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">活动评分与留言</h2>
            {ratings.length > 0 && (
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={20}
                    className={s <= Math.round(avgScore) ? 'star-rating fill-current' : 'text-gray-300'}
                  />
                ))}
                <span className="ml-2 text-gray-600 font-medium">
                  {avgScore.toFixed(1)} ({ratings.length})
                </span>
              </div>
            )}
          </div>

          {canRate && (
            <form
              onSubmit={handleSubmitRating}
              className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200"
            >
              <p className="font-medium text-gray-800 mb-4">写下您的评价</p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  评分
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setRatingScore(score)}
                      onMouseEnter={() => setHoverScore(score)}
                      onMouseLeave={() => setHoverScore(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={
                          score <= (hoverScore || ratingScore)
                            ? 'star-rating fill-current'
                            : 'text-gray-300'
                        }
                      />
                    </button>
                  ))}
                  {ratingScore > 0 && (
                    <span className="ml-3 text-gray-600">{ratingScore} 分</span>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  留言（可选）
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  rows={3}
                  placeholder="分享您的活动体验..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingRating || ratingScore < 1}
                  className="btn-ripple flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingRating && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <Send size={18} />
                  <span>提交评价</span>
                </button>
              </div>
            </form>
          )}

          {hasRated && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="text-green-500" size={20} />
              <span className="text-green-700">您已完成评分，感谢您的反馈！</span>
            </div>
          )}

          {ratings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>暂无评分</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="p-5 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="text-primary-500" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {rating.userName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(rating.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={16}
                          className={
                            s <= rating.score
                              ? 'star-rating fill-current'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                  </div>
                  {rating.comment && (
                    <p className="text-gray-600 mt-3 pl-[52px]">
                      {rating.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
