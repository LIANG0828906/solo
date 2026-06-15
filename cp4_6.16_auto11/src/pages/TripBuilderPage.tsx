import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Map as MapIcon,
  Sun,
  Moon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useTripStore } from '@/shared/data/TripStore';
import { useThemeContext } from '@/App';
import { cn } from '@/lib/utils';
import TripEditor from '@/modules/trip-builder/components/TripEditor';

function PageSidebar({
  pages,
  selectedPageId,
  onSelectPage,
  onAddPage,
  onDeletePage,
}: {
  pages: { id: string; title: string; date: string; photos: { id: string; url: string }[]; pageNumber: number }[];
  selectedPageId: string | null;
  onSelectPage: (id: string) => void;
  onAddPage: () => void;
  onDeletePage: (id: string) => void;
}) {
  const sortedPages = useMemo(() => {
    return [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  }, [pages]);

  return (
    <aside
      className="sidebar rounded-2xl p-5 flex flex-col h-full"
      style={{
        backgroundColor: 'var(--color-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-playfair" style={{ color: 'var(--color-text)' }}>
          旅程页面
        </h3>
        <button
          onClick={onAddPage}
          className="p-2 rounded-lg transition-all hover:scale-105"
          style={{ backgroundColor: 'var(--color-accent-light)' }}
          title="添加页面"
        >
          <Plus size={18} style={{ color: 'var(--color-primary)' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 -mx-2 px-2">
        {sortedPages.length === 0 ? (
          <div className="text-center py-10 rounded-xl"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px dashed var(--color-border)',
            }}
          >
            <ImageIcon size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)', opacity: 0.5 }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              暂无页面
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>
              点击 + 号创建第一个页面
            </p>
          </div>
        ) : (
          sortedPages.map((page, index) => (
            <div
              key={page.id}
              className={cn(
                'group relative rounded-xl cursor-pointer transition-all border overflow-hidden',
                selectedPageId === page.id ? 'scale-[1.02]' : 'hover:scale-[1.01]'
              )}
              style={{
                backgroundColor:
                  selectedPageId === page.id
                    ? 'var(--color-accent-light)'
                    : 'var(--color-card-secondary)',
                borderColor:
                  selectedPageId === page.id
                    ? 'var(--color-accent)'
                    : 'var(--color-border-secondary)',
              }}
              onClick={() => onSelectPage(page.id)}
            >
              <div className="aspect-video bg-gray-100 relative">
                {page.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                    {page.photos.slice(0, 4).map((photo) => (
                      <img
                        key={photo.id}
                        src={photo.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ))}
                    {Array.from({ length: Math.max(0, 4 - page.photos.length) }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="bg-gray-100"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={24} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
                  </div>
                )}
                <div
                  className={cn(
                    'absolute top-2 left-2 text-xs font-bold font-playfair w-6 h-6 rounded-full flex items-center justify-center',
                    selectedPageId === page.id
                      ? 'bg-white/90 text-indigo-600'
                      : 'bg-white/70 text-gray-600'
                  )}
                >
                  {index + 1}
                </div>
                {page.photos.length > 0 && (
                  <div className="absolute bottom-2 right-2 text-xs px-2 py-0.5 rounded-full bg-black/50 text-white flex items-center gap-1">
                    <ImageIcon size={10} />
                    {page.photos.length}
                  </div>
                )}
                {pages.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('确定删除这个页面吗？')) {
                        onDeletePage(page.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 transition-all shadow-sm"
                    style={{ color: 'var(--color-danger)' }}
                    title="删除页面"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-sm truncate mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  {page.title || `第 ${index + 1} 天`}
                </h4>
                <div className="flex items-center gap-2 text-xs"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Calendar size={11} />
                  <span>{format(new Date(page.date), 'MM月dd日', { locale: zhCN })}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

function ThumbnailSidebar({
  pages,
  isCollapsed,
  onToggle,
  onSelectPage,
  selectedPageId,
}: {
  pages: { id: string; title: string; date: string; photos: { id: string; url: string }[] }[];
  isCollapsed: boolean;
  onToggle: () => void;
  onSelectPage: (id: string) => void;
  selectedPageId: string | null;
}) {
  const allPhotos = useMemo(() => {
    return pages.flatMap((page) =>
      page.photos.map((photo) => ({
        ...photo,
        pageId: page.id,
        pageTitle: page.title,
        pageDate: page.date,
      }))
    );
  }, [pages]);

  return (
    <aside
      className={cn(
        'thumbnail-sidebar rounded-2xl flex flex-col h-full relative',
        isCollapsed ? 'collapsed' : 'p-5'
      )}
      style={{
        backgroundColor: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        width: isCollapsed ? '0px' : '260px',
        minWidth: isCollapsed ? '0px' : '260px',
        overflow: isCollapsed ? 'visible' : 'hidden',
      }}
    >
      <button
        onClick={onToggle}
        className="absolute top-4 -left-4 z-10 w-8 h-8 rounded-full border flex items-center justify-center transition-all hover:scale-110"
        style={{
          backgroundColor: 'var(--color-card)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-secondary)',
        }}
        title={isCollapsed ? '展开相册' : '收起相册'}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {!isCollapsed && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-playfair" style={{ color: 'var(--color-text)' }}>
              相册
            </h3>
            <span className="text-xs px-2 py-1 rounded-full"
              style={{
                backgroundColor: 'var(--color-accent-light)',
                color: 'var(--color-primary)',
              }}
            >
              {allPhotos.length} 张
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 -mx-2 px-2">
            {allPhotos.length === 0 ? (
              <div className="text-center py-10 rounded-xl"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                }}
              >
                <ImageIcon size={28} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  暂无照片
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {allPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => onSelectPage(photo.pageId)}
                    className={cn(
                      'blur-thumbnail rounded-lg overflow-hidden aspect-square cursor-pointer transition-all hover:scale-105 group relative',
                      selectedPageId === photo.pageId && 'ring-2 ring-indigo-500'
                    )}
                  >
                    <img
                      src={photo.url}
                      alt={photo.pageTitle}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                      <p className="text-white text-xs font-medium truncate">
                        {photo.pageTitle || '未命名'}
                      </p>
                      <p className="text-white/70 text-[10px]">
                        {format(new Date(photo.pageDate), 'MM-dd', { locale: zhCN })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}

export default function TripBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTrip, addPage, deletePage } = useTripStore();
  const { isDark, toggleTheme } = useThemeContext();

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isThumbnailCollapsed, setIsThumbnailCollapsed] = useState(false);

  const trip = id ? getTrip(id) : undefined;

  const handleAddPage = () => {
    if (!trip || !id) return;
    const today = new Date().toISOString().split('T')[0];
    const newPage = addPage(id, {
      title: `第 ${trip.pages.length + 1} 天`,
      date: today,
    });
    setSelectedPageId(newPage.id);
  };

  const handleDeletePage = (pageId: string) => {
    if (!trip || !id) return;
    deletePage(id, pageId);
    if (selectedPageId === pageId) {
      setSelectedPageId(null);
    }
  };

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-playfair mb-4" style={{ color: 'var(--color-text)' }}>
            旅程不存在
          </h2>
          <button onClick={() => navigate('/')} className="btn-primary">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const sidebarPages = trip.pages.map((p) => ({
    id: p.id,
    title: p.title,
    date: p.date,
    photos: p.photos.map((ph) => ({ id: ph.id, url: ph.url })),
    pageNumber: p.pageNumber,
  }));

  const thumbnailPages = trip.pages.map((p) => ({
    id: p.id,
    title: p.title,
    date: p.date,
    photos: p.photos.map((ph) => ({ id: ph.id, url: ph.url })),
  }));

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
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--color-card-secondary)' }}
              title="返回首页"
            >
              <ArrowLeft size={20} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
            <div>
              <h1 className="text-lg font-playfair font-bold truncate max-w-[200px] sm:max-w-md"
                style={{ color: 'var(--color-text)' }}
              >
                {trip.name}
              </h1>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {format(new Date(trip.startDate), 'yyyy年MM月dd日', { locale: zhCN })}
                {trip.endDate && ` - ${format(new Date(trip.endDate), 'yyyy年MM月dd日', { locale: zhCN })}`}
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
              onClick={() => navigate(`/map/${trip.id}`)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <MapIcon size={16} />
              <span className="hidden sm:inline">地图视图</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-5 min-h-[calc(100vh-10rem)]">
          <div className="w-72 flex-shrink-0 hidden md:block">
            <PageSidebar
              pages={sidebarPages}
              selectedPageId={selectedPageId}
              onSelectPage={setSelectedPageId}
              onAddPage={handleAddPage}
              onDeletePage={handleDeletePage}
            />
          </div>

          <div className="flex-1 min-w-0">
            {id ? <TripEditor tripId={id} /> : null}
          </div>

          <div className="relative hidden lg:block">
            <ThumbnailSidebar
              pages={thumbnailPages}
              isCollapsed={isThumbnailCollapsed}
              onToggle={() => setIsThumbnailCollapsed(!isThumbnailCollapsed)}
              onSelectPage={setSelectedPageId}
              selectedPageId={selectedPageId}
            />
          </div>
        </div>

        <div className="md:hidden space-y-4 mt-4">
          <div>
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              页面列表
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {sidebarPages.map((page, idx) => (
                <div
                  key={page.id}
                  onClick={() => setSelectedPageId(page.id)}
                  className={cn(
                    'flex-shrink-0 w-24 rounded-lg overflow-hidden cursor-pointer transition-all border',
                    selectedPageId === page.id ? 'ring-2 ring-indigo-500' : ''
                  )}
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <div className="aspect-video bg-gray-100">
                    {page.photos.length > 0 ? (
                      <img src={page.photos[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={16} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] font-medium truncate" style={{ color: 'var(--color-text)' }}>
                      {page.title || `第${idx + 1}天`}
                    </p>
                  </div>
                </div>
              ))}
              <button
                onClick={handleAddPage}
                className="flex-shrink-0 w-24 rounded-lg border-2 border-dashed flex items-center justify-center"
                style={{ borderColor: 'var(--color-border-secondary)', color: 'var(--color-text-muted)' }}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
