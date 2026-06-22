import { useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import { useCarbonStore } from '@/store/carbonStore';
import ActivityForm from '@/components/Activities/ActivityForm';
import ActivityList from '@/components/Activities/ActivityList';
import type { Activity, ActivityType } from '@/types';
import { ACTIVITY_TYPE_LABELS, ALL_FACTORS, getFactor } from '@/constants/emissionFactors';

const Activities = () => {
  const {
    activities,
    addActivity,
    updateActivity,
    deleteActivity,
  } = useCarbonStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<Activity | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSubtype, setFilterSubtype] = useState<string>('');

  const openAdd = () => {
    setEditData(null);
    setFormOpen(true);
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
    const res = await addActivity(values.type, values.subtype, values.value, values.date);
    return !!res;
  };

  const handleDelete = async (activity: Activity) => {
    await deleteActivity(activity.id);
  };

  const subtypeFilters = filterType !== 'all'
    ? ALL_FACTORS.filter((f) => f.type === filterType)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            活动记录
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            管理和查看您的所有碳排放活动记录
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          新增记录
        </button>
      </div>

      <div className="card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">筛选条件</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1.5">活动类型</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setFilterSubtype('');
              }}
              className="input-field"
            >
              <option value="all">全部类型</option>
              {(['transport', 'diet', 'electricity'] as ActivityType[]).map((t) => (
                <option key={t} value={t}>
                  {ACTIVITY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1.5">具体活动</label>
            <select
              value={filterSubtype}
              onChange={(e) => setFilterSubtype(e.target.value)}
              disabled={filterType === 'all'}
              className="input-field disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">全部活动</option>
              {subtypeFilters.map((f) => (
                <option key={f.subtype} value={f.subtype}>
                  {f.icon} {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterType('all');
                setFilterSubtype('');
              }}
              className="btn-secondary w-full sm:w-auto"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      <ActivityList
        activities={activities}
        onEdit={openEdit}
        onDelete={handleDelete}
        filterType={filterType === 'all' ? undefined : filterType}
        filterSubtype={filterSubtype || undefined}
      />

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

export default Activities;
