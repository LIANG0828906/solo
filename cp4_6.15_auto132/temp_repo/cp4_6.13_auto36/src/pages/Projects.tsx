import { useEffect, useState } from 'react';
import { fetchProjects, addProject, Project } from '../utils/api';
import ProjectCard from '../components/ProjectCard';

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const futureISO = (days = 30) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    start_date: todayISO(),
    end_date: futureISO(30),
    client_name: '',
    rate_type: 'fixed' as 'hourly' | 'fixed',
    rate_amount: '',
    progress: '0',
    status: 'in_progress' as 'in_progress' | 'completed' | 'paused',
  });

  const load = () => {
    fetchProjects()
      .then((data) => setProjects(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.client_name || !form.rate_amount) return;
    addProject({
      name: form.name,
      start_date: form.start_date,
      end_date: form.end_date,
      client_name: form.client_name,
      rate_type: form.rate_type,
      rate_amount: parseFloat(form.rate_amount),
      progress: parseInt(form.progress, 10) || 0,
      status: form.status,
    }).then(() => {
      setShowModal(false);
      setForm({
        name: '',
        start_date: todayISO(),
        end_date: futureISO(30),
        client_name: '',
        rate_type: 'fixed',
        rate_amount: '',
        progress: '0',
        status: 'in_progress',
      });
      load();
    });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">项目管理</h1>
        <button className="btn" onClick={() => setShowModal(true)}>
          + 新建项目
        </button>
      </div>

      {loading && projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">加载中...</div>
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">还没有项目，点击上方按钮创建第一个项目</div>
          <button className="btn" onClick={() => setShowModal(true)}>
            新建项目
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>新建项目</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>项目名称 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="例如：小程序开发"
                />
              </div>
              <div className="form-group">
                <label>客户名称 *</label>
                <input
                  type="text"
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                  required
                  placeholder="客户公司或姓名"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>开始日期</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>预计结束日期</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>收费类型</label>
                  <select
                    value={form.rate_type}
                    onChange={(e) => setForm({ ...form, rate_type: e.target.value as 'hourly' | 'fixed' })}
                  >
                    <option value="fixed">固定总价</option>
                    <option value="hourly">按小时</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>金额 (¥) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.rate_amount}
                    onChange={(e) => setForm({ ...form, rate_amount: e.target.value })}
                    required
                    placeholder={form.rate_type === 'hourly' ? '每小时费用' : '总费用'}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>进度 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.progress}
                    onChange={(e) => setForm({ ...form, progress: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>状态</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  >
                    <option value="in_progress">进行中</option>
                    <option value="paused">暂停</option>
                    <option value="completed">已完成</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn">
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
