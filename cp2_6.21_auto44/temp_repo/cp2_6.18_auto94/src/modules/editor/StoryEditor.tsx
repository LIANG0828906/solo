import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, History, MessageCircle, Menu, X, Sparkles, ChevronRight, ChevronDown } from 'lucide-react';
import { useInkFlowStore } from '@/store/useInkFlowStore';
import ChapterTree from '@/components/ChapterTree';
import RichTextEditor from '@/components/RichTextEditor';
import VersionHistoryPanel from '@/components/VersionHistoryPanel';
import CommentPanel from '@/components/CommentPanel';
import { formatRelativeTime } from '@/utils/formatTime';

type RightPanel = 'none' | 'history' | 'comments';

export default function StoryEditor() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const setCurrentProject = useInkFlowStore((s) => s.setCurrentProject);
  const currentChapterId = useInkFlowStore((s) => s.currentChapterId);
  const setCurrentChapter = useInkFlowStore((s) => s.setCurrentChapter);
  const project = useInkFlowStore((s) => s.projects.find((p) => p.id === projectId) || null);
  const chapters = useInkFlowStore((s) => s.getProjectChapters(projectId || ''));
  const getProjectProgress = useInkFlowStore((s) => s.getProjectProgress);

  const [rightPanel, setRightPanel] = useState<RightPanel>('history');
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<{
    startOffset: number;
    endOffset: number;
    text: string;
  } | null>(null);
  const [showBubble, setShowBubble] = useState(false);
  const [bubblePos, setBubblePos] = useState<{ top: number; left: number } | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    if (projectId) {
      setCurrentProject(projectId);
    }
    return () => {
      setCurrentProject(null);
    };
  }, [projectId, setCurrentProject]);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onDocClick = () => {
      setShowBubble(false);
      setBubblePos(null);
    };
    setTimeout(() => {
      document.addEventListener('mousedown', onDocClick);
    }, 100);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const isTablet = windowWidth < 1024;
  const isMobile = windowWidth < 768;
  const isSmallMobile = windowWidth < 480;

  const handleSelectionChange = useCallback(
    (startOffset: number, endOffset: number, text: string) => {
      setPendingSelection({ startOffset, endOffset, text });
      try {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const container = document.querySelector('.inkflow-editor')?.getBoundingClientRect();
          if (rect && container) {
            setBubblePos({
              top: rect.top - container.top + (window.scrollY || 0),
              left: Math.max(8, rect.left - container.left + rect.width / 2 - 40),
            });
            setShowBubble(true);
            return;
          }
        }
      } catch (e) {}
      setShowBubble(false);
    },
    []
  );

  const handleAddCommentFromBubble = () => {
    setShowBubble(false);
    setBubblePos(null);
    setRightPanel('comments');
    if (isTablet) setRightDrawerOpen(true);
  };

  const handleConsumePending = () => {
    setPendingSelection(null);
  };

  const activeChapter = chapters.find((c) => c.id === currentChapterId);
  const progress = projectId ? getProjectProgress(projectId) : { completed: 0, total: 0, percent: 0 };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="text-center">
          <p className="text-gray-500 mb-4">项目不存在</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm rounded-lg text-white transition-all active:scale-[0.96]"
            style={{ background: '#6366F1' }}
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const renderHeader = () => (
    <header
      className="sticky top-0 z-40 backdrop-blur-md border-b border-gray-200/60"
      style={{ background: 'rgba(248,250,252,0.9)' }}
    >
      <div className="flex items-center gap-3 px-4 lg:px-6 py-3">
        {isSmallMobile && (
          <button
            onClick={() => setLeftDrawerOpen(true)}
            className="p-2 rounded-lg hover:bg-white text-gray-600 transition-all active:scale-[0.96] shadow-sm"
          >
            <Menu size={18} />
          </button>
        )}

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-white transition-all active:scale-[0.96] text-sm shadow-sm"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">返回</span>
        </button>

        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: project.coverColor }}
          >
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-sm font-semibold text-gray-800 truncate">{project.title}</h1>
              {project.isFavorite && (
                <span style={{ color: '#F59E0B' }} className="text-sm shrink-0">
                  ★
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {activeChapter && (
                <>
                  <ChevronRight size={10} />
                  <span className="truncate">{activeChapter.title}</span>
                </>
              )}
              {progress.total > 0 && (
                <>
                  <span>·</span>
                  <span>进度 {progress.percent}%</span>
                </>
              )}
              <span>·</span>
              <span className="hidden sm:inline">{formatRelativeTime(project.updatedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {isMobile && (
            <button
              onClick={() => setRightDrawerOpen(true)}
              className="p-2 rounded-lg hover:bg-white text-gray-600 transition-all active:scale-[0.96] shadow-sm"
            >
              <Menu size={18} />
            </button>
          )}
          {!isMobile && (
            <>
              <button
                onClick={() => setRightPanel('history')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.96] ${
                  rightPanel === 'history'
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 hover:bg-white shadow-sm'
                }`}
                style={rightPanel === 'history' ? { background: '#6366F1' } : {}}
                title="版本历史"
              >
                <History size={14} />
                <span className="hidden lg:inline">历史</span>
              </button>
              <button
                onClick={() => setRightPanel('comments')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.96] ${
                  rightPanel === 'comments'
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 hover:bg-white shadow-sm'
                }`}
                style={rightPanel === 'comments' ? { background: '#F59E0B' } : {}}
                title="评论协作"
              >
                <MessageCircle size={14} />
                <span className="hidden lg:inline">评论</span>
              </button>
              {rightPanel !== 'none' && (
                <button
                  onClick={() => setRightPanel('none')}
                  className="p-2 rounded-lg text-gray-500 hover:bg-white transition-all active:scale-[0.96] shadow-sm"
                  title="隐藏右侧面板"
                >
                  <ChevronDown size={14} className="rotate-90" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );

  const renderLeftPanel = () => (
    <div style={{ width: '200px' }} className="shrink-0 h-full hidden lg:flex">
      <ChapterTree projectId={projectId!} />
    </div>
  );

  const renderEditor = () => (
    <div className="flex-1 min-w-0 h-full flex">
      {currentChapterId ? (
        <RichTextEditor
          chapterId={currentChapterId}
          onSelectionChange={handleSelectionChange}
          onAddComment={handleAddCommentFromBubble}
          showCommentBubble={showBubble}
          bubblePosition={bubblePos}
        />
      ) : (
        <div
          className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white"
          style={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
        >
          <Sparkles size={48} className="text-gray-300 mb-4" />
          <p className="text-sm text-gray-500 mb-2">选择或创建一个章节开始写作</p>
          <button
            onClick={() => {
              const chaptersCount = chapters.length;
              useInkFlowStore.getState().addChapter(projectId!, `第${chaptersCount + 1}章 新章节`);
            }}
            className="text-xs px-4 py-2 rounded-lg text-white transition-all active:scale-[0.96]"
            style={{ background: '#6366F1' }}
          >
            创建新章节
          </button>
        </div>
      )}
    </div>
  );

  const renderRightPanel = () => {
    if (rightPanel === 'none' || isMobile) return null;
    return (
      <div style={{ width: '300px' }} className="shrink-0 h-full hidden lg:flex">
        {rightPanel === 'history' && (
          <VersionHistoryPanel
            chapterId={currentChapterId || ''}
            isOpen={true}
            onClose={() => setRightPanel('none')}
          />
        )}
        {rightPanel === 'comments' && (
          <CommentPanel
            chapterId={currentChapterId || ''}
            isOpen={true}
            onClose={() => setRightPanel('none')}
            pendingSelection={pendingSelection}
            onConsumePending={handleConsumePending}
          />
        )}
      </div>
    );
  };

  const renderTabletFloatingButtons = () => {
    if (!isTablet || isMobile) return null;
    return (
      <>
        <button
          onClick={() => setRightDrawerOpen(true)}
          className="fixed z-30 bottom-6 right-6 flex items-center gap-1.5 px-4 py-3 rounded-full text-white text-xs font-medium shadow-lg active:scale-[0.96] transition-all hover:shadow-xl"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
        >
          {rightPanel === 'history' ? <History size={16} /> : <MessageCircle size={16} />}
          {rightPanel === 'history' ? '历史' : '评论'}
        </button>
      </>
    );
  };

  const renderLeftDrawer = () =>
    isSmallMobile && leftDrawerOpen ? (
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={() => setLeftDrawerOpen(false)}
      >
        <div
          className="h-full w-full max-w-sm bg-[#F8FAFC] p-4 flex flex-col"
          style={{ animation: 'drawerInLeft 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">章节导航</h3>
            <button
              onClick={() => setLeftDrawerOpen(false)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-white transition-all"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 min-h-0" style={{ minHeight: '400px' }}>
            <ChapterTree projectId={projectId!} />
          </div>
        </div>
        <style>{`
          @keyframes drawerInLeft {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </div>
    ) : null;

  const renderRightDrawer = () =>
    isTablet && rightDrawerOpen ? (
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={() => setRightDrawerOpen(false)}
      >
        <div
          className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[#F8FAFC] p-4 flex flex-col"
          style={{ animation: 'drawerInRight 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRightPanel('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  rightPanel === 'history' ? 'text-white' : 'text-gray-600 bg-white'
                }`}
                style={rightPanel === 'history' ? { background: '#6366F1' } : {}}
              >
                <History size={13} />
                历史
              </button>
              <button
                onClick={() => setRightPanel('comments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  rightPanel === 'comments' ? 'text-white' : 'text-gray-600 bg-white'
                }`}
                style={rightPanel === 'comments' ? { background: '#F59E0B' } : {}}
              >
                <MessageCircle size={13} />
                评论
              </button>
            </div>
            <button
              onClick={() => setRightDrawerOpen(false)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-white transition-all"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 min-h-0" style={{ minHeight: '400px' }}>
            {rightPanel === 'history' && (
              <VersionHistoryPanel
                chapterId={currentChapterId || ''}
                isOpen={true}
                onClose={() => setRightDrawerOpen(false)}
              />
            )}
            {rightPanel === 'comments' && (
              <CommentPanel
                chapterId={currentChapterId || ''}
                isOpen={true}
                onClose={() => setRightDrawerOpen(false)}
                pendingSelection={pendingSelection}
                onConsumePending={handleConsumePending}
              />
            )}
          </div>
        </div>
        <style>{`
          @keyframes drawerInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </div>
    ) : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8FAFC' }}>
      {renderHeader()}

      <main className="flex-1 min-h-0">
        <div className="max-w-[1600px] mx-auto h-full p-4 lg:p-6">
          <div className="flex gap-4 lg:gap-6 h-[calc(100vh-92px)] min-h-[600px]">
            {renderLeftPanel()}
            {renderEditor()}
            {renderRightPanel()}
          </div>
        </div>
      </main>

      {renderLeftDrawer()}
      {renderRightDrawer()}
      {renderTabletFloatingButtons()}
    </div>
  );
}
