import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import {
  ArrowLeft, LayoutGrid, Clock, Share2, Download, ImagePlus,
  Link, X, Copy, Check, Loader2, FileText, Calendar, Edit3,
} from 'lucide-react';
import { useStoryboardStore } from '@/store/useStoryboardStore';
import { getDaysSince, formatDateTime, exportAsImage, generateShareCode } from '@/utils/helpers';
import MaterialCard from './components/MaterialCard';
import TimelineView from '@/modules/timeline/TimelineView';

type ViewMode = 'free' | 'timeline';

export default function StoryboardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getStoryboard,
    getMaterialsByStoryboard,
    addMaterial,
    deleteMaterial,
    updateMaterial,
    reorderMaterials,
    updateStoryboard,
  } = useStoryboardStore();

  const storyboard = getStoryboard(id || '');
  const materials = getMaterialsByStoryboard(id || '');

  const [viewMode, setViewMode] = useState<ViewMode>('free');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  }, []);

  if (!storyboard) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center text-gray-500">
        <div className="text-center">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p>故事板不存在</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all text-sm"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const days = getDaysSince(storyboard.createdAt);
  const shareUrl = `${window.location.origin}/share/${storyboard.shareCode}`;

  const handleDragEnd = (result: any) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    reorderMaterials(storyboard.id, result.source.index, result.destination.index);
    showToast('排序已更新');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('仅支持 JPG / PNG / WebP 格式');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('文件大小不能超过 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      addMaterial(storyboard.id, 'upload', dataUrl);
      showToast('素材已添加');
    };
    reader.readAsDataURL(file);
    setShowAddModal(false);
    e.target.value = '';
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;
    addMaterial(storyboard.id, 'url', urlInput.trim());
    setUrlInput('');
    setShowAddModal(false);
    showToast('素材已添加');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('链接已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      showToast('链接已复制');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAsImage('storyboard-export-area', `${storyboard.title}-storyboard`);
      showToast('导出成功！图片已下载');
    } catch (err: any) {
      console.error(err);
      showToast(`导出失败: ${err?.message || '请重试'}`);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteMaterial = (materialId: string) => {
    deleteMaterial(materialId);
    if (selectedId === materialId) setSelectedId(null);
    showToast('素材已删除');
  };

  const handleUpdateNote = (materialId: string, note: string) => {
    updateMaterial(materialId, { note });
    showToast('备注已更新');
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <header className="sticky top-0 z-40 bg-[#0f0f1a]/92 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <h1
                className="text-white font-semibold text-sm sm:text-base md:text-lg truncate"
                style={{ fontFamily: 'Poppins, Noto Sans SC, sans-serif' }}
              >
                {storyboard.title}
              </h1>
              {storyboard.description && (
                <p className="text-gray-500 text-[10px] sm:text-xs truncate hidden md:block max-w-xs">
                  {storyboard.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="hidden lg:flex items-center gap-3 text-[11px] text-gray-500 mr-2 bg-white/5 px-3 py-1.5 rounded-lg">
              <span className="flex items-center gap-1"><FileText size={11} />{materials.length}素材</span>
              <span className="w-px h-3 bg-white/10" />
              <span className="flex items-center gap-1"><Calendar size={11} />{days}天前</span>
              <span className="w-px h-3 bg-white/10" />
              <span className="flex items-center gap-1"><Edit3 size={11} />{formatDateTime(storyboard.updatedAt)}</span>
            </div>

            <div className="flex items-center bg-white/5 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('free')}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs transition-all duration-200 ${
                  viewMode === 'free' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">自由</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs transition-all duration-200 ${
                  viewMode === 'timeline' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Clock size={13} />
                <span className="hidden sm:inline">时间轴</span>
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200"
              title="添加素材"
            >
              <ImagePlus size={isMobile ? 16 : 18} />
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200"
              title="分享故事板"
            >
              <Share2 size={isMobile ? 16 : 18} />
            </button>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 disabled:opacity-50"
              title="导出为长图"
            >
              <Download size={isMobile ? 16 : 18} />
            </button>
          </div>
        </div>
      </header>

      <div id="storyboard-export-area" className="pb-20 md:pb-10">
        {viewMode === 'free' ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable
              droppableId="materials-list"
              type="MATERIAL"
              direction="horizontal"
              ignoreContainerClipping
            >
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 transition-all duration-200 ${
                    snapshot.isDraggingOver ? 'bg-white/[0.02] rounded-2xl' : ''
                  }`}
                >
                  {materials.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 sm:py-32 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10 flex items-center justify-center mb-5">
                        <ImagePlus size={28} className="text-purple-400" />
                      </div>
                      <p className="text-gray-400 text-base mb-1.5 font-light" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>
                        还没有素材
                      </p>
                      <p className="text-gray-600 text-sm mb-5">点击右上角 + 按钮添加第一张素材</p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white text-sm hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                      >
                        立即添加
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`grid gap-4 sm:gap-5 ${
                        isMobile
                          ? 'grid-cols-1'
                          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'
                      }`}
                      style={{
                        gridTemplateColumns: isMobile
                          ? '1fr'
                          : undefined,
                      }}
                    >
                      {materials.map((mat, idx) => (
                        <MaterialCard
                          key={mat.id}
                          material={mat}
                          index={idx}
                          onDelete={handleDeleteMaterial}
                          onUpdateNote={handleUpdateNote}
                        />
                      ))}
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6">
            <TimelineView
              materials={materials}
              onSelectMaterial={setSelectedId}
              selectedId={selectedId}
            />
          </div>
        )}
      </div>

      <div className="md:hidden fixed bottom-4 left-4 right-4 bg-[#1a1a2e]/95 backdrop-blur-xl rounded-2xl border border-white/10 px-4 py-3 flex items-center justify-around text-[10px] text-gray-400 z-30 shadow-2xl">
        <span className="flex items-center gap-1"><FileText size={12} />{materials.length}素材</span>
        <span className="w-px h-4 bg-white/10" />
        <span className="flex items-center gap-1"><Calendar size={12} />{days}天前</span>
        <span className="w-px h-4 bg-white/10" />
        <span className="flex items-center gap-1"><Edit3 size={12} />{formatDateTime(storyboard.updatedAt)}</span>
      </div>

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-[#1a1a2e] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-semibold text-base" style={{ fontFamily: 'Poppins, Noto Sans SC, sans-serif' }}>
                添加素材卡片
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-2.5 mb-5">
              <button
                onClick={() => setAddType('upload')}
                className={`flex-1 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  addType === 'upload'
                    ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <ImagePlus size={15} />
                上传图片
              </button>
              <button
                onClick={() => setAddType('url')}
                className={`flex-1 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  addType === 'url'
                    ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Link size={15} />
                外链 URL
              </button>
            </div>

            {addType === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 hover:border-[#667eea]/40 rounded-2xl p-10 sm:p-12 text-center cursor-pointer transition-all hover:bg-white/[0.02] group"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <ImagePlus size={26} className="text-purple-400" />
                </div>
                <p className="text-gray-300 text-sm mb-1.5 font-medium">点击选择图片文件</p>
                <p className="text-gray-600 text-xs">支持 JPG / PNG / WebP · 单张不超过 5MB</p>
              </div>
            ) : (
              <div>
                <label className="block text-gray-400 text-xs mb-2">图片 URL 地址</label>
                <input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.png"
                  className="w-full px-4 py-3 rounded-xl bg-[#0f0f1a] text-white border border-white/10 focus:border-[#667eea]/50 focus:outline-none transition-all text-sm placeholder:text-gray-600"
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlAdd()}
                  autoFocus
                />
                <button
                  onClick={handleUrlAdd}
                  disabled={!urlInput.trim()}
                  className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
                >
                  添加素材
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      )}

      {showShareModal && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-[#1a1a2e] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-base" style={{ fontFamily: 'Poppins, Noto Sans SC, sans-serif' }}>
                分享故事板
              </h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="rounded-2xl p-5 mb-4 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${storyboard.gradientFrom}33, ${storyboard.gradientTo}33)`,
              }}
            >
              <div className="absolute inset-0 bg-[#1a1a2e]/80" />
              <div className="relative">
                <h3 className="text-white font-medium text-sm mb-1">{storyboard.title}</h3>
                {storyboard.description && (
                  <p className="text-gray-400 text-xs line-clamp-2 mb-3">{storyboard.description}</p>
                )}
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span>{materials.length} 素材</span>
                  <span>·</span>
                  <span>{days} 天前创建</span>
                </div>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-3.5 leading-relaxed" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>
              将下方链接发送给他人，对方可以<b className="text-purple-300">查看</b>故事板，但无法<b className="text-purple-300">编辑</b>。
            </p>

            <div className="flex items-center gap-2 bg-[#0f0f1a] rounded-xl p-2 border border-white/10 mb-3">
              <div className="flex-1 px-3 py-1.5 min-w-0">
                <code className="text-purple-300/90 text-[11px] truncate block">{shareUrl}</code>
              </div>
              <button
                onClick={handleCopyLink}
                className={`p-2 rounded-lg transition-all duration-200 shrink-0 ${
                  copied
                    ? 'bg-green-500/20 text-green-400'
                    : 'hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
                title="复制链接"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            <button
              onClick={() => {
                updateStoryboard(storyboard.id, { shareCode: generateShareCode() });
                showToast('分享链接已重新生成');
              }}
              className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              ↻ 重新生成分享链接
            </button>
          </div>
        </div>
      )}

      {exporting && (
        <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center animate-fadeIn">
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16 mb-5">
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-400 animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-pink-400 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
            </div>
            <Loader2 size={28} className="text-purple-400 animate-spin mb-4" />
            <p className="text-white/90 text-base font-medium mb-1" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>
              正在生成长图
            </p>
            <p className="text-gray-500 text-xs">请稍候，正在截取故事板内容...</p>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-[92px] md:bottom-10 left-1/2 -translate-x-1/2 z-[150] animate-fadeInUp">
          <div className="px-5 py-2.5 rounded-xl bg-[#1a1a2e]/98 border border-white/10 text-white text-sm shadow-2xl backdrop-blur-xl flex items-center gap-2">
            <Check size={15} className="text-purple-400 shrink-0" />
            <span style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>{toastMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
