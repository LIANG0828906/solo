import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WorksList from './WorksList';
import WorksDetail from './WorksDetail';
import ShareCard from './ShareCard';
import {
  createWork,
  deleteWork,
  generateShareCard,
  listWorks,
  updateWork,
} from '../api/works';
import type { GenerateShareResponse, Work } from '../types';

type ToastMsg = { id: number; type: 'success' | 'error'; text: string };

const BRAND_DEFAULTS = {
  logoText: '艺匠工坊',
  gradientFrom: '#1E293B',
  gradientTo: '#334155',
};

function useDebounce(value: string, delay = 300): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Workspace() {
  const [works, setWorks] = useState<Work[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareGenerating, setShareGenerating] = useState(false);
  const [shareImage, setShareImage] = useState<string | null>(null);

  const isMobile = useIsMobile();
  const [ratio, setRatio] = useState<number>(0.35);
  const draggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1500);
  }, []);

  const refreshWorks = useCallback(async (keyword = '') => {
    setLoading(true);
    try {
      const list = await listWorks(keyword);
      setWorks(list);
      if (!selectedId && list[0]) setSelectedId(list[0].id);
    } catch (e: unknown) {
      console.error(e);
      showToast('error', '加载作品列表失败');
    } finally {
      setLoading(false);
    }
  }, [selectedId, showToast]);

  useEffect(() => {
    refreshWorks(debouncedSearch);
  }, [debouncedSearch, refreshWorks]);

  const selected = useMemo(
    () => works.find((w) => w.id === selectedId) || null,
    [works, selectedId],
  );

  const handleCreate = async () => {
    try {
      const created = await createWork({
        name: `新作品 #${(works.length + 1).toString().padStart(2, '0')}`,
      });
      await refreshWorks(debouncedSearch);
      setSelectedId(created.id);
      showToast('success', '作品已创建');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '创建失败';
      showToast('error', msg);
    }
  };

  const handleUpdate = useCallback(
    async (id: string, patch: Partial<Work>): Promise<Work | null> => {
      setSaving(true);
      try {
        const updated = await updateWork(id, patch);
        setWorks((prev) =>
          prev.map((w) => (w.id === id ? { ...w, ...updated } : w)),
        );
        return updated;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '保存失败';
        throw new Error(msg);
      } finally {
        window.setTimeout(() => setSaving(false), 300);
      }
    },
    [],
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteWork(id);
      setWorks((prev) => prev.filter((w) => w.id !== id));
      setSelectedId((prev) => {
        if (prev !== id) return prev;
        const idx = works.findIndex((w) => w.id === id);
        const next = works[idx + 1] || works[idx - 1];
        return next ? next.id : null;
      });
      showToast('success', '已删除');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '删除失败';
      showToast('error', msg);
    }
  };

  const handleGenerateShare = async () => {
    if (!selected) return;
    setShareGenerating(true);
    setShareOpen(true);
    setShareImage(null);
    try {
      const res: GenerateShareResponse = await generateShareCard({
        workId: selected.id,
        brandSettings: BRAND_DEFAULTS,
      });
      setShareImage(res.imageBase64);
    } catch (e: unknown) {
      console.warn('后端生成失败，使用前端渲染模式', e);
      setShareImage(null);
    } finally {
      setShareGenerating(false);
    }
  };

  const handleDividerDown = () => {
    draggingRef.current = true;
    document.body.style.cursor = isMobile ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
  };
  const handleDividerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let clientPos: number;
      if ('touches' in e) {
        clientPos = isMobile ? e.touches[0].clientY : e.touches[0].clientX;
      } else {
        clientPos = isMobile ? e.clientY : e.clientX;
      }
      const total = isMobile ? rect.height : rect.width;
      const offset = isMobile ? clientPos - rect.top : clientPos - rect.left;
      let next = Math.max(0.18, Math.min(0.82, offset / total));
      if (isMobile) next = Math.max(0.2, Math.min(0.6, next));
      setRatio(next);
    },
    [isMobile],
  );
  const handleDividerUp = useCallback(() => {
    draggingRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleDividerMove);
    window.addEventListener('mouseup', handleDividerUp);
    window.addEventListener('touchmove', handleDividerMove, { passive: false });
    window.addEventListener('touchend', handleDividerUp);
    return () => {
      window.removeEventListener('mousemove', handleDividerMove);
      window.removeEventListener('mouseup', handleDividerUp);
      window.removeEventListener('touchmove', handleDividerMove);
      window.removeEventListener('touchend', handleDividerUp);
    };
  }, [handleDividerMove, handleDividerUp]);

  const listStyle = isMobile
    ? { height: `${ratio * 100}%`, width: '100%' }
    : { width: `${ratio * 100}%`, height: '100%' };
  const detailStyle = isMobile
    ? { height: `${(1 - ratio) * 100}%`, width: '100%' }
    : { width: `${(1 - ratio) * 100}%`, height: '100%' };

  return (
    <div className="h-full w-full flex flex-col">
      <nav className="glass-nav h-14 flex items-center px-5 gap-4 flex-shrink-0 z-30">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-base font-bold"
            style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)' }}
          >
            艺
          </div>
          <div>
            <div className="text-[15px] font-semibold text-[#F1F5F9] leading-tight">
              艺匠工坊
            </div>
            <div className="text-[11px] text-[#94A3B8] leading-tight">
              手工艺作品管理工作台
            </div>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
          {loading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
              加载中...
            </span>
          ) : (
            <span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block mr-1.5" />
              已连接 · {works.length} 件作品
            </span>
          )}
        </div>
      </nav>

      <div
        ref={containerRef}
        className="flex-1 min-h-0 flex overflow-hidden"
        style={{ flexDirection: isMobile ? 'column' : 'row' }}
      >
        <div style={listStyle} className="overflow-hidden min-w-0 min-h-0">
          <WorksList
            works={works}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCreateNew={handleCreate}
            searchKeyword={search}
            onSearchChange={setSearch}
          />
        </div>

        <div
          className={isMobile ? 'divider-horizontal' : 'divider'}
          onMouseDown={handleDividerDown}
          onTouchStart={handleDividerDown}
        />

        <div style={detailStyle} className="overflow-hidden min-w-0 min-h-0">
          <WorksDetail
            work={selected}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onGenerateShare={handleGenerateShare}
            showToast={showToast}
            isSaving={saving}
          />
        </div>
      </div>

      <ShareCard
        work={shareGenerating && !selected ? null : selected}
        backendImage={shareImage}
        open={shareOpen}
        onClose={() => {
          setShareOpen(false);
          setShareImage(null);
        }}
        brandSettings={BRAND_DEFAULTS}
      />

      <div className="fixed top-16 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-enter pointer-events-auto px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${
              t.type === 'success'
                ? 'bg-[#065F46] text-[#A7F3D0] border border-[#10B981]/40'
                : 'bg-[#7F1D1D] text-[#FECACA] border border-[#EF4444]/40'
            }`}
          >
            {t.type === 'success' ? '✓' : '✕'} {t.text}
          </div>
        ))}
      </div>

      {shareGenerating && shareOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <div className="px-6 py-5 rounded-2xl text-center" style={{ background: '#1E293B' }}>
            <div className="w-12 h-12 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <div className="text-sm text-[#F1F5F9]">正在生成分享卡...</div>
          </div>
        </div>
      )}
    </div>
  );
}

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}
