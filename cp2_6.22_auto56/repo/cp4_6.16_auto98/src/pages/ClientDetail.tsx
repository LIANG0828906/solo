import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Plus,
  Mail,
  Phone,
  FileText,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import Modal from '@/components/Modal';
import { useClientStore } from '@/modules/client/store';
import { useQuoteStore } from '@/modules/quote/store';
import type { Project } from '@/modules/client/types';
import { cn } from '@/lib/utils';

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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(amount);
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

function ProjectCardItem({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 group-hover:text-primary">
            {project.name}
          </h4>
          <p className="mt-1 text-sm text-gray-500">
            <Calendar className="mr-1 inline h-3.5 w-3.5" />
            {formatDate(project.startDate)} - {formatDate(project.endDate)}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">
            {project.description || '暂无描述'}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-0.5" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <span className="text-xs text-gray-500">点击查看报价</span>
      </div>
    </div>
  );
}

export default function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { clients, getProjectsByClient, addProject } = useClientStore();
  const { exportClientData } = useQuoteStore();

  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [projectForm, setProjectForm] =
    useState<ProjectFormData>(emptyProjectForm);

  const client = useMemo(() => {
    return clients.find((c) => c.id === clientId);
  }, [clients, clientId]);

  const projects = useMemo(() => {
    if (!clientId) return [];
    return getProjectsByClient(clientId);
  }, [clientId, getProjectsByClient]);

  const avatarColor = client ? getAvatarColor(client.name) : '#ccc';
  const initial = client ? getInitial(client.name) : '?';

  const handleAddProject = () => {
    if (!projectForm.name.trim() || !clientId) return;
    addProject({
      clientId,
      name: projectForm.name,
      description: projectForm.description,
      startDate: projectForm.startDate || new Date().toISOString(),
      endDate: projectForm.endDate || new Date().toISOString(),
    });
    setIsAddProjectModalOpen(false);
    setProjectForm(emptyProjectForm);
  };

  const handleExport = async () => {
    if (!clientId) return;
    setIsExporting(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const dataStr = exportClientData(clientId);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${client?.name || 'client'}_data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExporting(false);
    setIsExportModalOpen(false);
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/quote/${projectId}`);
  };

  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-gray-600">客户不存在</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-primary hover:underline"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center gap-1.5 text-gray-600 transition-colors hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          返回首页
        </button>

        <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="relative h-32 bg-gradient-to-r from-primary to-blue-700" />
          <div className="relative px-6 pb-6">
            <div className="-mt-12 flex items-end justify-between">
              <div className="flex items-end gap-4">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-2xl text-3xl font-bold text-white shadow-lg"
                  style={{ backgroundColor: avatarColor }}
                >
                  {initial}
                </div>
                <div className="pb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {client.name}
                  </h1>
                  <p className="text-sm text-gray-500">
                    创建于 {formatDate(client.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="mb-2 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-accent/90 hover:-translate-y-px"
              >
                <Download size={16} />
                导出数据
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Mail size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">邮箱</p>
                  <p className="truncate text-sm font-medium text-gray-900">
                    {client.email || '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Phone size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">电话</p>
                  <p className="truncate text-sm font-medium text-gray-900">
                    {client.phone || '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">项目数</p>
                  <p className="text-sm font-medium text-gray-900">
                    {projects.length} 个
                  </p>
                </div>
              </div>
            </div>

            {client.notes && (
              <div className="mt-4">
                <p className="text-xs text-gray-500">备注</p>
                <p className="mt-1 text-sm text-gray-700">{client.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">项目列表</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {projects.length}
            </span>
          </div>
          <button
            onClick={() => setIsAddProjectModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 hover:-translate-y-px"
          >
            <Plus size={16} />
            添加项目
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCardItem
              key={project.id}
              project={project}
              onClick={() => handleProjectClick(project.id)}
            />
          ))}
        </div>

        {projects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">暂无项目</p>
            <button
              onClick={() => setIsAddProjectModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90"
            >
              <Plus size={16} />
              添加第一个项目
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        onConfirm={handleAddProject}
        title="添加项目"
        confirmText="添加"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              项目名称 <span className="text-red-500">*</span>
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
                setProjectForm({
                  ...projectForm,
                  description: e.target.value,
                })
              }
              rows={4}
              className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="请输入项目描述"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isExportModalOpen}
        onClose={() => !isExporting && setIsExportModalOpen(false)}
        onConfirm={handleExport}
        title="确认导出"
        confirmText={isExporting ? '导出中...' : '确认导出'}
        showCancel={!isExporting}
      >
        <div className="py-4 text-center">
          {isExporting ? (
            <div className="flex flex-col items-center">
              <div className="relative">
                <Download
                  className={cn(
                    'h-16 w-16 text-accent',
                    'animate-bounce'
                  )}
                  style={{ animationDuration: '1s' }}
                />
                <div
                  className="absolute inset-0 rounded-full border-4 border-accent/30 border-t-accent"
                  style={{ animation: 'spin 1s linear infinite' }}
                />
              </div>
              <p className="mt-4 text-gray-600">正在导出数据...</p>
            </div>
          ) : (
            <div>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <Download className="h-8 w-8 text-accent" />
              </div>
              <p className="mt-4 text-gray-600">
                确定要导出客户 &quot;
                <span className="font-medium text-gray-900">{client.name}</span>
                &quot; 的所有数据吗？
              </p>
              <p className="mt-2 text-sm text-gray-500">
                将导出客户信息、报价单和发票数据为 JSON 格式
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
