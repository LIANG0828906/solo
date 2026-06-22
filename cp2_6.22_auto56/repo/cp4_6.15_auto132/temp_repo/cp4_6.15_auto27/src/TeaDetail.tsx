import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Trash2, Plus, Share2, Heart, MapPin, Calendar, Leaf,
  Download, X,
} from 'lucide-react';
import { useTeaStore } from '@/store/useTeaStore';
import { useBrewStore } from '@/store/useBrewStore';
import { useCollectionStore } from '@/store/useCollectionStore';
import type { Tea, BrewRecord, TastingNote } from '@/types';
import Timeline from '@/components/Timeline';
import ScoreChart from '@/components/ScoreChart';
import BrewForm from '@/components/BrewForm';
import TeaForm from '@/components/TeaForm';
import Modal from '@/components/Modal';
import { ShareCard } from '@/components/ShareCard';

export default function TeaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { teas, loadTeas, updateTea, deleteTea } = useTeaStore();
  const { brews, notes, loadByTeaId, addBrew } = useBrewStore();
  const { collections, toggleTea, loadAll: loadCollections } = useCollectionStore();
  const [tea, setTea] = useState<Tea | null>(null);
  const [showBrew, setShowBrew] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCollect, setShowCollect] = useState(false);
  const [newestBrewId, setNewestBrewId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCollections();
    loadTeas();
  }, [loadCollections, loadTeas]);

  useEffect(() => {
    const found = teas.find((t) => t.id === id) ?? null;
    setTea(found);
    if (id) loadByTeaId(id);
  }, [id, teas, loadByTeaId]);

  const bestNote = useMemo<TastingNote | null>(() => {
    if (notes.length === 0) return null;
    return notes.reduce((a, b) => (a.overallScore >= b.overallScore ? a : b));
  }, [notes]);

  const avgScore = useMemo(() => {
    if (notes.length === 0) return 0;
    return Math.round(notes.reduce((s, n) => s + n.overallScore, 0) / notes.length);
  }, [notes]);

  const location = tea
    ? [tea.province, tea.city, tea.region].filter(Boolean).join(' / ')
    : '';

  const handleAddBrew = async (
    brew: Omit<BrewRecord, 'id' | 'createdAt'>,
    note: Omit<TastingNote, 'id' | 'brewRecordId' | 'overallScore'> & { overallScore: number }
  ) => {
    await addBrew(brew, note);
    setShowBrew(false);
    if (tea) {
      await updateTea(tea.id, { lastBrewDate: new Date().toISOString() });
    }
    const sortedBrews = [...brews].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (sortedBrews[0]) setNewestBrewId(sortedBrews[0].id);
    setTimeout(() => setNewestBrewId(null), 800);
  };

  const handleDelete = async () => {
    if (!tea || !confirm('确定要删除这份茶叶档案吗？')) return;
    setDeleting(true);
    try {
      await deleteTea(tea.id);
      navigate('/teas');
    } finally {
      setDeleting(false);
    }
  };

  const downloadShareCard = async () => {
    if (!shareRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(shareRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `${tea?.name || '茶鉴'}_分享卡.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      alert('图片生成失败，请稍后重试');
    }
  };

  const isInCollection = (cid: string) =>
    collections.find((c) => c.id === cid)?.teaIds.includes(tea?.id || '') ?? false;

  if (!tea) {
    return (
      <div className="py-20 text-center text-sm" style={{ color: 'var(--color-text-light)' }}>
        茶叶档案不存在
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate('/teas')}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: 'var(--color-text-light)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          返回档案列表
        </button>
        <div className="flex items-center gap-2">
          <button
            className="tea-btn tea-btn-secondary !py-1.5 !px-3 !text-sm"
            onClick={() => setShowCollect(true)}
          >
            <Heart className="w-4 h-4" />
            收藏
          </button>
          <button
            className="tea-btn tea-btn-secondary !py-1.5 !px-3 !text-sm"
            onClick={() => setShowShare(true)}
          >
            <Share2 className="w-4 h-4" />
            分享
          </button>
          <button
            className="tea-btn tea-btn-secondary !py-1.5 !px-3 !text-sm"
            onClick={() => setShowEdit(true)}
          >
            <Pencil className="w-4 h-4" />
            编辑
          </button>
          <button
            className="tea-btn !py-1.5 !px-3 !text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-all duration-300"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="tea-card overflow-hidden">
            <div
              className="h-56 bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center"
              style={{
                backgroundImage: tea.photos[0] ? `url(${tea.photos[0]})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!tea.photos[0] && (
                <span style={{ fontSize: 72, opacity: 0.25 }}>🍵</span>
              )}
            </div>
            {tea.photos.length > 1 && (
              <div className="flex gap-2 p-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                {tea.photos.slice(1).map((p, i) => (
                  <div
                    key={i}
                    className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0"
                    style={{ border: '1px solid var(--color-border)' }}
                  >
                    <img src={p} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="tea-card p-5 space-y-3">
            <h1 className="text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>
              {tea.name}
            </h1>
            <div className="flex flex-wrap gap-2">
              <span
                className="tea-tag text-white"
                style={{ backgroundColor: 'var(--color-tea)' }}
              >
                <Leaf className="w-3 h-3 mr-1" />
                {tea.variety}
              </span>
              {location && (
                <span
                  className="tea-tag"
                  style={{ backgroundColor: 'rgba(139, 94, 60, 0.1)', color: 'var(--color-wood-dark)' }}
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  {location}
                </span>
              )}
              <span
                className="tea-tag"
                style={{ backgroundColor: 'rgba(139, 94, 60, 0.1)', color: 'var(--color-wood-dark)' }}
              >
                <Calendar className="w-3 h-3 mr-1" />
                {tea.year}年{tea.season}茶
              </span>
            </div>
            {tea.processType && (
              <div className="text-sm">
                <span className="text-xs" style={{ color: 'var(--color-text-light)' }}>工艺：</span>
                {tea.processType}
              </div>
            )}
            {tea.appearance && (
              <div className="text-sm">
                <span className="text-xs" style={{ color: 'var(--color-text-light)' }}>外形：</span>
                {tea.appearance}
              </div>
            )}
            {tea.description && (
              <p
                className="text-sm leading-relaxed pt-2 mt-2"
                style={{ color: 'var(--color-text)', borderTop: '1px solid var(--color-border)' }}
              >
                {tea.description}
              </p>
            )}
          </div>

          {notes.length > 0 && (
            <div className="tea-card p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">评分概览</h3>
                <span className="text-xs" style={{ color: 'var(--color-text-light)' }}>
                  共 {notes.length} 次品鉴
                </span>
              </div>
              <div className="flex items-end gap-3">
                <div
                  className="text-4xl font-bold"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-tea)' }}
                >
                  {avgScore}
                </div>
                <div className="text-xs pb-1.5" style={{ color: 'var(--color-text-light)' }}>
                  平均分
                </div>
                {bestNote && (
                  <>
                    <div className="flex-1" />
                    <div className="text-right">
                      <div
                        className="text-xl font-bold"
                        style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-wood)' }}
                      >
                        {bestNote.overallScore}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-light)' }}>
                        最高分
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="tea-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">评分趋势</h3>
              <button
                className="tea-btn tea-btn-tea !py-1 !px-3 !text-xs"
                onClick={() => setShowBrew(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                记录冲泡
              </button>
            </div>
            <ScoreChart brews={brews} notes={notes} />
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="tea-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">冲泡记录时间轴</h3>
              <span className="text-xs" style={{ color: 'var(--color-text-light)' }}>
                共 {brews.length} 条记录
              </span>
            </div>
            <Timeline brews={brews} notes={notes} newestId={newestBrewId} />
          </div>
        </div>
      </div>

      <Modal
        open={showBrew}
        onClose={() => setShowBrew(false)}
        title="记录冲泡与品鉴"
        maxWidth="720px"
      >
        <BrewForm
          teaId={tea.id}
          onSubmit={handleAddBrew}
          onCancel={() => setShowBrew(false)}
        />
      </Modal>

      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="编辑茶叶档案"
        maxWidth="680px"
      >
        <TeaForm
          initial={tea}
          onSubmit={async (data) => {
            await updateTea(tea.id, data);
            setShowEdit(false);
          }}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>

      <Modal open={showCollect} onClose={() => setShowCollect(false)} title="加入收藏集">
        <div className="space-y-2">
          {collections.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: 'var(--color-text-light)' }}>
              暂无收藏集，请先在收藏集页面创建
            </p>
          ) : (
            collections.map((c) => {
              const active = isInCollection(c.id);
              return (
                <button
                  key={c.id}
                  onClick={async () => {
                    await toggleTea(c.id, tea.id);
                  }}
                  className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all duration-300"
                  style={{
                    backgroundColor: active ? 'rgba(107, 142, 35, 0.08)' : 'var(--color-bg)',
                    border: `1px solid ${active ? 'var(--color-tea)' : 'var(--color-border)'}`,
                  }}
                >
                  <span className="text-2xl">📁</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-light)' }}>
                      {c.teaIds.length} 款茶叶 · {c.description}
                    </div>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: active ? 'var(--color-tea)' : 'var(--color-border)',
                      color: active ? 'white' : 'var(--color-text-light)',
                    }}
                  >
                    {active ? '已收藏' : '加入'}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </Modal>

      <Modal
        open={showShare}
        onClose={() => setShowShare(false)}
        title="生成品鉴分享卡"
        maxWidth="480px"
      >
        <div className="flex justify-center mb-4">
          <ShareCard ref={shareRef} tea={tea} bestNote={bestNote} />
        </div>
        <div className="flex justify-end">
          <button className="tea-btn tea-btn-tea" onClick={downloadShareCard}>
            <Download className="w-4 h-4" />
            下载为 PNG
          </button>
        </div>
      </Modal>

    </div>
  );
}
