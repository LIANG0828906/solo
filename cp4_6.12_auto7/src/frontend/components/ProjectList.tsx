import { useState, useEffect } from 'react';
import {
  getProjects,
  updateProjectStatus,
  createProject,
  statusLabels,
  statusColors,
  statusOrder,
  type Project,
  type ProjectStatus
} from '../api/projects';

const projectTypes = ['桌子', '椅子', '柜子', '床头柜', '其他'];
const woodTypes = ['黑胡桃木', '北美红橡木', '美国樱桃木', '硬枫木', '白橡木', '水曲柳', '柚木', '榉木', '松木'];
const finishes = ['清漆', '木蜡油', '染色'];

const ProjectList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    project_type: '桌子',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    wood_type: '黑胡桃木',
    surface_finish: '清漆',
    expected_date: '',
    description: ''
  });

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError('加载项目列表失败，请稍后重试');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleStatusUpdate = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      const project = projects.find(p => p.id === projectId);
      await updateProjectStatus(projectId, newStatus);
      setSuccessMessage(`项目状态更新成功，通知邮件已发送至 ${project?.customer_email}`);
      await loadProjects();
    } catch (err) {
      setError('更新项目状态失败，请稍后重试');
      console.error(err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await createProject(formData);
      setSuccessMessage('项目提交成功，已进入待报价列表');
      setShowNewProjectModal(false);
      setFormData({
        project_type: '桌子',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        wood_type: '黑胡桃木',
        surface_finish: '清漆',
        expected_date: '',
        description: ''
      });
      await loadProjects();
    } catch (err) {
      setError('提交项目失败，请稍后重试');
      console.error(err);
    }
  };

  const getNextStatus = (currentStatus: ProjectStatus): ProjectStatus | null => {
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex < statusOrder.length - 1) {
      return statusOrder[currentIndex + 1];
    }
    return null;
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#757575' }}>加载中...</div>;
  }

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {successMessage && <div className="success">{successMessage}</div>}

      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: '#616161', margin: 0 }}>共 {projects.length} 个定制项目</p>
        <button className="btn btn-primary" onClick={() => setShowNewProjectModal(true)}>
          + 新建项目
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#757575' }}>
          暂无项目数据
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {projects.map((project) => (
            <div
              key={project.id}
              className="card"
              style={{ padding: '20px', cursor: 'pointer' }}
              onClick={() => {
                setSelectedProject(project);
                setShowDetailModal(true);
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#212121', margin: 0 }}>
                    {project.project_type}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#757575', marginTop: '4px', margin: 0 }}>
                    {project.customer_name}
                  </p>
                </div>
                <span
                  className="badge status-badge"
                  style={{ backgroundColor: statusColors[project.status] }}
                >
                  {statusLabels[project.status]}
                </span>
              </div>

              <div style={{ fontSize: '13px', color: '#616161', marginBottom: '12px' }}>
                <div style={{ marginBottom: '4px' }}>🪵 {project.wood_type}</div>
                <div style={{ marginBottom: '4px' }}>🎨 {project.surface_finish}</div>
                <div>📅 期望交付: {project.expected_date}</div>
              </div>

              {project.description && (
                <p style={{ fontSize: '13px', color: '#757575', marginBottom: '12px', lineHeight: 1.5 }}>
                  {project.description.length > 50 ? project.description.slice(0, 50) + '...' : project.description}
                </p>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                {getNextStatus(project.status) && (
                  <button
                    className="btn btn-success"
                    style={{ flex: 1, fontSize: '12px', padding: '6px 12px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusUpdate(project.id, getNextStatus(project.status)!);
                    }}
                  >
                    → {statusLabels[getNextStatus(project.status)!]}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewProjectModal && (
        <div className="modal-overlay" onClick={() => setShowNewProjectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">提交定制项目</h3>
              <button className="modal-close" onClick={() => setShowNewProjectModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label">项目类型 *</label>
                <select
                  className="form-select"
                  value={formData.project_type}
                  onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                >
                  {projectTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">客户姓名 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">联系邮箱 *</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">联系电话</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">木料种类 *</label>
                <select
                  className="form-select"
                  value={formData.wood_type}
                  onChange={(e) => setFormData({ ...formData, wood_type: e.target.value })}
                >
                  {woodTypes.map(wood => (
                    <option key={wood} value={wood}>{wood}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">表面处理方式 *</label>
                <select
                  className="form-select"
                  value={formData.surface_finish}
                  onChange={(e) => setFormData({ ...formData, surface_finish: e.target.value })}
                >
                  {finishes.map(finish => (
                    <option key={finish} value={finish}>{finish}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">期望交付日期 *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.expected_date}
                  onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">项目描述</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请描述您的定制需求..."
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewProjectModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  提交项目
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">项目详情</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '18px' }}>{selectedProject.project_type}</h4>
                <span
                  className="badge status-badge"
                  style={{ backgroundColor: statusColors[selectedProject.status] }}
                >
                  {statusLabels[selectedProject.status]}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
              <div>
                <span style={{ color: '#757575' }}>客户姓名：</span>
                <span>{selectedProject.customer_name}</span>
              </div>
              <div>
                <span style={{ color: '#757575' }}>联系邮箱：</span>
                <span>{selectedProject.customer_email}</span>
              </div>
              <div>
                <span style={{ color: '#757575' }}>联系电话：</span>
                <span>{selectedProject.customer_phone || '-'}</span>
              </div>
              <div>
                <span style={{ color: '#757575' }}>木料种类：</span>
                <span>{selectedProject.wood_type}</span>
              </div>
              <div>
                <span style={{ color: '#757575' }}>表面处理：</span>
                <span>{selectedProject.surface_finish}</span>
              </div>
              <div>
                <span style={{ color: '#757575' }}>期望交付：</span>
                <span>{selectedProject.expected_date}</span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: '#757575' }}>创建时间：</span>
                <span>{selectedProject.created_at}</span>
              </div>
            </div>

            {selectedProject.description && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ color: '#757575', fontSize: '14px', marginBottom: '4px' }}>项目描述：</p>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#424242', margin: 0 }}>
                  {selectedProject.description}
                </p>
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              <p style={{ color: '#757575', fontSize: '14px', marginBottom: '10px' }}>更新状态：</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {statusOrder.map((status) => (
                  <button
                    key={status}
                    className="btn"
                    style={{
                      fontSize: '12px',
                      padding: '6px 12px',
                      backgroundColor: status === selectedProject.status ? statusColors[status] : '#EFEBE9',
                      color: status === selectedProject.status ? '#fff' : '#4E342E',
                      opacity: statusOrder.indexOf(status) > statusOrder.indexOf(selectedProject.status) + 1 ? 0.5 : 1,
                      cursor: statusOrder.indexOf(status) <= statusOrder.indexOf(selectedProject.status) ? 'not-allowed' : 'pointer'
                    }}
                    disabled={statusOrder.indexOf(status) <= statusOrder.indexOf(selectedProject.status)}
                    onClick={() => {
                      if (statusOrder.indexOf(status) > statusOrder.indexOf(selectedProject.status)) {
                        handleStatusUpdate(selectedProject.id, status);
                        setShowDetailModal(false);
                      }
                    }}
                  >
                    {statusLabels[status]}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
