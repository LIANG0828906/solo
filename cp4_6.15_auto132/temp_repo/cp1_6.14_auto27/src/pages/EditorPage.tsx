import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  GripVertical,
  Menu,
  X,
  BarChart3,
  FileText,
} from 'lucide-react';
import Editor from '../editor/Editor';
import StatsPanel from '../editor/StatsPanel';
import { projectApi, chapterApi, getProjectWordCount, setProjectWordCount, recordDailyWords } from '../utils/api';
import { todayStr } from '../utils/textStats';
import type { Project, Chapter } from '../../shared/types';

const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [content, setContent] = useState('');
  const [plainText, setPlainText] = useState('');
  const [chaptersExpanded, setChaptersExpanded] = useState(true);
  const [statsExpanded, setStatsExpanded] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (projectId: string) => {
    try {
      const [p, chs] = await Promise.all([projectApi.get(projectId), chapterApi.list(projectId)]);
      setProject(p);
      setChapters(chs);
      if (chs.length > 0) {
        setSelectedChapter(chs[0]);
      }
      let totalWc = 0;
      for (const ch of chs) {
        const tmp = document.createElement('div');
        tmp.innerHTML = ch.content;
        const text = tmp.textContent || tmp.innerText || '';
        const cn = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const en = text.replace(/[\u4e00-\u9fa5]/g, ' ').split(/\s+/).filter(w => /[a-zA-Z0-9]/.test(w)).length;
        totalWc += cn + en;
      }
      setProjectWordCount(projectId, totalWc);
    } catch (e) {
      console.error('Load failed:', e);
    }
  };

  const handleAddChapter = async () => {
    if (!id) return;
    const title = prompt('章节标题:', `第${chapters.length + 1}章`);
    if (!title) return;
    try {
      const ch = await chapterApi.create(id, { title });
      setChapters([...chapters, ch]);
      setSelectedChapter(ch);
    } catch (e) {
      console.error('Create chapter failed:', e);
    }
  };

  const handleDeleteChapter = async (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定删除该章节吗？')) return;
    try {
      await chapterApi.remove(chapterId);
      const newChapters = chapters.filter((c) => c.id !== chapterId);
      setChapters(newChapters);
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter(newChapters[0] || null);
      }
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const handleContentChange = useCallback(
    (html: string, text: string) => {
      setContent(html);
      setPlainText(text);
    },
    [],
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      if (!selectedChapter) return;
      setSelectedChapter({ ...selectedChapter, title });
      setChapters(chapters.map((c) => (c.id === selectedChapter.id ? { ...c, title } : c)));
    },
    [selectedChapter, chapters],
  );

  const handleDragStart = (e: React.DragEvent, chapterId: string) => {
    dragIdRef.current = chapterId;
    e.dataTransfer.setData('text/plain', chapterId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, chapterId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== chapterId) setDragOverId(chapterId);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    const draggedId = dragIdRef.current;
    if (!draggedId || draggedId === targetId || !id) return;

    const newChapters = [...chapters];
    const draggedIdx = newChapters.findIndex((c) => c.id === draggedId);
    const targetIdx = newChapters.findIndex((c) => c.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const [removed] = newChapters.splice(draggedIdx, 1);
    newChapters.splice(targetIdx, 0, removed);
    setChapters(newChapters);
    dragIdRef.current = null;

    try {
      await chapterApi.reorder(id, newChapters.map((c) => c.id));
    } catch (e) {
      console.error('Reorder failed:', e);
    }
  };

  const handleSaveToBackend = async () => {
    if (!selectedChapter || !content) return;
    try {
      const wc = getProjectWordCount(id || '');
      await chapterApi.update(selectedChapter.id, { content, title: selectedChapter.title });
      await projectApi.update(id || '', {});
      recordDailyWords(id || '', 0, plainText.slice(0, 200));
      try {
        await fetch('/api/writing-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: id,
            date: todayStr(),
            wordsAdded: wc,
            snippets: [plainText.slice(0, 200)],
          }),
        });
      } catch {
        /* ignore */
      }
    } catch (e) {
      console.error('Save backend failed:', e);
    }
  };

  const Sidebar = () => (
    <div className="h-full bg-primary-500 text-white flex flex-col">
      <div className="p-4 border-b border-white/10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回仪表板</span>
        </button>
        <h2 className="font-serif text-xl font-bold mt-3 text-white truncate">
          {project?.title || '加载中...'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-white/10">
          <button
            onClick={() => setChaptersExpanded(!chaptersExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent-light" />
              <span className="font-semibold text-sm uppercase tracking-wide">章节管理</span>
            </div>
            {chaptersExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {chaptersExpanded && (
            <div className="pb-2">
              <div className="max-h-72 overflow-y-auto">
                {chapters.map((ch) => (
                  <div
                    key={ch.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ch.id)}
                    onDragOver={(e) => handleDragOver(e, ch.id)}
                    onDragLeave={() => setDragOverId(null)}
                    onDrop={(e) => handleDrop(e, ch.id)}
                    onClick={() => {
                      handleSaveToBackend();
                      setSelectedChapter(ch);
                      if (isMobile) setSidebarOpen(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-all group ${
                      selectedChapter?.id === ch.id
                        ? 'bg-accent text-white'
                        : 'hover:bg-white/5 text-white/80'
                    } ${dragOverId === ch.id ? 'border-l-4 border-accent-light bg-white/5' : ''}`}
                    style={{
                      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    <GripVertical className="w-4 h-4 cursor-grab opacity-50 group-hover:opacity-100 flex-shrink-0" />
                    <span className="flex-1 truncate text-sm">{ch.title}</span>
                    <button
                      onClick={(e) => handleDeleteChapter(ch.id, e)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-opacity flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddChapter}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-accent-light hover:text-white hover:bg-white/5 transition-colors border-t border-white/5 mt-1"
              >
                <Plus className="w-4 h-4" />
                添加章节
              </button>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => setStatsExpanded(!statsExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent-light" />
              <span className="font-semibold text-sm uppercase tracking-wide">实时统计</span>
            </div>
            {statsExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {statsExpanded && (
            <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
              <StatsPanel content={plainText} />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'w-72 flex-shrink-0'
        }`}
      >
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center px-4 py-3 bg-white border-b border-primary-100 shadow-sm">
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 mr-3 rounded-lg hover:bg-primary-50 transition-colors"
            >
              <Menu className="w-5 h-5 text-primary-600" />
            </button>
          )}
          <div className="flex-1 text-sm text-primary-400">
            {selectedChapter && (
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                正在编辑: <strong className="text-primary-600">{selectedChapter.title}</strong>
              </span>
            )}
          </div>
          {isMobile && statsExpanded && (
            <button
              onClick={() => setStatsExpanded(false)}
              className="p-2 rounded-lg hover:bg-primary-50 transition-colors"
            >
              <X className="w-5 h-5 text-primary-600" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          {!selectedChapter ? (
            <div className="h-full flex flex-col items-center justify-center text-primary-400">
              <FileText className="w-16 h-16 mb-4 opacity-30" />
              <p className="mb-4">没有选中章节</p>
              <button
                onClick={handleAddChapter}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
              >
                创建第一个章节
              </button>
            </div>
          ) : (
            <Editor
              key={selectedChapter.id}
              chapterId={selectedChapter.id}
              projectId={id || ''}
              chapterTitle={selectedChapter.title}
              initialContent={selectedChapter.content}
              onContentChange={handleContentChange}
              onTitleChange={handleTitleChange}
            />
          )}
        </div>

        {isMobile && statsExpanded && (
          <div className="h-48 bg-primary-500 border-t border-white/10 overflow-y-auto">
            <StatsPanel content={plainText} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPage;
