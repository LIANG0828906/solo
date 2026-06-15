import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy, ChevronRight, ArrowLeft } from 'lucide-react';
import { useCarbonStore } from '@/store/carbonStore';
import ActivityList from '@/components/Activities/ActivityList';
import ActivityForm from '@/components/Activities/ActivityForm';
import type { Activity, LeaderboardItem as LBItem } from '@/types';
import { formatNumber } from '@/utils/calculations';
import { getFactor, ACTIVITY_TYPE_LABELS } from '@/constants/emissionFactors';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    leaderboard,
    activities,
    totalEmission: _total,
    updateActivity,
    deleteActivity,
  } = useCarbonStore();

  const filterSubtype = searchParams.get('subtype');
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<Activity | null>(null);

  const totalEmission = useMemo(() => {
    return leaderboard.reduce((s, item) => s + item.totalEmission, 0);
  }, [leaderboard]);

  const selectedItem = useMemo(() => {
    if (!filterSubtype) return null;
    return leaderboard.find((l) => l.subtype === filterSubtype);
  }, [filterSubtype, leaderboard]);

  const getRowBg = (item: LBItem, index: number) => {
    const maxEmission = leaderboard[0]?.totalEmission || 1;
    const ratio = item.totalEmission / maxEmission;
    const intensity = Math.min(ratio, 1);

    if (index === 0) {
      return 'rgba(239, 83, 80, 0.12)';
    }
    if (index === 1) {
      return 'rgba(255, 167, 38, 0.10)';
    }
    if (index === 2) {
      return 'rgba(255, 204, 128, 0.08)';
    }

    const r = Math.round(255 - (255 - 46) * intensity * 0.15);
    const g = Math.round(255 - (255 - 125) * intensity * 0.25);
    const b = Math.round(255 - (255 - 50) * intensity * 0.05);
    return `rgba(${r}, ${g}, ${b}, ${0.03 + intensity * 0.06})`;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return index + 1;
  };

  const openEdit = (activity: Activity) => {
    setEditData(activity);
    setFormOpen(true);
  };

  const handleSubmit = async (
    values: Omit<Activity, 'id' | 'emission' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (editData) {
      const res = await updateActivity(
        editData.id,
        values.type,
        values.subtype,
        values.value,
        values.date,
      );
      return !!res;
    }
    return false;
  };

  const handleDelete = async (activity: Activity) => {
    await deleteActivity(activity.id);
  };

  const backToList = () => {
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {filterSubtype && (
              <button
                onClick={backToList}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="返回排行"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {filterSubtype ? `${selectedItem?.label || ''} 活动详情` : '碳排放排行榜'}
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {filterSubtype
              ? `查看${selectedItem?.label || ''}的详细活动记录`
              : `按活动类型统计总碳排放 · 累计 ${formatNumber(totalEmission)} kg CO₂`}
          </p>
        </div>
      </div>

      {!filterSubtype ? (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-r from-accent-100/40 to-primary-50/60">
            <Trophy className="w-5 h-5 text-accent-400" />
            <span className="font-bold text-gray-800">活动类型排放排行</span>
            <span className="text-xs text-gray-500 ml-auto">
              点击任意行查看详细记录
            </span>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4 opacity-40">🏆</div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">
                暂无排行数据
              </h4>
              <p className="text-sm text-gray-500">
                添加活动记录后，这里会显示各类活动的碳排放排行
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {leaderboard.map((item, idx) => {
                const barWidth = totalEmission > 0
                  ? (item.totalEmission / leaderboard[0].totalEmission) * 100
                  : 0;

                return (
                  <button
                    key={item.subtype}
                    onClick={() => setSearchParams({ subtype: item.subtype })}
                    className="w-full text-left relative px-5 py-4 hover:bg-primary-50/30 transition-colors overflow-hidden group"
                    style={{ backgroundColor: getRowBg(item, idx) }}
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 opacity-20 transition-opacity group-hover:opacity-35"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: item.color,
                      }}
                    />

                    <div className="relative flex items-center gap-4">
                      <div className="w-10 text-center text-xl flex-shrink-0">
                        {getRankBadge(idx)}
                      </div>

                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
                        style={{
                          background: `${item.color}15`,
                          border: `1px solid ${item.color}30`,
                        }}
                      >
                        {item.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800 text-base">
                            {item.label}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {ACTIVITY_TYPE_LABELS[item.type]}
                          </span>
                          <span className="text-xs text-gray-400">
                            {item.count} 次记录
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 text-xs">
                          <div className="h-1.5 flex-1 max-w-[200px] rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${totalEmission > 0 ? item.percentage : 0}%`,
                                backgroundColor: item.color,
                              }}
                            />
                          </div>
                          <span className="text-gray-500 font-medium tabular-nums whitespace-nowrap">
                            占比 {item.percentage}%
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div
                          className="text-xl font-bold tabular-nums"
                          style={{ color: item.color }}
                        >
                          {formatNumber(item.totalEmission, 1)}
                        </div>
                        <div className="text-xs text-gray-500">kg CO₂</div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-600 transition-colors flex-shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {selectedItem && (
            <div
              className="card p-5 border-l-4"
              style={{ borderLeftColor: selectedItem.color }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{
                    background: `${selectedItem.color}15`,
                    border: `2px solid ${selectedItem.color}30`,
                  }}
                >
                  {selectedItem.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedItem.label}
                    </h2>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {ACTIVITY_TYPE_LABELS[selectedItem.type]}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                    <div>
                      <span className="text-gray-500 mr-1">总排放：</span>
                      <span className="font-bold tabular-nums" style={{ color: selectedItem.color }}>
                        {formatNumber(selectedItem.totalEmission, 2)} kg CO₂
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 mr-1">记录次数：</span>
                      <span className="font-medium text-gray-700">{selectedItem.count} 次</span>
                    </div>
                    <div>
                      <span className="text-gray-500 mr-1">占比：</span>
                      <span className="font-medium text-gray-700">{selectedItem.percentage}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500 mr-1">排放系数：</span>
                      <span className="font-medium text-gray-700">
                        {getFactor(selectedItem.type, selectedItem.subtype)?.factor || 0}{' '}
                        kg / {getFactor(selectedItem.type, selectedItem.subtype)?.unit || '次'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <ActivityList
            activities={activities}
            onEdit={openEdit}
            onDelete={handleDelete}
            filterSubtype={filterSubtype || undefined}
          />
        </>
      )}

      <ActivityForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditData(null);
        }}
        onSubmit={handleSubmit}
        editData={editData}
      />
    </div>
  );
};

export default Leaderboard;
