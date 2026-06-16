import { useState } from 'react';
import {
  Mail,
  Phone,
  Edit2,
  Trash2,
  Plus,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClientStore } from '../store';
import type { Client, Project } from '../types';
import Modal from '@/components/Modal';

const AVATAR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9',
  '#F8B500',
  '#00CED1',
];

function getAvatarColor(name: string): string {
  const firstChar = name.charAt(0).toUpperCase();
  const index = firstChar.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

interface ProjectFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

const emptyProjectForm: ProjectFormData = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
};

interface ProjectCardProps {
  project: Project;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ProjectCard({
  project,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all duration-300 ease-in-out',
        isHovered && 'shadow-md'
      )}
      style={{
        height: isExpanded ? '400px' : '100px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="cursor-pointer p-4"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{project.name}</h4>
            <p className="mt-1 text-sm text-gray-500">
              {formatDate(project.startDate)} - {formatDate(project.endDate)}
            </p>
          </div>
          <div
            className={cn(
              'flex gap-1 transition-opacity duration-200',
              isHovered && !isExpanded ? 'opacity-100' : 'opacity-0'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onEdit}
              className="rounded-md p-1.5 text-gray-400 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 hover:-translate-y-px"
              title="编辑项目"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={onDelete}
              className="rounded-md p-1.5 text-gray-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600 hover:-translate-y-px"
              title="删除项目"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {!isExpanded && (
          <p className="mt-2 line-clamp-1 text-sm text-gray-600">
            {project.description}
          </p>
        )}
      </div>

      {isExpanded && (
        <div className="flex h-[calc(400px-100px)] flex-col">
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {project.description}
            </p>
          </div>
          <div className="border-t border-border px-4 py-3">
            <div className="flex justify-end gap-2">
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:-translate-y-px"
              >
                <Edit2 size={16} />
                编辑
              </button>
              <button
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-accent transition-all duration-200 hover:bg-orange-50 hover:-translate-y-px"
              >
                <FileSpreadsheet size={16} />
                创建发票
              </button>
              <button
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 hover:-translate-y-px"
              >
                <FileText size={16} />
                查看合同
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ClientCardProps {
  client: Client;
}

export default function ClientCard({ client }: ClientCardProps) {
  const { getProjectsByClient, addProject, updateProject, deleteProject } =
    useClientStore();
  const projects = getProjectsByClient(client.id);

  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectFormData>(emptyProjectForm);

  const handleToggleProject = (projectId: string) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  const handleAddProject = () => {
    setProjectForm(emptyProjectForm);
    setIsAddProjectModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setCurrentProject(project);
    setProjectForm({
      name: project.name,
      description: project.description,
      startDate: project.startDate.split('T')[0],
      endDate: project.endDate.split('T')[0],
    });
    setIsEditProjectModalOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setCurrentProject(project);
    setIsDeleteProjectModalOpen(true);
  };

  const handleConfirmAddProject = () => {
    if (!projectForm.name.trim()) return;
    addProject({
      clientId: client.id,
      name: projectForm.name,
      description: projectForm.description,
      startDate: projectForm.startDate || new Date().toISOString(),
      endDate: projectForm.endDate || new Date().toISOString(),
    });
    setIsAddProjectModalOpen(false);
    setProjectForm(emptyProjectForm);
  };

  const handleConfirmEditProject = () => {
    if (!currentProject || !projectForm.name.trim()) return;
    updateProject(currentProject.id, {
      name: projectForm.name,
      description: projectForm.description,
      startDate: projectForm.startDate || currentProject.startDate,
      endDate: projectForm.endDate || currentProject.endDate,
    });
    setIsEditProjectModalOpen(false);
    setCurrentProject(null);
    setProjectForm(emptyProjectForm);
  };

  const handleConfirmDeleteProject = () => {
    if (!currentProject) return;
    deleteProject(currentProject.id);
    if (expandedProjectId === currentProject.id) {
      setExpandedProjectId(null);
    }
    setIsDeleteProjectModalOpen(false);
    setCurrentProject(null);
  };

  const avatarColor = getAvatarColor(client.name);
  const initial = getInitial(client.name);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
              style={{ backgroundColor: avatarColor }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold text-gray-900">
                {client.name}
              </h3>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={14} className="flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} className="flex-shrink-0" />
                  <span className="truncate">{client.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">项目列表</h4>
            <button
              onClick={handleAddProject}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-primary transition-all duration-200 hover:bg-primary/10 hover:-translate-y-px"
            >
              <Plus size={16} />
              添加项目
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isExpanded={expandedProjectId === project.id}
                onToggle={() => handleToggleProject(project.id)}
                onEdit={() => handleEditProject(project)}
                onDelete={() => handleDeleteProject(project)}
              />
            ))}
          </div>

          {projects.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400">
              暂无项目
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        onConfirm={handleConfirmAddProject}
        title="添加项目"
        confirmText="添加"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              项目名称
            </label>
            <input
              type="text"
              value={projectForm.name}
              onChange={(e) =>
                setProjectForm({ ...projectForm, name: e.target.value })
              }
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="请输入项目名称"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                开始日期
              </label>
              <input
                type="date"
                value={projectForm.startDate}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, startDate: e.target.value })
                }
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                结束日期
              </label>
              <input
                type="date"
                value={projectForm.endDate}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, endDate: e.target.value })
                }
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              项目描述
            </label>
            <textarea
              value={projectForm.description}
              onChange={(e) =>
                setProjectForm({ ...projectForm, description: e.target.value })
              }
              rows={4}
              className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="请输入项目描述"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditProjectModalOpen}
        onClose={() => setIsEditProjectModalOpen(false)}
        onConfirm={handleConfirmEditProject}
        title="编辑项目"
        confirmText="保存"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              项目名称
            </label>
            <input
              type="text"
              value={projectForm.name}
              onChange={(e) =>
                setProjectForm({ ...projectForm, name: e.target.value })
              }
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="请输入项目名称"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                开始日期
              </label>
              <input
                type="date"
                value={projectForm.startDate}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, startDate: e.target.value })
                }
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                结束日期
              </label>
              <input
                type="date"
                value={projectForm.endDate}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, endDate: e.target.value })
                }
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              项目描述
            </label>
            <textarea
              value={projectForm.description}
              onChange={(e) =>
                setProjectForm({ ...projectForm, description: e.target.value })
              }
              rows={4}
              className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="请输入项目描述"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteProjectModalOpen}
        onClose={() => setIsDeleteProjectModalOpen(false)}
        onConfirm={handleConfirmDeleteProject}
        title="确认删除"
        confirmText="删除"
      >
        <p className="text-sm text-gray-600">
          确定要删除项目 "
          <span className="font-medium text-gray-900">
            {currentProject?.name}
          </span>
          " 吗？此操作不可撤销。
        </p>
      </Modal>
    </>
  );
}
