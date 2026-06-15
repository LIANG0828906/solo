import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

interface ProjectDetailProps {
  user: any;
  ws: WebSocket | null;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ user, ws }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [remark, setRemark] = useState('');
  const [registerStatus, setRegisterStatus] = useState<string>('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const rippleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${id}`);
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error('获取项目详情失败:', error);
      }
      setLoading(false);
    };
    fetchProject();
  }, [id]);

  const handleRegister = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('btn-ripple');
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);

    if (!showRegisterForm) {
      setShowRegisterForm(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ remark })
      });

      const data = await response.json();

      if (response.ok) {
        setRegisterStatus('报名成功，等待审核');
        setShowRegisterForm(false);
        const updatedResponse = await fetch(`/api/projects/${id}`);
        const updatedData = await updatedResponse.json();
        setProject(updatedData);
      } else {
        setRegisterStatus(data.message || '报名失败');
      }
    } catch (error) {
      setRegisterStatus('网络错误，请重试');
    }
  };

  if (loading) {
    return <div className="loading-more">加载中...</div>;
  }

  if (!project) {
    return <div className="empty-state">项目不存在</div>;
  }

  const isExpired = new Date(project.deadline) < new Date();

  return (
    <div className="page-container">
      <Link to="/projects" className="back-link">← 返回项目列表</Link>
      
      <div className="detail-container">
        <div className="detail-header">
          <span className={`project-type-tag type-${project.type}`}>{project.type}</span>
          <h2>{project.name}</h2>
          <div style={{ display: 'flex', gap: '20px', color: '#666', fontSize: '14px' }}>
            <span>📍 {project.location}</span>
            <span>👥 已报名 {project.registeredCount}/{project.maxVolunteers} 人</span>
          </div>
        </div>

        <div className="detail-info">
          <div className="info-item">
            <span className="info-label">服务日期</span>
            <span className="info-value">{project.serviceDate}</span>
          </div>
          <div className="info-item">
            <span className="info-label">服务时间</span>
            <span className="info-value">{project.startTime} - {project.endTime}</span>
          </div>
          <div className="info-item">
            <span className="info-label">报名截止</span>
            <span className="info-value" style={{ color: isExpired ? '#95a5a6' : '#e74c3c' }}>
              {project.deadline} {isExpired && '(已截止)'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">剩余名额</span>
            <span className="info-value" style={{ color: '#A23B72' }}>
              {project.remainingSlots} 个
            </span>
          </div>
        </div>

        <div className="detail-description">
          <h3 style={{ marginBottom: '12px', color: '#333' }}>项目描述</h3>
          <p>{project.description}</p>
        </div>

        <div className="registration-section">
          <h3>我要报名</h3>
          {isExpired ? (
            <p style={{ color: '#95a5a6' }}>报名已截止</p>
          ) : project.remainingSlots <= 0 ? (
            <p style={{ color: '#e74c3c' }}>名额已满</p>
          ) : (
            <>
              {!showRegisterForm ? (
                <button
                  ref={rippleRef}
                  className="btn"
                  onClick={handleRegister}
                >
                  {user ? '立即报名' : '登录后报名'}
                </button>
              ) : (
                <div>
                  <div className="form-group">
                    <label>报名备注</label>
                    <textarea
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="请填写报名备注（选填）"
                      rows={3}
                    />
                  </div>
                  <button
                    ref={rippleRef}
                    className="btn"
                    onClick={handleRegister}
                  >
                    提交报名
                  </button>
                </div>
              )}
              {registerStatus && (
                <p style={{ marginTop: '12px', color: registerStatus.includes('成功') ? '#27ae60' : '#e74c3c' }}>
                  {registerStatus}
                </p>
              )}
            </>
          )}
        </div>

        <div>
          <h3 style={{ marginBottom: '16px' }}>已报名志愿者 ({project.registeredVolunteers?.length || 0})</h3>
          {project.registeredVolunteers?.length > 0 ? (
            <div className="volunteers-list">
              {project.registeredVolunteers.map((volunteer: any) => (
                <div key={volunteer.id} className="volunteer-item">
                  <div className="volunteer-avatar">
                    {volunteer.nickname?.charAt(0) || 'V'}
                  </div>
                  <span className="volunteer-name">{volunteer.nickname}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#999' }}>暂无报名志愿者</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
