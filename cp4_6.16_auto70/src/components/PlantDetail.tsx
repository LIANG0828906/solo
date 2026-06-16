import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Calendar,
  Flower,
  Plus,
  Loader2,
  Droplets,
  TrendingUp,
} from 'lucide-react';
import { usePlantStore } from '@/store/plantStore';
import CareTimeline from './CareTimeline';
import WateringChart from './charts/WateringChart';
import KeywordChart from './charts/KeywordChart';
import AddCareLogModal from './AddCareLogModal';
import AddPlantModal from './AddPlantModal';
import { formatDate } from '@/utils/date';
import { useShallow } from 'zustand/react/shallow';

export default function PlantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAddLog, setShowAddLog] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const plant = usePlantStore((state) => (id ? state.getPlantById(id) : undefined));
  const logs = usePlantStore(
    useShallow((state) =>
      id
        ? state.careLogs
            .filter((l) => l.plantId === id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : []
    )
  );
  const addCareLog = usePlantStore((state) => state.addCareLog);
  const updatePlant = usePlantStore((state) => state.updatePlant);
  const deletePlant = usePlantStore((state) => state.deletePlant);

  const stats = useMemo(() => {
    const typeCounts: Record<string, number> = { water: 0, fertilize: 0, prune: 0, sunlight: 0 };
    for (const l of logs) {
      typeCounts[l.type] = (typeCounts[l.type] || 0) + 1;
    }
    const heights = logs.filter((l) => l.height != null).map((l) => l.height as number);
    const latestHeight = heights.length > 0 ? heights[heights.length - 1] : null;
    const maxHeight = heights.length > 0 ? Math.max(...heights) : null;
    const firstDate = logs.length > 0 ? logs[logs.length - 1].date : null;
    return { typeCounts, latestHeight, maxHeight, firstDate, total: logs.length };
  }, [logs]);

  if (!plant) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Flower className="w-16 h-16 text-primary/30 mb-4" />
        <h2 className="text-xl font-serif font-semibold mb-2">植物不存在</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-5 py-2.5 bg-primary text-white rounded-full font-medium text-sm shadow-md hover:shadow-lg hover:bg-primary-dark transition-all"
        >
          返回列表
        </button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!window.confirm(`确定要删除「${plant.name}」及其所有养护记录吗？此操作不可恢复。`)) return;
    setDeleting(true);
    try {
      if (id) {
        await deletePlant(id);
        navigate('/');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-app-text-light hover:text-app-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-card border border-primary/5 overflow-hidden">
            <div className="aspect-[4/3] w-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
              {plant.photo ? (
                <img src={plant.photo} alt={plant.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Flower className="w-24 h-24 text-primary/30" />
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6">
              <h2 className="text-2xl font-serif font-semibold text-app-text mb-1">
                {plant.name}
              </h2>
              <p className="text-primary font-medium text-sm mb-4">{plant.species}</p>

              <div className="space-y-2.5 mb-5 pt-4 border-t border-primary/5">
                <div className="flex items-center gap-2 text-sm text-app-text-light">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>购入日期：{formatDate(plant.purchaseDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-app-text-light">
                  <Droplets className="w-4 h-4 shrink-0" />
                  <span>养护记录：{stats.total} 条</span>
                </div>
                {stats.latestHeight != null && (
                  <div className="flex items-center gap-2 text-sm text-app-text-light">
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    <span>
                      最新高度：{stats.latestHeight}cm
                      {stats.maxHeight && stats.maxHeight !== stats.latestHeight
                        ? `（最高 ${stats.maxHeight}cm）`
                        : ''}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 mb-5">
                {(['water', 'fertilize', 'prune', 'sunlight'] as const).map((type) => (
                  <div
                    key={type}
                    className="p-2.5 rounded-xl bg-app-bg/60 text-center"
                    title={{ water: '浇水', fertilize: '施肥', prune: '修剪', sunlight: '日照调整' }[type]}
                  >
                    <div className="text-lg font-semibold text-primary">
                      {stats.typeCounts[type]}
                    </div>
                    <div className="text-[10px] text-app-text-light mt-0.5">
                      {{ water: '浇水', fertilize: '施肥', prune: '修剪', sunlight: '日照' }[type]}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowEdit(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-primary/20 text-app-text font-medium text-sm hover:bg-app-bg transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  编辑
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-200 text-red-500 font-medium text-sm hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  删除
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 lg:hidden">
            <button
              onClick={() => setShowAddLog(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-primary text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:bg-primary-dark transition-all"
            >
              <Plus className="w-4 h-4" />
              添加养护记录
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-card border border-primary/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-semibold text-base">浇水频率</h3>
                  <p className="text-xs text-app-text-light mt-0.5">近6周统计</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-water/10 flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-water" />
                </div>
              </div>
              <WateringChart logs={logs} />
            </div>

            <div className="bg-white rounded-2xl shadow-card border border-primary/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-semibold text-base">生长趋势</h3>
                  <p className="text-xs text-app-text-light mt-0.5">高度 / 关键词频次</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
              </div>
              <KeywordChart logs={logs} />
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky bottom-6 flex justify-end">
              <button
                onClick={() => setShowAddLog(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium shadow-lg hover:shadow-xl hover:bg-primary-dark transition-all hover:-translate-y-0.5 z-20"
              >
                <Plus className="w-5 h-5" />
                添加养护记录
              </button>
            </div>
          </div>

          <CareTimeline plantId={id!} onAddLog={() => setShowAddLog(true)} />
        </div>
      </div>

      <AddCareLogModal
        open={showAddLog}
        onClose={() => setShowAddLog(false)}
        plantId={id!}
        plantName={plant.name}
        onSubmit={async (data) => {
          await addCareLog({ ...data, plantId: id! });
        }}
      />

      <AddPlantModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        editData={plant}
        onSubmit={async (data) => {
          await updatePlant(id!, data);
        }}
      />
    </div>
  );
}
