import { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useCollectionStore } from '@/store/useCollectionStore';
import { useTeaStore } from '@/store/useTeaStore';
import {
  Plus, Folder, FolderOpen, GripVertical, ArrowLeft, Pencil, Trash2,
  Share2, Download,
} from 'lucide-react';
import type { Collection, TastingNote } from '@/types';
import Modal from '@/components/Modal';
import TeaCard from '@/components/TeaCard';
import { ShareCard } from '@/components/ShareCard';
import { useBrewStore } from '@/store/useBrewStore';

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { collections, loadAll, addCollection, updateCollection, deleteCollection, reorder } =
    useCollectionStore();
  const { teas, loadTeas } = useTeaStore();
  const { brews, notes, loadByTeaId } = useBrewStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showShare, setShowShare] = useState<string | null>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const dragIdRef = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
    loadTeas();
  }, [loadAll, loadTeas]);

  useEffect(() => {
    if (id) {
      const col = collections.find((c) => c.id === id);
      if (col && col.teaIds.length > 0) {
        loadByTeaId(col.teaIds[0]);
      }
    }
  }, [id, collections, loadByTeaId]);

  const openEdit = (c: Collection) => {
    setEditing(c);
    setNewName(c.name);
    setNewDesc(c.description);
  };

  const handleSave = async () => {
    if (!newName.trim()) return;
    if (editing) {
      await updateCollection(editing.id, { name: newName, description: newDesc });
      setEditing(null);
    } else {
      await addCollection({ name: newName, description: newDesc, teaIds: [] });
      setShowAdd(false);
    }
    setNewName('');
    setNewDesc('');
  };

  const handleDelete = async (id_: string) => {
    if (!confirm('确定要删除该收藏集吗？')) return;
    await deleteCollection(id_);
  };

  const handleDragStart = (cid: string) => {
    dragIdRef.current = cid;
  };

  const handleDragOver = (e: React.DragEvent, cid: string) => {
    e.preventDefault();
    if (dragIdRef.current && dragIdRef.current !== cid) {
      setDragOverId(cid);
    }
  };

  const handleDrop = (targetId: string) => {
    const draggedId = dragIdRef.current;
    setDragOverId(null);
    dragIdRef.current = null;
    if (!draggedId || draggedId === targetId) return;
    const ids = collections.map((c) => c.id);
    const fromIdx = ids.indexOf(draggedId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, draggedId);
    reorder(ids);
  };

  const downloadShareCard = async (teaId: string) => {
    if (!shareRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(shareRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const tea = teas.find((t) => t.id === teaId);
      const link = document.createElement('a');
      link.download = `${tea?.name || '茶鉴'}_分享卡.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      alert('图片生成失败');
    }
  };

  if (id) {
    const collection = collections.find((c) => c.id === id);
    if (!collection) {
      return (
        <div className="py-20 text-center text-sm" style={{ color: 'var(--color-text-light)' }}>
          收藏集不存在
        </div>
      );
    }
    const colTeas = collection.teaIds
      .map((tid) => teas.find((t) => t.id === tid))
      .filter(Boolean) as typeof teas;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/collections')}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: 'var(--color-text-light)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            返回收藏集列表
          </button>
          <div className="flex items-center gap-2">
            <button
              className="tea-btn tea-btn-secondary !py-1.5 !px-3 !text-sm"
              onClick={() => openEdit(collection)}
            >
              <Pencil className="w-4 h-4" />
              编辑
            </button>
            <button
              className="tea-btn !py-1.5 !px-3 !text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-all duration-300"
              onClick={() => handleDelete(collection.id)}
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          </div>
        </div>

        <div className="tea-card p-6 mb-6">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: 'rgba(107, 142, 35, 0.12)' }}
            >
              📂
            </div>
            <div className="flex-1">
              <h1 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                {collection.name}
              </h1>
              {collection.description && (
                <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>
                  {collection.description}
                </p>
              )}
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-light)' }}>
                共 {colTeas.length} 款茶叶
              </p>
            </div>
          </div>
        </div>

        {colTeas.length === 0 ? (
          <div
            className="tea-card py-16 text-center text-sm"
            style={{ color: 'var(--color-text-light)' }}
          >
            <div className="text-5xl mb-3" style={{ opacity: 0.4 }}>🍵</div>
            这个收藏集还是空的，前往茶叶档案详情页将喜欢的茶叶加入吧
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {colTeas.map((t) => (
              <div key={t.id} className="relative group">
                <TeaCard tea={t} />
                <button
                  className="absolute top-2 right-2 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                  onClick={() => setShowShare(t.id)}
                  title="生成分享卡"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {(() => {
          const tea = teas.find((t) => t.id === showShare);
          if (!tea || !showShare) return null;
          const brewIds = brews.filter((b) => b.teaId === showShare).map((b) => b.id);
          const teaNotes: TastingNote[] = notes.filter((n) => brewIds.includes(n.brewRecordId));
          const best = teaNotes.length > 0
            ? teaNotes.reduce((a, b) => (a.overallScore >= b.overallScore ? a : b))
            : undefined;
          return (
            <Modal
              open={!!showShare}
              onClose={() => setShowShare(null)}
              title="生成品鉴分享卡"
              maxWidth="480px"
            >
              <div className="flex justify-center mb-4">
                <ShareCard ref={shareRef} tea={tea} bestNote={best} />
              </div>
              <div className="flex justify-end">
                <button className="tea-btn tea-btn-tea" onClick={() => downloadShareCard(tea.id)}>
                  <Download className="w-4 h-4" />
                  下载为 PNG
                </button>
              </div>
            </Modal>
          );
        })()}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">收藏集</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>
            共 {collections.length} 个收藏集 · 可拖拽调整顺序
          </p>
        </div>
        <button className="tea-btn tea-btn-primary" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" />
          新建收藏集
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="tea-card py-16 text-center">
          <div className="text-5xl mb-3" style={{ opacity: 0.4 }}>📁</div>
          <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>
            还没有收藏集，点击右上角新建第一个吧
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {collections.map((c) => {
            const count = c.teaIds.length;
            const isDragOver = dragOverId === c.id;
            return (
              <div
                key={c.id}
                draggable
                onDragStart={() => handleDragStart(c.id)}
                onDragOver={(e) => handleDragOver(e, c.id)}
                onDragLeave={() => setDragOverId(null)}
                onDrop={() => handleDrop(c.id)}
                onDragEnd={() => {
                  setDragOverId(null);
                  dragIdRef.current = null;
                }}
                className="tea-card p-5 cursor-grab active:cursor-grabbing transition-all duration-300"
                style={{
                  transform: isDragOver ? 'translateY(-4px) scale(1.02)' : undefined,
                  borderColor: isDragOver ? 'var(--color-tea)' : undefined,
                  boxShadow: isDragOver
                    ? '0 12px 28px rgba(107, 142, 35, 0.18)'
                    : undefined,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: 'rgba(107, 142, 35, 0.1)' }}
                  >
                    {count > 0 ? <FolderOpen size={28} color="#6B8E23" /> : <Folder size={28} color="#A67C52" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <GripVertical
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: 'var(--color-border)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/collections/${c.id}`}
                          className="block text-base font-semibold truncate hover:underline"
                          style={{
                            fontFamily: 'var(--font-serif)',
                            color: 'var(--color-wood-dark)',
                            textDecoration: 'none',
                          }}
                        >
                          {c.name}
                        </Link>
                        {c.description && (
                          <p
                            className="text-xs mt-0.5 line-clamp-2"
                            style={{ color: 'var(--color-text-light)' }}
                          >
                            {c.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: 'rgba(139, 94, 60, 0.1)',
                          color: 'var(--color-wood-dark)',
                        }}
                      >
                        {count} 款茶叶
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openEdit(c);
                          }}
                          className="p-1.5 rounded transition-colors hover:bg-white"
                          style={{ color: 'var(--color-text-light)' }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(c.id);
                          }}
                          className="p-1.5 rounded transition-colors hover:bg-red-50"
                          style={{ color: '#B22222' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={showAdd || !!editing}
        onClose={() => {
          setShowAdd(false);
          setEditing(null);
          setNewName('');
          setNewDesc('');
        }}
        title={editing ? '编辑收藏集' : '新建收藏集'}
        maxWidth="440px"
      >
        <div className="space-y-4">
          <div>
            <label className="tea-label">收藏集名称 *</label>
            <input
              className="tea-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="如：日常口粮"
              autoFocus
            />
          </div>
          <div>
            <label className="tea-label">描述</label>
            <textarea
              className="tea-input"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="简要描述这个收藏集"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              className="tea-btn tea-btn-secondary"
              onClick={() => {
                setShowAdd(false);
                setEditing(null);
              }}
            >
              取消
            </button>
            <button className="tea-btn tea-btn-primary" onClick={handleSave}>
              {editing ? '保存' : '创建'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
