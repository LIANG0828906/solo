import { useState, useRef } from 'react';
import { Plus, Trash2, RefreshCw, X, Users, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import ParticipantAvatar from './ParticipantAvatar';
import type { Activity } from '@/types';

type TabType = 'active' | 'completed';

export default function ActivityList() {
  const { activities, loading, fetchActivities, createActivity, deleteActivity, setCurrentActivity } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newActivityName, setNewActivityName] = useState('');
  const [newParticipants, setNewParticipants] = useState('');
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);

  const filteredActivities = activities.filter(a => 
    activeTab === 'active' ? a.status === 'active' : a.status === 'completed'
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
      isDraggingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const currentY = e.touches[0].clientY;
    const distance = Math.min(currentY - startYRef.current, 100);
    if (distance > 0) {
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    isDraggingRef.current = false;
    if (pullDistance > 60) {
      setIsRefreshing(true);
      await fetchActivities();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  };

  const handleCreateActivity = async () => {
    if (!newActivityName.trim()) return;
    const participantNames = newParticipants.split(',').map(p => p.trim()).filter(Boolean);
    if (participantNames.length === 0) return;
    
    await createActivity(newActivityName.trim(), participantNames);
    setNewActivityName('');
    setNewParticipants('');
    setShowCreateModal(false);
  };

  const handleDeleteActivity = async (id: string) => {
    await deleteActivity(id);
    setDeleteConfirmId(null);
  };

  const handleActivityClick = (activity: Activity) => {
    setCurrentActivity(activity.id);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalAmount = (activity: Activity) => {
    return activity.expenses.reduce((sum, e) => sum + e.amount, 0);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold text-[#4A3B32]">活动列表</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-capsule flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>创建活动</span>
        </button>
      </div>

      <div className="flex px-6 gap-8 border-b border-[#E0D5C1]">
        <button
          onClick={() => setActiveTab('active')}
          className={cn(
            'pb-3 px-2 text-base transition-colors flex items-center gap-2',
            activeTab === 'active' ? 'tab-active' : 'text-[#8B7D6B]'
          )}
        >
          <Clock className="w-4 h-4" />
          <span>进行中</span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={cn(
            'pb-3 px-2 text-base transition-colors flex items-center gap-2',
            activeTab === 'completed' ? 'tab-active' : 'text-[#8B7D6B]'
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>已完成</span>
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto scrollbar-hide"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="pull-refresh"
          style={{ transform: `translateY(${pullDistance}px)` }}
        >
          {pullDistance > 0 && (
            <div className="flex items-center justify-center py-4 text-[#8B7D6B]">
              <RefreshCw
                className={cn('w-5 h-5 mr-2', isRefreshing && 'animate-spin')}
              />
              <span className="text-sm">
                {isRefreshing ? '刷新中...' : pullDistance > 60 ? '释放刷新' : '下拉刷新'}
              </span>
            </div>
          )}

          <div className="p-6 space-y-4">
            {loading && !isRefreshing ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-[#D4A574]" />
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#8B7D6B]">
                <Users className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg">暂无{activeTab === 'active' ? '进行中' : '已完成'}的活动</p>
                <p className="text-sm mt-2">点击右上角按钮创建新活动</p>
              </div>
            ) : (
              filteredActivities.map(activity => (
                <div
                  key={activity.id}
                  className="activity-card relative overflow-hidden"
                  style={{ borderRadius: '16px', borderWidth: '1px' }}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{
                      backgroundColor: activity.status === 'active' ? '#D4A574' : '#8B7D6B'
                    }}
                  />
                  
                  <div className="ml-2 p-4">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleActivityClick(activity)}
                      >
                        <h3 className="text-lg font-semibold text-[#4A3B32] mb-1">
                          {activity.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-[#8B7D6B] mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(activity.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {activity.participants.length}人
                          </span>
                          <span className="font-semibold text-[#D4A574]">
                            ¥{getTotalAmount(activity).toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {activity.participants.slice(0, 5).map(participant => (
                            <ParticipantAvatar
                              key={participant.id}
                              participant={participant}
                            />
                          ))}
                          {activity.participants.length > 5 && (
                            <div className="w-10 h-10 rounded-full bg-[#E0D5C1] flex items-center justify-center text-sm font-medium text-[#8B7D6B]">
                              +{activity.participants.length - 5}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(activity.id);
                        }}
                        className="p-2 text-[#8B7D6B] hover:text-[#FF6B6B] transition-colors rounded-full hover:bg-[#F7F1E3]"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#4A3B32]">创建新活动</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-[#8B7D6B] hover:text-[#4A3B32] transition-colors rounded-full hover:bg-[#F7F1E3]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4A3B32] mb-2">
                  活动名称
                </label>
                <input
                  type="text"
                  value={newActivityName}
                  onChange={e => setNewActivityName(e.target.value)}
                  placeholder="例如：周末聚餐"
                  className="w-full px-4 py-3 rounded-xl border border-[#E0D5C1] focus:outline-none focus:border-[#D4A574] focus:ring-2 focus:ring-[#D4A574]/20 transition-all text-[#4A3B32]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4A3B32] mb-2">
                  参与人员
                </label>
                <input
                  type="text"
                  value={newParticipants}
                  onChange={e => setNewParticipants(e.target.value)}
                  placeholder="用逗号分隔，例如：小明,小红,小刚"
                  className="w-full px-4 py-3 rounded-xl border border-[#E0D5C1] focus:outline-none focus:border-[#D4A574] focus:ring-2 focus:ring-[#D4A574]/20 transition-all text-[#4A3B32]"
                />
                <p className="text-xs text-[#8B7D6B] mt-1">
                  输入参与者姓名，用英文或中文逗号分隔
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3 rounded-full border border-[#E0D5C1] text-[#8B7D6B] font-medium transition-all hover:bg-[#F7F1E3]"
              >
                取消
              </button>
              <button
                onClick={handleCreateActivity}
                disabled={!newActivityName.trim() || !newParticipants.trim()}
                className="btn-capsule flex-1"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[#4A3B32] mb-2">确认删除</h2>
            <p className="text-[#8B7D6B] mb-6">
              删除后将无法恢复，确定要删除这个活动吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-6 py-3 rounded-full border border-[#E0D5C1] text-[#8B7D6B] font-medium transition-all hover:bg-[#F7F1E3]"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteActivity(deleteConfirmId)}
                className="flex-1 px-6 py-3 rounded-full bg-[#FF6B6B] text-white font-medium transition-all hover:bg-[#FF5252] hover:-translate-y-0.5"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
