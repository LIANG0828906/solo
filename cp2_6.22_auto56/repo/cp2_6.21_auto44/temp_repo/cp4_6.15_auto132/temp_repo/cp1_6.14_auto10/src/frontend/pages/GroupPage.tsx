import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Users,
  User,
  ArrowLeft,
  Edit,
  Trash2,
  CalendarPlus,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  Group,
  Activity,
  getGroups,
  getGroup,
  getActivities,
  createGroup,
  createActivity,
  deleteGroup,
} from '../utils/apiClient';
import { useUserStore } from '../store/useUserStore';
import GroupCard from '../components/GroupCard';
import ActivityCard from '../components/ActivityCard';
import Modal from '../components/Modal';

export default function GroupPage() {
  const { groupId } = useParams<{ groupId?: string }>();
  const navigate = useNavigate();
  const { user, fetchUser } = useUserStore();
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const [groups, setGroups] = useState<Group[]>([]);
  const [groupDetail, setGroupDetail] = useState<Group | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalActivities, setTotalActivities] = useState(0);

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateActivityModal, setShowCreateActivityModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);

  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    coverImage: '',
  });
  const [activityForm, setActivityForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    maxParticipants: 10,
  });
  const [submitting, setSubmitting] = useState(false);

  const PAGE_SIZE = 20;

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (groupId) {
      loadGroupDetail();
    } else {
      loadGroups();
    }
  }, [groupId]);

  useEffect(() => {
    if (groupId && groupDetail) {
      loadActivities(1, true);
    }
  }, [groupId, groupDetail]);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getGroups(1, 100);
      setGroups(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载小组列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGroupDetail = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const group = await getGroup(groupId);
      setGroupDetail(group);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载小组详情失败');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const loadActivities = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      if (!groupId || loadingRef.current) return;
      loadingRef.current = true;
      try {
        const result = await getActivities(groupId, pageNum, PAGE_SIZE);
        if (reset) {
          setActivities(result.items);
          setPage(1);
        } else {
          setActivities((prev) => [...prev, ...result.items]);
          setPage(pageNum);
        }
        setTotalActivities(result.total);
        setHasMore(result.items.length === PAGE_SIZE && result.items.length < result.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载活动列表失败');
      } finally {
        loadingRef.current = false;
      }
    },
    [groupId]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current && groupId) {
          loadActivities(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, page, loadActivities, groupId]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name.trim() || !groupForm.description.trim() || !groupForm.coverImage.trim()) {
      setError('请填写完整信息');
      return;
    }
    setSubmitting(true);
    try {
      const newGroup = await createGroup(groupForm);
      setShowCreateGroupModal(false);
      setGroupForm({ name: '', description: '', coverImage: '' });
      navigate(`/groups/${newGroup.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建小组失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    if (
      !activityForm.title.trim() ||
      !activityForm.startTime ||
      !activityForm.endTime ||
      !activityForm.location.trim()
    ) {
      setError('请填写完整信息');
      return;
    }
    const startTime = new Date(activityForm.startTime).getTime();
    const endTime = new Date(activityForm.endTime).getTime();
    if (startTime >= endTime) {
      setError('结束时间必须晚于开始时间');
      return;
    }
    setSubmitting(true);
    try {
      await createActivity(groupId, {
        title: activityForm.title,
        description: activityForm.description,
        startTime,
        endTime,
        location: activityForm.location,
        maxParticipants: activityForm.maxParticipants,
      });
      setShowCreateActivityModal(false);
      setActivityForm({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        maxParticipants: 10,
      });
      loadActivities(1, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布活动失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupId || !window.confirm('确定要解散这个小组吗？此操作不可撤销。')) return;
    try {
      await deleteGroup(groupId);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '解散小组失败');
    }
  };

  const isLeader = user && groupDetail && user.id === groupDetail.leaderId;

  if (loading && !groupId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (error && !groupId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-gray-600">{error}</p>
        <button
          onClick={groupId ? loadGroupDetail : loadGroups}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  if (!groupId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">兴趣小组</h1>
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">创建小组</span>
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">还没有小组，快来创建第一个吧！</p>
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              创建小组
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}

        <Modal
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
          title="创建小组"
        >
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                小组名称
              </label>
              <input
                type="text"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="请输入小组名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                小组简介
              </label>
              <textarea
                value={groupForm.description}
                onChange={(e) =>
                  setGroupForm({ ...groupForm, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder="请输入小组简介"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                封面图片URL
              </label>
              <input
                type="url"
                value={groupForm.coverImage}
                onChange={(e) =>
                  setGroupForm({ ...groupForm, coverImage: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                disabled={submitting}
              >
                {submitting && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                创建
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {groupDetail && (
        <>
          <div className="relative h-48 md:h-64 overflow-hidden">
            <img
              src={groupDetail.coverImage}
              alt={groupDetail.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <Link
              to="/"
              className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>返回列表</span>
            </Link>
            {isLeader && (
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => setShowEditGroupModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Edit size={18} />
                  <span className="hidden sm:inline">编辑</span>
                </button>
                <button
                  onClick={() => setShowCreateActivityModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-md"
                >
                  <CalendarPlus size={18} />
                  <span className="hidden sm:inline">发布活动</span>
                </button>
              </div>
            )}
          </div>

          <div className="container mx-auto px-4 -mt-20 relative z-10 pb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                {groupDetail.name}
              </h1>
              <p className="text-gray-600 mb-4">{groupDetail.description}</p>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <User className="text-primary-500" size={20} />
                  <span className="text-gray-600">
                    组长: <span className="font-medium">{groupDetail.leaderName}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="text-primary-500" size={20} />
                  <span className="text-gray-600">
                    <span className="font-medium">{groupDetail.memberCount}</span> 成员
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                活动时间线
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({totalActivities} 个活动)
                </span>
              </h2>

              {loading && activities.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                </div>
              ) : activities.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center">
                  <CalendarPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">暂无活动</p>
                  {isLeader && (
                    <button
                      onClick={() => setShowCreateActivityModal(true)}
                      className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      发布第一个活动
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} showTimeline />
                  ))}
                  {hasMore && (
                    <div ref={observerRef} className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {isLeader && activities.length === 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="text-red-500" size={24} />
                    <div>
                      <p className="font-medium text-red-800">解散小组</p>
                      <p className="text-sm text-red-600">
                        小组还没有任何活动，您可以选择解散此小组
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDeleteGroup}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                    <span>解散小组</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <Modal
            isOpen={showCreateActivityModal}
            onClose={() => setShowCreateActivityModal(false)}
            title="发布活动"
          >
            <form onSubmit={handleCreateActivity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  活动标题
                </label>
                <input
                  type="text"
                  value={activityForm.title}
                  onChange={(e) =>
                    setActivityForm({ ...activityForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  placeholder="请输入活动标题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  活动描述
                </label>
                <textarea
                  value={activityForm.description}
                  onChange={(e) =>
                    setActivityForm({ ...activityForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="请输入活动描述（可选）"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始时间
                  </label>
                  <input
                    type="datetime-local"
                    value={activityForm.startTime}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, startTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束时间
                  </label>
                  <input
                    type="datetime-local"
                    value={activityForm.endTime}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, endTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  活动地点
                </label>
                <input
                  type="text"
                  value={activityForm.location}
                  onChange={(e) =>
                    setActivityForm({ ...activityForm, location: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  placeholder="请输入活动地点"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最大参与人数
                </label>
                <input
                  type="number"
                  min="1"
                  value={activityForm.maxParticipants}
                  onChange={(e) =>
                    setActivityForm({
                      ...activityForm,
                      maxParticipants: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateActivityModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  发布
                </button>
              </div>
            </form>
          </Modal>

          <Modal
            isOpen={showEditGroupModal}
            onClose={() => setShowEditGroupModal(false)}
            title="编辑小组"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowEditGroupModal(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  小组名称
                </label>
                <input
                  type="text"
                  defaultValue={groupDetail.name}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  小组简介
                </label>
                <textarea
                  defaultValue={groupDetail.description}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  封面图片URL
                </label>
                <input
                  type="url"
                  defaultValue={groupDetail.coverImage}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditGroupModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </div>
  );
}
