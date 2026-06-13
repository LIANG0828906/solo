import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Plus, Star, Edit, Trash2, Save, X, Clock, AlertTriangle } from 'lucide-react';
import ProgressRing from '../components/ProgressRing';
import ProgressChart from '../components/ProgressChart';
import type { Objective, CheckInRequest, CheckInRecord } from '../../types';
import { objectivesApi } from '../utils/api';
import { calculateObjectiveProgress, calculateKRProgress, getStatusInfo, getProgressColor, getAvatarColor, getInitials, formatDate, getQuarterWeeks, getWeekNumber } from '../utils/helpers';
import Toast from '../components/Toast';

interface ObjectiveDetailProps {
  onObjectiveUpdate?: () => void;
}

const ObjectiveDetail: React.FC<ObjectiveDetailProps> = ({ onObjectiveUpdate }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [objective, setObjective] = useState<Objective | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkInModal, setCheckInModal] = useState<{ krId: string; krTitle: string } | null>(null);
  const [checkInPercent, setCheckInPercent] = useState(0);
  const [checkInNote, setCheckInNote] = useState('');
  const [checkInBy, setCheckInBy] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    if (id) {
      loadObjective();
    }
  }, [id]);

  const loadObjective = async () => {
    try {
      setLoading(true);
      const data = await objectivesApi.getById(id!);
      setObjective(data);
      setEditTitle(data.title);
      setEditDescription(data.description);
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : '加载失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const weeks = useMemo(() => {
    if (!objective) return [];
    return getQuarterWeeks(objective.quarter, objective.year);
  }, [objective]);

  const weekCheckIns = useMemo(() => {
    if (!objective) return [];
    const allCheckIns: (CheckInRecord & { krTitle: string })[] = [];
    objective.checkIns.forEach(checkin => {
      const weekNum = getWeekNumber(checkin.date, objective.quarter, objective.year);
      if (weekNum === selectedWeek) {
        const kr = objective.keyResults.find(k => k.id === checkin.keyResultId);
        allCheckIns.push({
          ...checkin,
          krTitle: kr?.title || ''
        });
      }
    });
    return allCheckIns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [objective, selectedWeek]);

  const handleWeekChange = (week: number) => {
    setFadeKey(prev => prev + 1);
    setTimeout(() => {
      setSelectedWeek(week);
    }, 200);
  };

  const handleCheckIn = async () => {
    if (!objective || !checkInModal) return;
    
    if (!checkInBy.trim()) {
      setToast({ message: '请输入更新者姓名', type: 'error' });
      return;
    }

    try {
      const request: CheckInRequest = {
        keyResultId: checkInModal.krId,
        percentComplete: checkInPercent,
        note: checkInNote,
        updatedBy: checkInBy.trim()
      };
      
      const updated = await objectivesApi.checkIn(objective.id, request);
      setObjective(updated);
      setCheckInModal(null);
      setCheckInPercent(0);
      setCheckInNote('');
      setCheckInBy('');
      setToast({ message: '进度更新成功', type: 'success' });
      if (onObjectiveUpdate) onObjectiveUpdate();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : '更新失败', type: 'error' });
    }
  };

  const handleSaveEdit = async () => {
    if (!objective) return;
    
    if (!editTitle.trim() || !editDescription.trim()) {
      setToast({ message: '请填写完整信息', type: 'error' });
      return;
    }

    try {
      const updated = await objectivesApi.update(objective.id, {
        title: editTitle.trim(),
        description: editDescription.trim()
      });
      setObjective(updated);
      setIsEditing(false);
      setToast({ message: '更新成功', type: 'success' });
      if (onObjectiveUpdate) onObjectiveUpdate();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : '更新失败', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!objective) return;
    
    if (!window.confirm('确定要删除这个目标吗？此操作不可撤销。')) return;

    try {
      await objectivesApi.delete(objective.id);
      setToast({ message: '删除成功', type: 'success' });
      if (onObjectiveUpdate) onObjectiveUpdate();
      setTimeout(() => navigate('/objectives'), 1000);
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : '删除失败', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1a237e] border-t-transparent"></div>
      </div>
    );
  }

  if (!objective) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">目标不存在</p>
        <button
          onClick={() => navigate('/objectives')}
          className="text-[#1a237e] hover:underline"
        >
          返回目标列表
        </button>
      </div>
    );
  }

  const progress = calculateObjectiveProgress(objective);
  const statusInfo = getStatusInfo(objective.status);
  const avatarColor = getAvatarColor(objective.owner);

  const sortedCheckIns = [...objective.checkIns].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/objectives')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-2xl font-bold text-gray-800 w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a237e]/50"
            />
          ) : (
            <h1 className="text-2xl font-bold text-gray-800">{objective.title}</h1>
          )}
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Save size={20} />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(objective.title);
                  setEditDescription(objective.description);
                }}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit size={20} />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a237e]/50"
          rows={3}
        />
      ) : (
        <p className="text-gray-600">{objective.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: avatarColor }}
          >
            {getInitials(objective.owner)}
          </div>
          <div>
            <div className="text-gray-500">负责人</div>
            <div className="font-medium text-gray-800">{objective.owner}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          <div>
            <div className="text-gray-500">周期</div>
            <div className="font-medium text-gray-800">{objective.year} {objective.quarter}</div>
          </div>
        </div>
        <div>
          <div className="text-gray-500">状态</div>
          <span
            className="px-2.5 py-1 rounded text-xs font-medium"
            style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ProgressRing progress={progress} size={160} strokeWidth={14} />
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
            {objective.keyResults.map((kr, index) => {
              const krProgress = calculateKRProgress(kr);
              return (
                <div key={kr.id} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">KR{index + 1}</div>
                  <div
                    className="text-2xl font-bold"
                    style={{ color: getProgressColor(krProgress) }}
                  >
                    {krProgress}%
                  </div>
                  <div className="text-xs text-gray-600 mt-1 truncate">{kr.title}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">关键结果</h3>
        </div>
        <div className="space-y-4">
          {objective.keyResults.map((kr) => {
            const krProgress = calculateKRProgress(kr);
            return (
              <div key={kr.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{kr.title}</h4>
                    <div className="text-sm text-gray-500 mt-1">
                      当前: {kr.currentValue}{kr.unit} / 目标: {kr.targetValue}{kr.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-xl font-bold"
                      style={{ color: getProgressColor(krProgress) }}
                    >
                      {krProgress}%
                    </div>
                    <div className="flex items-center gap-0.5 mt-1 justify-end">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          fill={star <= kr.confidence ? '#fbbf24' : 'none'}
                          className={star <= kr.confidence ? 'text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${krProgress}%`,
                      backgroundColor: getProgressColor(krProgress),
                      animation: 'progressFill 1s ease-in forwards'
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    setCheckInModal({ krId: kr.id, krTitle: kr.title });
                    setCheckInPercent(krProgress);
                  }}
                  className="text-sm text-[#1a237e] hover:text-[#3949ab] font-medium flex items-center gap-1"
                >
                  <Plus size={14} />
                  更新进度
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <ProgressChart objective={objective} />

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Clock size={20} className="text-[#1a237e]" />
            周期检视
          </h3>
        </div>
        <div className="flex">
          <div className="w-48 border-r border-gray-100 bg-gray-50">
            {weeks.map((weekLabel, index) => (
              <button
                key={index}
                onClick={() => handleWeekChange(index + 1)}
                className={`w-full px-4 py-3 text-left text-sm transition-all ${
                  selectedWeek === index + 1
                    ? 'bg-[#1a237e] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {weekLabel}
              </button>
            ))}
          </div>
          <div key={fadeKey} className="flex-1 p-5 min-h-[300px] fade-enter">
            {weekCheckIns.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Clock size={48} className="mb-2" />
                <p>本周暂无检视记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                {weekCheckIns.map((checkin) => {
                  const kr = objective.keyResults.find(k => k.id === checkin.keyResultId);
                  return (
                    <div key={checkin.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-gray-800">
                            {kr?.title || checkin.keyResultId}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {formatDate(checkin.date)} · {checkin.updatedBy}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className="text-lg font-bold"
                            style={{ color: getProgressColor(checkin.percentComplete) }}
                          >
                            {checkin.percentComplete}%
                          </div>
                        </div>
                      </div>
                      {checkin.note && (
                        <p className="text-sm text-gray-600 bg-white p-3 rounded">
                          {checkin.note}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-5">
        <h3 className="text-lg font-bold text-gray-800 mb-4">全部更新记录</h3>
        {sortedCheckIns.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>暂无更新记录</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-6">
              {sortedCheckIns.map((checkin, index) => {
                const kr = objective.keyResults.find(k => k.id === checkin.keyResultId);
                return (
                  <div key={checkin.id} className="relative pl-14">
                    <div
                      className="absolute left-4 w-4 h-4 rounded-full border-4 border-white"
                      style={{
                        backgroundColor: getProgressColor(checkin.percentComplete),
                        boxShadow: '0 0 0 2px #e5e7eb'
                      }}
                    />
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-gray-800">
                            {kr?.title || checkin.keyResultId}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {formatDate(checkin.date)} · {checkin.updatedBy}
                          </div>
                        </div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: getProgressColor(checkin.percentComplete) }}
                        >
                          {checkin.percentComplete}%
                        </div>
                      </div>
                      {checkin.note && (
                        <p className="text-sm text-gray-600 bg-white p-3 rounded">
                          {checkin.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {checkInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">更新进度</h3>
              <button
                onClick={() => setCheckInModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{checkInModal.krTitle}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  完成百分比: {checkInPercent}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={checkInPercent}
                  onChange={(e) => setCheckInPercent(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1a237e]"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  value={checkInNote}
                  onChange={(e) => setCheckInNote(e.target.value)}
                  placeholder="描述本次更新内容..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a237e]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  更新者 *
                </label>
                <input
                  type="text"
                  value={checkInBy}
                  onChange={(e) => setCheckInBy(e.target.value)}
                  placeholder="请输入您的姓名"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a237e]/50"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setCheckInModal(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium btn hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleCheckIn}
                  className="px-4 py-2 bg-[#1a237e] text-white rounded-lg font-medium btn hover:bg-[#3949ab]"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectiveDetail;
