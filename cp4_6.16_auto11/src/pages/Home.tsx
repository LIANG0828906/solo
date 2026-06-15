import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Map as MapIcon,
  Edit3,
  Calendar,
  BookOpen,
  Sun,
  Moon,
  Trash2,
  X,
  Camera,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useTripStore } from '@/shared/data/TripStore';
import type { Trip } from '@/shared/types';
import { useThemeContext } from '@/App';
import { cn } from '@/lib/utils';

function CreateTripModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    startDate: string;
    endDate?: string;
  }) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      startDate,
      endDate: endDate || startDate,
    });
    setName('');
    setDescription('');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-playfair" style={{ color: 'var(--color-text)' }}>
            创建新旅程
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-opacity-10 transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              旅程名称 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：云南大理七日游"
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              旅程简介
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="记录这段旅程的期待..."
              rows={3}
              className="form-input resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                开始日期 *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                结束日期
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="btn-primary flex-1">
              创建旅程
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TripCard({ trip, onEdit, onMapView, onDelete }: {
  trip: Trip;
  onEdit: () => void;
  onMapView: () => void;
  onDelete: () => void;
}) {
  const photoCount = trip.pages.reduce((sum, page) => sum + page.photos.length, 0);

  return (
    <div
      className={cn('trip-card page-corner-curl')}
      style={{ position: 'relative' }}
    >
      <div className="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-xl"
        style={{
          background: trip.coverImage
            ? `url(${trip.coverImage}) center/cover`
            : 'linear-gradient(135deg, var(--color-accent-light) 0%, var(--color-bg-secondary) 100%)',
        }}
      >
        {!trip.coverImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera size={48} style={{ color: 'var(--color-accent)', opacity: 0.4 }} />
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onMapView(); }}
            className="p-2 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white transition-all hover:scale-105 shadow-sm"
            style={{ color: 'var(--color-primary)' }}
            title="地图视图"
          >
            <MapIcon size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-red-50 transition-all hover:scale-105 shadow-sm"
            style={{ color: 'var(--color-danger)' }}
            title="删除旅程"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <h3 className="text-xl font-playfair mb-2" style={{ color: 'var(--color-text)' }}>
        {trip.name}
      </h3>

      {trip.description && (
        <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
          {trip.description}
        </p>
      )}

      <div className="flex items-center gap-4 text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          <span>{format(new Date(trip.startDate), 'yyyy年MM月dd日', { locale: zhCN })}</span>
        </div>
        <div className="flex items-center gap-1">
          <BookOpen size={14} />
          <span>{trip.pages.length} 天</span>
        </div>
        <div className="flex items-center gap-1">
          <Camera size={14} />
          <span>{photoCount} 张照片</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2"
        >
          <Edit3 size={16} />
          编辑旅程
        </button>
        <button
          onClick={onMapView}
          className="btn-secondary flex items-center justify-center gap-2 text-sm py-2 px-4"
        >
          <MapIcon size={16} />
          地图
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { trips, createTrip, deleteTrip } = useTripStore();
  const { isDark, toggleTheme } = useThemeContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateTrip = (data: {
    name: string;
    description: string;
    startDate: string;
    endDate?: string;
  }) => {
    const newTrip = addTrip(data);
    setIsModalOpen(false);
    navigate(`/trip/${newTrip.id}`);
  };

  const handleDeleteTrip = (id: string, name: string) => {
    if (window.confirm(`确定要删除旅程"${name}"吗？此操作无法撤销。`)) {
      deleteTrip(id);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 z-40 backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(var(--color-bg), 0.85)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-accent-light)' }}
            >
              <BookOpen size={22} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h1 className="text-xl font-playfair font-bold" style={{ color: 'var(--color-text)' }}>
                TravelMemoir
              </h1>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                旅行记忆剪贴簿
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--color-card-secondary)' }}
              title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
            >
              {isDark ? (
                <Sun size={20} style={{ color: 'var(--color-accent)' }} />
              ) : (
                <Moon size={20} style={{ color: 'var(--color-text-secondary)' }} />
              )}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">新建旅程</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-playfair mb-3" style={{ color: 'var(--color-text)' }}>
            我的旅记
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {trips.length > 0
              ? `共记录了 ${trips.length} 段旅程，每一段都是独一无二的回忆。`
              : '开始记录你的第一段旅程吧！'}
          </p>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-20 rounded-2xl"
            style={{
              backgroundColor: 'var(--color-card)',
              border: '2px dashed var(--color-border)',
            }}
          >
            <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-accent-light)' }}
            >
              <MapIcon size={40} style={{ color: 'var(--color-primary)' }} />
            </div>
            <h3 className="text-xl font-playfair mb-2" style={{ color: 'var(--color-text)' }}>
              还没有任何旅程
            </h3>
            <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
              点击下方按钮，开始记录你的第一段旅行记忆
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus size={18} />
              创建第一个旅程
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onEdit={() => navigate(`/trip/${trip.id}`)}
                onMapView={() => navigate(`/map/${trip.id}`)}
                onDelete={() => handleDeleteTrip(trip.id, trip.name)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateTripModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTrip}
      />
    </div>
  );
}
