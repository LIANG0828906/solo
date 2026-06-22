import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRelative } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  Users,
  Clock,
  Plus,
  Copy,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import {
  getRooms,
  createRoom,
  ensureSeedData,
  copyInviteLink,
  generateCoverCard,
} from '@/DataService';
import { getThemeColors } from '@/utils/themes';
import type { RoomMeta } from '@/types';

interface ToastState {
  message: string;
  visible: boolean;
}

export default function RoomListPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomMeta[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<ToastState>({ message: '', visible: false });
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState('');
  const [initialParagraph, setInitialParagraph] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    ensureSeedData();
    setRooms(getRooms());
  }, []);

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast({ message: '', visible: false });
    }, 2500);
  }, []);

  const handleCardClick = useCallback(
    (roomId: string) => {
      navigate(`/story/${roomId}`);
    },
    [navigate]
  );

  const handleCreateRoom = useCallback(async () => {
    if (!title.trim() || !theme.trim() || !initialParagraph.trim()) {
      showToast('请填写所有必填项');
      return;
    }

    setIsCreating(true);
    try {
      const room = createRoom({
        title: title.trim(),
        theme: theme.trim(),
        initialParagraph: initialParagraph.trim(),
        isPublic,
      });

      const copied = await copyInviteLink(room.id);
      if (copied) {
        showToast('已复制邀请链接到剪贴板');
      }

      setTimeout(() => {
        navigate(`/story/${room.id}`);
      }, 600);
    } catch {
      showToast('创建房间失败，请重试');
    } finally {
      setIsCreating(false);
    }
  }, [title, theme, initialParagraph, isPublic, navigate, showToast]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setTitle('');
    setTheme('');
    setInitialParagraph('');
    setIsPublic(true);
  }, []);

  const previewColors = theme.trim()
    ? getThemeColors(theme.trim())
    : (['#E8B94A', '#F7C59F'] as [string, string]);
  const previewGradient = `linear-gradient(135deg, ${previewColors[0]} 0%, ${previewColors[1]} 100%)`;

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
      <header className="max-w-6xl mx-auto mb-10 sm:mb-14">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left flex-1">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2D2D2D] tracking-tight mb-3">
              藤蔓故事
            </h1>
            <p className="text-base sm:text-lg text-[#555] font-light">
              和朋友一起，让故事在笔尖生长
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl text-white font-medium text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: 'linear-gradient(135deg, #E8B94A 0%, #F39C12 100%)',
            }}
          >
            <Plus className="w-5 h-5" />
            <span>创建房间</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {rooms.length === 0 ? (
          <div className="flex items-center justify-center py-20 sm:py-32">
            <div className="text-center bg-white rounded-3xl shadow-sm p-10 sm:p-16 border border-[rgba(45,45,45,0.06)]">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
                <Sparkles className="w-10 h-10 text-amber-600" />
              </div>
              <p className="font-serif text-xl sm:text-2xl text-[#555] mb-2">
                还没有故事
              </p>
              <p className="text-[#777] text-base sm:text-lg">
                来创建第一个吧~
              </p>
            </div>
          </div>
        ) : (
          <div className="masonry-grid">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => handleCardClick(room.id)}
                className="story-card inline-block w-full mb-6 rounded-3xl overflow-hidden cursor-pointer break-inside-avoid"
                style={{
                  background: generateCoverCard(room).bgGradient,
                }}
              >
                <div className="relative p-5 sm:p-6 min-h-[200px] sm:min-h-[240px]">
                  <div
                    className="w-12 h-12 text-white/80 mb-16"
                    style={{ width: '48px', height: '48px' }}
                    dangerouslySetInnerHTML={{ __html: room.coverIllustration }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 backdrop-blur-md bg-white/30 p-4 sm:p-5 rounded-t-[28px]">
                    <h3 className="font-serif font-bold text-[20px] text-white mb-2.5 drop-shadow-sm line-clamp-2">
                      {room.title}
                    </h3>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/40 backdrop-blur-sm text-white text-xs font-medium">
                        {room.theme}
                      </span>
                      <div className="flex items-center gap-3 text-white/90 text-xs">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>{room.participantCount}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {formatRelative(room.updatedAt, new Date(), {
                              locale: zhCN,
                            })}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-[#2D2D2D]/50 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 flex items-center justify-between px-6 sm:px-8 py-5 border-b border-[rgba(45,45,45,0.06)] rounded-t-3xl">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2D2D]">
                创建新房间
              </h2>
              <button
                onClick={handleCloseModal}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#777] hover:bg-[rgba(45,45,45,0.05)] hover:text-[#2D2D2D] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 sm:px-8 py-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  故事标题
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="给你的故事起个名字吧..."
                  className="w-full px-4 py-3 rounded-2xl border border-[rgba(45,45,45,0.1)] bg-[#FDFBF7] text-[#2D2D2D] placeholder:text-[#999] focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  主题关键词
                </label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="奇幻 / 爱情 / 科幻 / 治愈..."
                  className="w-full px-4 py-3 rounded-2xl border border-[rgba(45,45,45,0.1)] bg-[#FDFBF7] text-[#2D2D2D] placeholder:text-[#999] focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  初始段落
                </label>
                <textarea
                  value={initialParagraph}
                  onChange={(e) => setInitialParagraph(e.target.value)}
                  rows={5}
                  placeholder="写下故事的开篇，让想象力从此起飞..."
                  className="w-full px-4 py-3 rounded-2xl border border-[rgba(45,45,45,0.1)] bg-[#FDFBF7] text-[#2D2D2D] placeholder:text-[#999] focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 rounded-md border-2 border-[rgba(45,45,45,0.2)] text-amber-500 focus:ring-amber-400 focus:ring-offset-0 cursor-pointer"
                />
                <label
                  htmlFor="isPublic"
                  className="text-sm text-[#2D2D2D] cursor-pointer select-none"
                >
                  公开房间（所有人可见）
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#777] mb-2">
                  主题色预览
                </label>
                <div
                  className="h-12 rounded-2xl shadow-inner transition-all duration-300"
                  style={{ background: previewGradient }}
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-[rgba(45,45,45,0.06)] px-6 sm:px-8 py-5 flex items-center justify-end gap-3 rounded-b-3xl">
              <button
                onClick={handleCloseModal}
                disabled={isCreating}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#555] hover:bg-[rgba(45,45,45,0.05)] transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background:
                    'linear-gradient(135deg, #E8B94A 0%, #F39C12 100%)',
                }}
              >
                {isCreating ? (
                  <>
                    <Check className="w-4 h-4 animate-pulse" />
                    <span>创建中...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>创建房间</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.visible && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-[#2D2D2D] text-white shadow-xl text-sm font-medium">
            <Copy className="w-4.5 h-4.5 text-amber-400" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
