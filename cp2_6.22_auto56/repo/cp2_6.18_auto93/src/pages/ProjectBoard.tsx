import React, { useState } from 'react';
import { Share2, Plus, User } from 'lucide-react';
import { usePrototypeStore } from '../stores/prototypeStore';
import { ProjectCard } from '../components/ProjectCard';
import { NewProjectDialog } from '../components/NewProjectDialog';
import { InviteDialog } from '../modules/collab/InviteDialog';

export const ProjectBoard: React.FC = () => {
  const { projects, addProject, deleteProject, setCurrentProject } = usePrototypeStore();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [shareProjectId, setShareProjectId] = useState<string | null>(null);

  const handleCreateProject = (name: string, description: string) => {
    const project = addProject(name, description);
    setShowNewDialog(false);
    setCurrentProject(project.id);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个项目吗？')) {
      deleteProject(id);
    }
  };

  const handleShare = (id: string) => {
    setShareProjectId(id);
    setShowInviteDialog(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-[#1E293B] p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">ProtoFlow</h1>
          <span className="text-slate-400 text-sm">|</span>
          <span className="text-slate-300 text-sm">我的项目</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            新建项目
          </button>
          <button
            className="w-9 h-9 bg-slate-600 hover:bg-slate-500 rounded-full flex items-center justify-center text-white transition-colors"
            title="个人中心"
          >
            <User size={18} />
          </button>
        </div>
      </nav>

      <main className="p-8">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-slate-200 rounded-2xl flex items-center justify-center mb-6">
              <div className="text-4xl">🎨</div>
            </div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">
              开始创建你的第一个原型
            </h2>
            <p className="text-slate-500 mb-6 text-center max-w-md">
              使用交互式画布，轻松创建可分享的产品原型，让团队沟通更高效
            </p>
            <button
              onClick={() => setShowNewDialog(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all hover:shadow-lg text-base font-medium"
            >
              <Plus size={20} />
              新建项目
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800">
                全部项目 ({projects.length})
              </h2>
            </div>
            <div className="flex flex-wrap gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={() => handleDelete(project.id)}
                  onShare={() => handleShare(project.id)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <NewProjectDialog
        isOpen={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onCreate={handleCreateProject}
      />

      {shareProjectId && (
        <InviteDialog
          isOpen={showInviteDialog}
          onClose={() => {
            setShowInviteDialog(false);
            setShareProjectId(null);
          }}
          projectId={shareProjectId}
        />
      )}
    </div>
  );
};
