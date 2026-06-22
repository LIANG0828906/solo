import { useState, useMemo } from 'react';
import { Plus, Search, LayoutGrid, SlidersHorizontal, Sparkles, BookOpen } from 'lucide-react';
import { useInkFlowStore } from '@/store/useInkFlowStore';
import type { Project } from '@/types';
import ProjectCard from '@/components/ProjectCard';
import CreateProjectModal from '@/components/CreateProjectModal';
import ContextMenu, { type MenuItem } from '@/components/ContextMenu';

interface ContextMenuState {
  project: Project;
  x: number;
  y: number;
}

export default function ProjectManager() {
  const projects = useInkFlowStore((s) => s.projects);
  const createProject = useInkFlowStore((s) => s.createProject);
  const updateProject = useInkFlowStore((s) => s.updateProject);
  const deleteProject = useInkFlowStore((s) => s.deleteProject);
  const setCurrentProject = useInkFlowStore((s) => s.setCurrentProject);

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Project | null>(null);

  const filteredProjects = useMemo(() => {
    const result = projects.filter(
      (p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    result.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return result;
  }, [projects, searchQuery]);

  const favoriteProjects = useMemo(
    () => filteredProjects.filter((p) => p.isFavorite),
    [filteredProjects]
  );
  const otherProjects = useMemo(
    () => filteredProjects.filter((p) => !p.isFavorite),
    [filteredProjects]
  );

  const handleCreateOrEdit = (title: string, description: string) => {
    if (editingProject) {
      updateProject(editingProject.id, { title, description });
    } else {
      createProject(title, description);
    }
    setShowCreateModal(false);
    setEditingProject(null);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowCreateModal(true);
  };

  const handleShare = async (project: Project) => {
    const shareData = {
      title: project.title,
      text: project.description || '来看看我的写作项目吧',
      url: `${window.location.origin}/project/${project.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.warn('Web Share failed, fallback to copy', e);
      } else {
        return;
      }
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        alert('项目链接已复制到剪贴板');
      }
    } catch (e) {
      console.warn('Copy to clipboard failed', e);
      alert('分享失败，请手动复制链接');
    }
  };

  const handleMore = (project: Project, event: React.MouseEvent) => {
    setContextMenu({
      project,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleDelete = (project: Project) => {
    setShowDeleteConfirm(project);
    setContextMenu(null);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      deleteProject(showDeleteConfirm.id);
      setShowDeleteConfirm(null);
    }
  };

  const getContextMenuItems = (project: Project): MenuItem[] => [
    {
      key: 'open',
      label: '打开项目',
      icon: 'edit',
      onClick: () => setCurrentProject(project.id),
    },
    {
      key: 'edit',
      label: '编辑信息',
      icon: 'edit',
      onClick: () => handleEdit(project),
    },
    {
      key: 'share',
      label: '分享链接',
      icon: 'share',
      onClick: () => handleShare(project),
    },
    {
      key: 'copy',
      label: '复制标题',
      icon: 'copy',
      onClick: () => {
        if (navigator.clipboard) navigator.clipboard.writeText(project.title);
      },
    },
    {
      key: 'delete',
      label: '删除项目',
      icon: 'delete',
      danger: true,
      onClick: () => handleDelete(project),
    },
  ];

  const renderSection = (title: string, items: Project[], showStar?: boolean) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 px-1">
          {showStar && (
            <span style={{ color: '#F59E0B' }} className="text-lg">
              ★
            </span>
          )}
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {title}
            <span className="ml-2 text-xs font-normal text-gray-400">{items.length}</span>
          </h2>
        </div>
        <div
          className="grid gap-5"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, 280px)',
            justifyContent: 'start',
          }}
        >
          {items.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onShare={handleShare}
              onMore={handleMore}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: '#F8FAFC' }}
    >
      <header className="sticky top-0 z-40 backdrop-blur-md border-b border-gray-200/60" style={{ background: 'rgba(248,250,252,0.85)' }}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-4">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                }}
              >
                <Sparkles className="text-white" size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  InkFlow
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full text-white" style={{ background: '#F59E0B' }}>
                    Beta
                  </span>
                </h1>
                <p className="text-xs text-gray-400">创意写作与故事协作平台</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-1 max-w-xl min-w-0">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索项目..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none transition-all focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/10 shadow-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="p-2.5 rounded-xl text-gray-500 hover:bg-white hover:text-gray-700 transition-all active:scale-[0.96] shadow-sm"
                title="筛选"
              >
                <SlidersHorizontal size={18} />
              </button>
              <button
                className="p-2.5 rounded-xl text-gray-500 hover:bg-white hover:text-gray-700 transition-all active:scale-[0.96] shadow-sm"
                title="切换视图"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-all active:scale-[0.96] shadow-md hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                }}
              >
                <Plus size={18} />
                <span className="hidden sm:inline">新建项目</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
        {favoriteProjects.length > 0 && otherProjects.length > 0 && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.1)' }}
              >
                <BookOpen size={20} style={{ color: '#6366F1' }} />
              </div>
              <div>
                <p className="text-xs text-gray-400">全部项目</p>
                <p className="text-xl font-bold text-gray-800">{projects.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.1)' }}
              >
                <span style={{ color: '#F59E0B' }} className="text-lg">★</span>
              </div>
              <div>
                <p className="text-xs text-gray-400">收藏项目</p>
                <p className="text-xl font-bold text-gray-800">{favoriteProjects.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.1)' }}
              >
                <Sparkles size={20} style={{ color: '#10B981' }} />
              </div>
              <div>
                <p className="text-xs text-gray-400">本周更新</p>
                <p className="text-xl font-bold text-gray-800">
                  {projects.filter((p) => {
                    const d = new Date(p.updatedAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return d >= weekAgo;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        )}

        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 opacity-50"
              style={{ background: 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)' }}
            >
              <BookOpen size={48} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery ? '没有找到匹配的项目' : '还没有任何项目'}
            </h3>
            <p className="text-sm text-gray-400 mb-6 max-w-sm">
              {searchQuery ? '试试换个关键词搜索吧' : '创建你的第一个写作项目，开启创意之旅'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all active:scale-[0.96] shadow-md hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                }}
              >
                <Plus size={18} />
                新建项目
              </button>
            )}
          </div>
        ) : (
          <>
            {renderSection('收藏的项目', favoriteProjects, true)}
            {renderSection('全部项目', otherProjects)}
          </>
        )}
      </main>

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingProject(null);
        }}
        onSubmit={handleCreateOrEdit}
        editingProject={editingProject}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems(contextMenu.project)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-2xl p-6"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">删除项目</h3>
            <p className="text-sm text-gray-500 mb-6">
              确定要删除项目「<span className="font-medium text-gray-700">{showDeleteConfirm.title}</span>」吗？
              此操作不可恢复，所有章节和版本历史将被永久删除。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all active:scale-[0.96]"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all active:scale-[0.96] bg-red-500 hover:bg-red-600"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
