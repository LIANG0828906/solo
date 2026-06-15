import { useState, useRef, useCallback } from 'react';
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  }, []);

  if (!storyboard) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center text-gray-500">
        <p>故事板不存在</p>
      </div>
    );
  }

  const days = getDaysSince(storyboard.createdAt);
  const shareUrl = `${window.location.origin}/share/${storyboard.shareCode}`;

  const handleDragEnd = (result: any) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    reorderMaterials(storyboard.id, result.source.index, result.destination.index);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('仅支持 JPG/PNG/WebP 格式');
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
      showToast('复制失败，请手动复制');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      await exportAsImage('storyboard-export-area', `${storyboard.title}-storyboard`);
      showToast('导出成功');
    } catch {
      showToast('导出失败，请重试');
    }
    setExporting(false);
  };

  const handleDeleteMaterial = (materialId: string) => {
    deleteMaterial(materialId);
    if (selectedId === materialId) setSelectedId(null);
  };

  const handleUpdateNote = (materialId: string, note: string) => {
    updateMaterial(materialId, { note });
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <header className="sticky top-0 z-40 bg-[#0f0f1a]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1
                className="text-white font-semibold text-base md:text-lg truncate"
                style={{ fontFamily: 'Poppins, Noto Sans SC, sans-serif' }}
              >
                {storyboard.title}
              </h1>
              <p className="text-gray-500 text-xs truncate hidden sm:block">{storyboard.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-3 text-xs text-gray-500 mr-2">
              <span className="flex items-center gap-1"><FileText size={12} />{materials.length} 素材</span>
              <span className="flex items-center gap-1"><Calendar size={12} />{days} 天前</span>
              <span className="flex items-center gap-1"><Edit3 size={12} />{formatDateTime(storyboard.updatedAt)}</span>
            </div>

            <div className="flex items-center bg-white/5 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('free')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs transition-all duration-200 ${
                  viewMode === 'free' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">自由</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs transition-all duration-200 ${
                  viewMode === 'timeline' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Clock size={14} />
                <span className="hidden sm:inline">时间轴</span>
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:opacity-90 transition-all duration-200"
              title="添加素材"
            >
              <ImagePlus size={18} />
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200"
              title="分享"
            >
              <Share2 size={18} />
            </button>

            <button
              onClick={handleExport}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200"
              title="导出长图"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </header>

      <div id="storyboard-export-area" ref={exportRef}>
        {viewMode === 'free' ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="materials" type="MATERIAL">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="max-w-6xl mx-auto px-4 md:px-6 py-6"
                >
                  {materials.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                      <ImagePlus size={48} className="mb-3 opacity-20" />
                      <p className="text-sm font-light">还没有素材，点击上方按钮添加</p>
                    </div>
                  ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                      {materials.map((mat, idx) => (
                        <div key={mat.id} className="break-inside-avoid">
                          <MaterialCard
                            material={mat}
                            index={idx}
                            onDelete={handleDeleteMaterial}
                            onUpdateNote={handleUpdateNote}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
            <TimelineView
              materials={materials}
              onSelectMaterial={setSelectedId}
              selectedId={selectedId}
            />
          </div>
        )}
      </div>

      <div className="md:hidden fixed bottom-4 left-4 right-4 bg-[#1a1a2e]/95 backdrop-blur-md rounded-xl border border-white/10 p-3 flex items-center justify-around text-xs text-gray-400 z-30">
        <span className="flex items-center gap-1"><FileText size={12} />{materials.length}</span>
        <span className="flex items-center gap-1"><Calendar size={12} />{days}天</span>
        <span className="flex items-center gap-1"><Edit3 size={12} />{formatDateTime(storyboard.updatedAt)}</span>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowAddModal(false)}>
          <div className="bg-[#1a1a2e] rounded-xl p-6 w-full max-w-md shadow-2xl border border-white/10 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg" style={{ fontFamily: 'Poppins, Noto Sans SC, sans-serif' }}>添加素材</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setAddType('upload')}
                className={`flex-1 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  addType === 'upload' ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <ImagePlus size={16} />
                上传图片
              </button>
              <button
                onClick={() => setAddType('url')}
                className={`flex-1 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  addType === 'url' ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Link size={16} />
                外链URL
              </button>
            </div>

            {addType === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-purple-500/40 transition-colors cursor-pointer"
              >
                <ImagePlus size={32} className="mx-auto text-gray-500 mb-3" />
                <p className="text-gray-400 text-sm">点击选择图片</p>
                <p className="text-gray-600 text-xs mt-1">支持 JPG/PNG/WebP，不超过 5MB</p>
              </div>
            ) : (
              <div>
                <input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="输入图片 URL..."
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0f0f1a] text-white border border-white/10 focus:border-purple-500/50 focus:outline-none transition-colors text-sm placeholder:text-gray-600"
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlAdd()}
                />
                <button
                  onClick={handleUrlAdd}
                  disabled={!urlInput.trim()}
                  className="w-full mt-3 py-2.5 rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:opacity-90 transition-all duration-200 disabled:opacity-40 text-sm"
                >
                  添加
                </button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileUpload} />
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowShareModal(false)}>
          <div className="bg-[#1a1a2e] rounded-xl p-6 w-full max-w-md shadow-2xl border border-white/10 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg" style={{ fontFamily: 'Poppins, Noto Sans SC, sans-serif' }}>分享故事板</h2>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-4" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>
              生成分享链接后，其他人可以查看但不能编辑你的故事板
            </p>
            <div className="flex items-center gap-2 bg-[#0f0f1a] rounded-lg p-3 border border-white/10">
              <code className="flex-1 text-purple-300 text-xs truncate">{shareUrl}</code>
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 shrink-0"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>
            <button
              onClick={() => {
                updateStoryboard(storyboard.id, { shareCode: generateShareCode() });
                showToast('分享链接已重新生成');
              }}
              className="mt-3 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              重新生成分享码
            </button>
          </div>
        </div>
      )}

      {exporting && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={36} className="text-purple-400 animate-spin" />
            <p className="text-white/80 text-sm">正在导出长图...</p>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fadeInUp">
          <div className="px-4 py-2 rounded-lg bg-[#1a1a2e]/95 border border-white/10 text-white text-sm shadow-xl backdrop-blur-sm">
            {toastMsg}
          </div>
        </div>
      )}
    </div>
  );
}
