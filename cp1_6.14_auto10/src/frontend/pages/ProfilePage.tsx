import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  User as UserIcon,
  Users,
  Calendar,
  Star,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { Group, Activity, Rating } from '../utils/apiClient';
import * as api from '../utils/apiClient';
import { useUserStore } from '../store/useUserStore';
import { formatDateTime, getStatusText, getStatusColor } from '../utils/format';

type TabType = 'groups' | 'activities' | 'ratings';

export default function ProfilePage() {
  const { user, fetchUser } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabType>('groups');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'groups') {
        const data = await api.getUserGroups(user.id);
        setGroups(data);
      } else if (activeTab === 'activities') {
        const data = await api.getUserActivities(user.id);
        setActivities(data);
      } else if (activeTab === 'ratings') {
        const data = await api.getUserRatings(user.id);
        setRatings(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tabs: { key: TabType; label: string; icon: typeof Users }[] = [
  { key: 'groups', label: '我的小组', icon: Users },
  { key: 'activities', label: '我的活动', icon: Calendar },
  { key: 'ratings', label: '我的评分', icon: Star },
];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-primary-500 to-primary-400 h-32"></div>
        <div className="px-6 pb-6">
          <div className="-mt-16 flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-12 h-12 text-primary-500" />
              )}
            </div>
            <div className="flex-1 pb-2">
              <h1 className="text-2xl font-bold text-gray-800">
                {user?.name || '加载中...'}
              </h1>
              <p className="text-gray-500">社区成员</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-primary-500 border-b-2 border-primary-500 bg-primary-50'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <Icon size={20} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="text-red-500" size={20} />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : activeTab === 'groups' ? (
            groups.length === 0 ? (
              <EmptyState
                icon={
                  <>
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">您还没有创建任何小组</p>
                    <Link
                      to="/"
                      className="text-primary-500 hover:text-primary-600 font-medium"
                    >
                      去创建第一个小组
                    </Link>
                  </>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group) => (
                  <Link
                    key={group.id && `/groups/${group.id}`}
                    className="card-hover flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary-200 transition-all"
                    to={`/groups/${group.id}`}
                  >
                    <img
                      src={group.coverImage}
                      alt={group.name}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 mb-1 truncate">
                        {group.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                        {group.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {group.memberCount} 成员
                        </span>
                        <span>创建于 {formatDateTime(group.createdAt).split(' ')[0]}</span>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-400 flex-shrink-0" size={20} />
                  </Link>
                ))}
              </div>
            )
          ) : activeTab === 'activities' ? (
            activities.length === 0 ? (
              <EmptyState
                icon={
                  <>
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">您还没有参加任何活动</p>
                    <Link
                      to="/"
                      className="text-primary-500 hover:text-primary-600 font-medium"
                    >
                      去发现感兴趣的活动
                    </Link>
                  </>
                }
              />
            ) : (
              <div className="space-y-4">
                  {activities.map((activity) => (
                    <Link
                      key={activity.id && `/activities/${activity.id}`}
                      className="card-hover block p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary-200 transition-all"
                      to={`/activities/${activity.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-800">
                          {activity.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            activity.status
                          )}`}
                        >
                          {getStatusText(activity.status)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-3">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDateTime(activity.startTime)}
                        </span>
                        <span>{activity.location}</span>
                        <span>
                          {activity.currentParticipants}/
                          {activity.maxParticipants} 人
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )
          ) : ratings.length === 0 ? (
            <EmptyState
              icon={
                <>
                  <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">您还没有任何评分记录</p>
                </>
              }
            />
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="p-5 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={18}
                          className={
                            s <= rating.score
                              ? 'star-rating fill-current'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                      <span className="ml-2 text-gray-600 font-medium">
                        {rating.score} 分
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDateTime(rating.createdAt)}
                    </span>
                  </div>
                  {rating.comment && (
                    <p className="text-gray-600">{rating.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="text-center py-16 flex flex-col items-center">
      {icon}
    </div>
  );
}
