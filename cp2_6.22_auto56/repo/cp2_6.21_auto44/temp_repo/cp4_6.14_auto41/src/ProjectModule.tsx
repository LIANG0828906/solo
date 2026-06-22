import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiProxy, Project } from './ApiProxy';

const btnBase = {
  padding: '8px 16px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'all 0.1s ease',
} as const;

const statusConfig = {
  active: { label: '进行中', color: '#22c55e', bg: '#dcfce7' },
  expired: { label: '已截止', color: '#f59e0b', bg: '#fef3c7' },
  closed: { label: '已关闭', color: '#9ca3af', bg: '#f3f4f6' },
};

export default function ProjectModule() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    budgetMin: 0,
    budgetMax: 0,
    description: '',
    deadline: '',
    publisher: '张经理',
  });
  const navigate = useNavigate();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await ApiProxy.getProjects();
      const now = new Date();
      const updated = data.map((p) => {
        if (p.status === 'active' && new Date(p.deadline) < now) {
          return { ...p, status: 'expired' as const };
        }
        return p;
      });
      setProjects(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSubmit = async () => {
    if (!formData.name || formData.budgetMin <= 0 || formData.budgetMax < formData.budgetMin || !formData.deadline) {
      alert('请填写完整的项目信息');
      return;
    }
    try {
      if (editingProject) {
        await ApiProxy.updateProject(editingProject.id, formData);
      } else {
        await ApiProxy.createProject(formData);
      }
      setShowModal(false);
      setEditingProject(null);
      setFormData({ name: '', budgetMin: 0, budgetMax: 0, description: '', deadline: '', publisher: '张经理' });
      fetchProjects();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (p: Project) => {
    setEditingProject(p);
    setFormData({
      name: p.name,
      budgetMin: p.budgetMin,
      budgetMax: p.budgetMax,
      description: p.description,
      deadline: p.deadline.slice(0, 10),
      publisher: p.publisher,
    });
    setShowModal(true);
  };

  const handleClose = async (id: string) => {
    if (confirm('确定要关闭此项目吗？')) {
      await ApiProxy.closeProject(id);
      fetchProjects();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: '#1e40af', marginBottom: '4px' }}>项目管理</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>发布和管理所有发包项目</p>
        </div>
        <button
          onClick={() => { setEditingProject(null); setFormData({ name: '', budgetMin: 0, budgetMax: 0, description: '', deadline: '', publisher: '张经理' }); setShowModal(true); }}
          style={{ ...btnBase, backgroundColor: '#3b82f6', color: 'white' }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          + 发布新项目
        </button>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>项目名称</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>预算范围(万元)</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>截止日期</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>状态</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>加载中...</td></tr>
              )}
              {!loading && projects.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>暂无项目数据</td></tr>
              )}
              {projects.map((p) => {
                const status = statusConfig[p.status];
                const isExpanded = expandedRow === p.id;
                return (
                  <React.Fragment key={p.id}>
                    <tr
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0f2fe')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                      onClick={() => setExpandedRow(isExpanded ? null : p.id)}
                    >
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>
                        <span>{isExpanded ? '▼ ' : '▶ '}</span>{p.name}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#4b5563' }}>{p.budgetMin} - {p.budgetMax}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#4b5563' }}>{new Date(p.deadline).toLocaleDateString('zh-CN')}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: status.bg,
                          color: status.color,
                        }}>{status.label}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => navigate(`/projects/${p.id}`)}
                            style={{ ...btnBase, backgroundColor: '#eff6ff', color: '#1e40af', padding: '4px 12px', fontSize: '12px' }}
                            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                          >查看投标</button>
                          {p.status !== 'closed' && (
                            <>
                              <button
                                onClick={() => handleEdit(p)}
                                style={{ ...btnBase, backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 12px', fontSize: '12px' }}
                                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                              >编辑</button>
                              <button
                                onClick={() => handleClose(p.id)}
                                style={{ ...btnBase, backgroundColor: '#fee2e2', color: '#b91c1c', padding: '4px 12px', fontSize: '12px' }}
                                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                              >关闭</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ backgroundColor: '#fafafa' }}>
                        <td colSpan={5} style={{ padding: '20px' }}>
                          <div style={{
                            padding: '16px',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                          }}>
                            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 600 }}>需求描述：</div>
                            <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7 }}>{p.description || '暂无描述'}</div>
                            <div style={{ marginTop: '12px', display: 'flex', gap: '24px', fontSize: '12px', color: '#9ca3af' }}>
                              <span>发布方：{p.publisher}</span>
                              <span>创建时间：{new Date(p.createdAt).toLocaleString('zh-CN')}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowModal(false)}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '28px',
            width: '560px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', color: '#1e40af', marginBottom: '20px' }}>
              {editingProject ? '编辑项目' : '发布新项目'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: 500 }}>项目名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  placeholder="请输入项目名称"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: 500 }}>最低预算(万元) *</label>
                  <input
                    type="number" min="0"
                    value={formData.budgetMin || ''}
                    onChange={(e) => setFormData({ ...formData, budgetMin: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: 500 }}>最高预算(万元) *</label>
                  <input
                    type="number" min="0"
                    value={formData.budgetMax || ''}
                    onChange={(e) => setFormData({ ...formData, budgetMax: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: 500 }}>投标截止日期 *</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: 500 }}>需求描述</label>
                <textarea
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', resize: 'vertical' }}
                  placeholder="请详细描述项目需求..."
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ ...btnBase, backgroundColor: '#f3f4f6', color: '#4b5563' }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >取消</button>
              <button
                onClick={handleSubmit}
                style={{ ...btnBase, backgroundColor: '#3b82f6', color: 'white' }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >{editingProject ? '保存修改' : '发布项目'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
