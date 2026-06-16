import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/store/useProjectStore';
import { Timeline } from '@/components/Timeline';
import type { ProjectLog } from '@/types';
import { Plus, X, Edit2, Trash2, CheckCircle, ChevronRight, FolderOpen, Clock, Image as ImageIcon, Calendar } from 'lucide-react';
import { validateAndConvertImage } from '@/utils/image';
import { formatDate, formatHours } from '@/utils/format';

export function TimelinePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    projects,
    currentProjectId,
    createProject,
    updateProject,
    deleteProject,
    markProjectCompleted,
    setCurrentProject,
    addMaterialUsage,
    materials
  } = useProjectStore();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectLog | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    totalHours: 0,
    coverImage: undefined as string | undefined
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    materialId: '',
    quantityUsed: 0
  });

  useEffect(() => {
    if (projectId) {
      setCurrentProject(projectId);
    } else if (projects.length > 0 && !currentProjectId) {
      setCurrentProject(projects[0].id);
    }
  }, [projectId, projects, currentProjectId, setCurrentProject]);

  const currentProject = projectId
    ? projects.find((p) => p.id === projectId)
    : projects.find((p) => p.id === currentProjectId) || projects[0];

  const openNewProjectForm = () => {
    setEditingProject(null);
    setFormData({ title: '', description: '', totalHours: 0, coverImage: undefined });
    setCoverFile(null);
    setError('');
    setShowProjectForm(true);
  };

  const openEditProjectForm = (p: ProjectLog) => {
    setEditingProject(p);
    setFormData({
      title: p.title,
      description: p.description,
      totalHours: p.totalHours,
      coverImage: p.coverImage
    });
    setCoverFile(null);
    setError('');
    setShowProjectForm(true);
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await validateAndConvertImage(file);
      setFormData((p) => ({ ...p, coverImage: data }));
      setCoverFile(file);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('请填写作品名称');
      return;
    }
    try {
      if (editingProject) {
        await updateProject(editingProject.id, formData);
      } else {
        const newId = await createProject(formData);
        navigate(`/timeline/${newId}`);
      }
      setShowProjectForm(false);
    } catch (err) {
      setError('保存失败，请重试');
    }
  };

  const handleDeleteProject = async (id: string, title: string) => {
    if (confirm(`确定删除作品"${title}"及其所有步骤？`)) {
      await deleteProject(id);
      if (currentProjectId === id) {
        setCurrentProject(projects.length > 1 ? projects.find(p => p.id !== id)?.id || null : null);
      }
    }
  };

  const handleComplete = async (id: string) => {
    if (confirm('标记作品为已完成？完成后将出现在作品展示架中。')) {
      await markProjectCompleted(id);
    }
  };

  const handleAddMaterialUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !materialForm.materialId || materialForm.quantityUsed <= 0) {
      return;
    }
    const mat = materials.find(m => m.id === materialForm.materialId);
    if (!mat) return;
    await addMaterialUsage(currentProject.id, {
      materialId: mat.id,
      materialName: mat.name,
      quantityUsed: materialForm.quantityUsed,
      unit: mat.unit,
      unitPrice: mat.unitPrice
    });
    setShowMaterialForm(false);
    setMaterialForm({ materialId: '', quantityUsed: 0 });
  };

  return (
    <div className="timeline-page">
      <div className="page-layout">
        <aside className="project-sidebar">
          <div className="sidebar-header">
            <h3>我的作品</h3>
            <button className="btn-icon-primary" onClick={openNewProjectForm} title="新建作品">
              <Plus size={18} />
            </button>
          </div>
          <div className="project-list">
            {projects.length === 0 ? (
              <div className="sidebar-empty">
                <FolderOpen size={36} />
                <p>还没有作品</p>
                <button className="btn-secondary btn-small" onClick={openNewProjectForm}>
                  创建第一个作品
                </button>
              </div>
            ) : (
              projects.map((p) => (
                <div
                  key={p.id}
                  className={`project-item ${currentProject?.id === p.id ? 'active' : ''} ${p.isCompleted ? 'completed' : ''}`}
                  onClick={() => {
                    setCurrentProject(p.id);
                    navigate(`/timeline/${p.id}`);
                  }}
                >
                  <div className="project-item-cover">
                    {p.coverImage ? (
                      <img src={p.coverImage} alt="" />
                    ) : (
                      <FolderOpen size={20} />
                    )}
                  </div>
                  <div className="project-item-info">
                    <div className="project-item-title">
                      {p.title}
                      {p.isCompleted && <CheckCircle size={12} className="completed-icon" />}
                    </div>
                    <div className="project-item-meta">
                      <Clock size={11} />
                      <span>{formatHours(p.totalHours)}</span>
                      <span className="dot">·</span>
                      <span>{p.steps.length} 步骤</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="chevron" />
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="project-main">
          {!currentProject ? (
            <div className="no-project-selected">
              <FolderOpen size={64} />
              <h2>选择或创建一个作品</h2>
              <p>开始你的创作之旅吧</p>
              <button className="btn-primary" onClick={openNewProjectForm}>
                <Plus size={18} /> 新建作品
              </button>
            </div>
          ) : (
            <>
              <div className="project-header-card">
                <div className="project-header-cover">
                  {currentProject.coverImage ? (
                    <img src={currentProject.coverImage} alt={currentProject.title} />
                  ) : (
                    <div className="no-cover-placeholder">
                      <ImageIcon size={48} />
                      <span>暂无封面</span>
                    </div>
                  )}
                </div>
                <div className="project-header-info">
                  <div className="project-header-top">
                    <h1>{currentProject.title}</h1>
                    <div className="project-header-actions">
                      {!currentProject.isCompleted && (
                        <button className="btn-success" onClick={() => handleComplete(currentProject.id)}>
                          <CheckCircle size={16} /> 标记完成
                        </button>
                      )}
                      {currentProject.isCompleted && (
                        <span className="completed-badge">
                          <CheckCircle size={14} /> 已完成
                        </span>
                      )}
                      <button className="btn-secondary" onClick={() => openEditProjectForm(currentProject)}>
                        <Edit2 size={14} /> 编辑
                      </button>
                      <button className="btn-danger" onClick={() => handleDeleteProject(currentProject.id, currentProject.title)}>
                        <Trash2 size={14} /> 删除
                      </button>
                    </div>
                  </div>
                  <p className="project-description">{currentProject.description || '暂无描述'}</p>
                  <div className="project-stats">
                    <div className="stat-item">
                      <Calendar size={14} />
                      <span>开始：{formatDate(currentProject.startDate)}</span>
                    </div>
                    {currentProject.endDate && (
                      <div className="stat-item">
                        <CheckCircle size={14} />
                        <span>完成：{formatDate(currentProject.endDate)}</span>
                      </div>
                    )}
                    <div className="stat-item">
                      <Clock size={14} />
                      <span>耗时：{formatHours(currentProject.totalHours)}</span>
                    </div>
                    <div className="stat-item">
                      <span>共 {currentProject.steps.length} 个步骤</span>
                    </div>
                  </div>
                  {currentProject.materialUsages.length > 0 && (
                    <div className="material-usages-preview">
                      <h4>使用材料（{currentProject.materialUsages.length}）</h4>
                      <div className="usages-tags">
                        {currentProject.materialUsages.map(u => (
                          <span key={u.id} className="usage-tag">
                            {u.materialName} {u.quantityUsed}{u.unit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <button className="btn-link" onClick={() => setShowMaterialForm(true)}>
                    <Plus size={14} /> 添加材料使用记录
                  </button>
                </div>
              </div>
              <Timeline project={currentProject} />
            </>
          )}
        </main>
      </div>

      {showProjectForm && (
        <div className="modal-overlay" onClick={() => setShowProjectForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProject ? '编辑作品' : '新建作品'}</h3>
              <button className="icon-btn" onClick={() => setShowProjectForm(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleProjectSubmit} className="modal-body">
              {error && <div className="error-message">{error}</div>}
              <div className="form-group">
                <label>作品名称 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="给你的作品起个名字..."
                />
              </div>
              <div className="form-group">
                <label>作品描述</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="简单介绍一下这个作品..."
                />
              </div>
              <div className="form-group">
                <label>预计/实际总耗时 (小时)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.totalHours}
                  onChange={(e) => setFormData((p) => ({ ...p, totalHours: Number(e.target.value) }))}
                />
              </div>
              <div className="form-group">
                <label>封面图片 (JPG/PNG，≤5MB)</label>
                <label className="file-upload">
                  <ImageIcon size={18} />
                  <span>{coverFile ? coverFile.name : '选择封面图片'}</span>
                  <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleCoverChange} />
                </label>
                {formData.coverImage && (
                  <div className="image-preview cover-preview">
                    <img src={formData.coverImage} alt="封面预览" />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowProjectForm(false)}>
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  {editingProject ? '保存修改' : '创建作品'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMaterialForm && currentProject && (
        <div className="modal-overlay" onClick={() => setShowMaterialForm(false)}>
          <div className="modal-content small-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加材料使用记录</h3>
              <button className="icon-btn" onClick={() => setShowMaterialForm(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddMaterialUsage} className="modal-body">
              <div className="form-group">
                <label>选择材料</label>
                <select
                  value={materialForm.materialId}
                  onChange={(e) => setMaterialForm((p) => ({ ...p, materialId: e.target.value }))}
                >
                  <option value="">请选择材料</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}（库存: {m.quantity}{m.unit}，单价 ¥{m.unitPrice}）
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>使用数量</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={materialForm.quantityUsed}
                  onChange={(e) => setMaterialForm((p) => ({ ...p, quantityUsed: Number(e.target.value) }))}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowMaterialForm(false)}>
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
