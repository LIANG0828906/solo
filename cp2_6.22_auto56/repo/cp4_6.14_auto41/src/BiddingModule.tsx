import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ApiProxy, Project, Bid } from './ApiProxy';

interface Props {
  detailMode?: boolean;
}

const btnBase = {
  padding: '8px 16px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'all 0.1s ease',
} as const;

function getBarColor(index: number, total: number): string {
  const ratio = total <= 1 ? 0 : index / (total - 1);
  const r = Math.round(134 + (252 - 134) * ratio);
  const g = Math.round(239 + (165 - 239) * ratio);
  const b = Math.round(172 + (165 - 172) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

const statusConfig = {
  pending: { label: '待审核', color: '#3b82f6', bg: '#dbeafe' },
  shortlisted: { label: '入围', color: '#f59e0b', bg: '#fef3c7' },
  rejected: { label: '淘汰', color: '#ef4444', bg: '#fee2e2' },
};

export default function BiddingModule({ detailMode = false }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBidModal, setShowBidModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active'>('active');
  const [bidForm, setBidForm] = useState({
    contractorName: '',
    price: 0,
    duration: 0,
    planSummary: '',
    attachmentUrl: '',
  });

  useEffect(() => {
    init();
  }, [id]);

  const init = async () => {
    setLoading(true);
    try {
      const allProjects = await ApiProxy.getProjects();
      const now = new Date();
      const updatedProjects = allProjects.map((p) => {
        if (p.status === 'active' && new Date(p.deadline) < now) {
          return { ...p, status: 'expired' as const };
        }
        return p;
      });
      setProjects(updatedProjects);

      if (id) {
        const proj = updatedProjects.find((p) => p.id === id);
        if (proj) {
          setSelectedProject(proj);
          const bidData = await ApiProxy.getBids(id);
          setBids(bidData);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = async (projectId: string) => {
    navigate(`/bidding/${projectId}`);
  };

  const handleSubmitBid = async () => {
    if (!selectedProject || !bidForm.contractorName || bidForm.price <= 0 || bidForm.duration <= 0) {
      alert('请填写完整的投标信息');
      return;
    }
    try {
      await ApiProxy.createBid({
        projectId: selectedProject.id,
        ...bidForm,
      });
      setShowBidModal(false);
      setBidForm({ contractorName: '', price: 0, duration: 0, planSummary: '', attachmentUrl: '' });
      const bidData = await ApiProxy.getBids(selectedProject.id);
      setBids(bidData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (bidId: string, status: 'shortlisted' | 'rejected') => {
    try {
      await ApiProxy.updateBidStatus(bidId, status);
      const bidData = selectedProject ? await ApiProxy.getBids(selectedProject.id) : [];
      setBids(bidData);
    } catch (e) {
      console.error(e);
    }
  };

  const startNegotiation = (bid: Bid) => {
    navigate('/messages', { state: { bidId: bid.id, contractorName: bid.contractorName } });
  };

  const visibleProjects = filter === 'active'
    ? projects.filter((p) => p.status === 'active')
    : projects;

  const sortedBids = [...bids].sort((a, b) => {
    if (a.status === 'shortlisted' && b.status !== 'shortlisted') return -1;
    if (b.status === 'shortlisted' && a.status !== 'shortlisted') return 1;
    return a.price - b.price;
  });

  const chartData = sortedBids
    .filter((b) => b.status !== 'rejected')
    .map((b, idx, arr) => ({
      name: b.contractorName.slice(0, 4),
      price: b.price,
      duration: b.duration,
      color: getBarColor(idx, arr.length),
      fullName: b.contractorName,
    }));

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>加载中...</div>;
  }

  if (!detailMode && !selectedProject) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', color: '#1e40af', marginBottom: '4px' }}>投标比价</h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>浏览可投标项目并提交报价</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFilter('active')}
              style={{ ...btnBase, backgroundColor: filter === 'active' ? '#3b82f6' : '#e5e7eb', color: filter === 'active' ? 'white' : '#4b5563' }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >进行中项目</button>
            <button
              onClick={() => setFilter('all')}
              style={{ ...btnBase, backgroundColor: filter === 'all' ? '#3b82f6' : '#e5e7eb', color: filter === 'all' ? 'white' : '#4b5563' }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >全部项目</button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {visibleProjects.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: '60px', textAlign: 'center', color: '#9ca3af', backgroundColor: 'white', borderRadius: '12px' }}>
              暂无{filter === 'active' ? '进行中的' : ''}项目
            </div>
          )}
          {visibleProjects.map((p, idx) => (
            <div
              key={p.id}
              onClick={() => handleSelectProject(p.id)}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                animation: `fadeInUp 0.3s ease forwards`,
                animationDelay: `${idx * 0.1}s`,
                opacity: 0,
                border: p.status === 'active' ? '1px solid #e5e7eb' : '1px solid #f3f4f6',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', color: '#1f2937', fontWeight: 600, flex: 1 }}>{p.name}</h3>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 500,
                  backgroundColor: p.status === 'active' ? '#dcfce7' : p.status === 'expired' ? '#fef3c7' : '#f3f4f6',
                  color: p.status === 'active' ? '#22c55e' : p.status === 'expired' ? '#f59e0b' : '#9ca3af',
                  marginLeft: '12px',
                  whiteSpace: 'nowrap',
                }}>{p.status === 'active' ? '进行中' : p.status === 'expired' ? '已截止' : '已关闭'}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: 1.5, minHeight: '40px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {p.description || '暂无描述'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>预算(万元)</div>
                  <div style={{ fontSize: '16px', color: '#1e40af', fontWeight: 700 }}>{p.budgetMin} - {p.budgetMax}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px', textAlign: 'right' }}>截止日期</div>
                  <div style={{ fontSize: '13px', color: '#4b5563', textAlign: 'right' }}>{new Date(p.deadline).toLocaleDateString('zh-CN')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const project = selectedProject || projects[0];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            {!detailMode && (
              <button
                onClick={() => { setSelectedProject(null); navigate('/bidding'); }}
                style={{ ...btnBase, backgroundColor: '#e5e7eb', color: '#4b5563', padding: '4px 12px' }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >← 返回</button>
            )}
            <h1 style={{ fontSize: '24px', color: '#1e40af' }}>{project?.name}</h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px', marginLeft: detailMode ? '0' : '60px' }}>
            预算：{project?.budgetMin} - {project?.budgetMax}万元 | 截止：{project?.deadline ? new Date(project.deadline).toLocaleDateString('zh-CN') : ''}
          </p>
        </div>
        {project && project.status === 'active' && (
          <button
            onClick={() => setShowBidModal(true)}
            style={{ ...btnBase, backgroundColor: '#3b82f6', color: 'white' }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >+ 提交投标</button>
        )}
      </div>

      {project && project.description && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 600, marginBottom: '8px' }}>项目需求：</div>
          <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7 }}>{project.description}</div>
        </div>
      )}

      {chartData.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ fontSize: '16px', color: '#1f2937', fontWeight: 600, marginBottom: '20px' }}>📊 报价对比图</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} label={{ value: '万元', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }} />
                <Tooltip
                  formatter={(value: number) => [`${value}万元`, '报价']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="price" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', color: '#1f2937', fontWeight: 600 }}>投标列表 ({bids.length})</h3>
          <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#6b7280' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#f59e0b' }}></span> 入围
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#3b82f6' }}></span> 待审
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#ef4444' }}></span> 淘汰
            </span>
          </div>
        </div>

        {sortedBids.length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>暂无投标数据</div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px',
        }}>
          {sortedBids.map((bid, idx) => {
            const status = statusConfig[bid.status];
            return (
              <div
                key={bid.id}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: bid.status === 'shortlisted' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                  backgroundColor: bid.status === 'rejected' ? '#fafafa' : 'white',
                  transition: 'all 0.2s ease',
                  animation: `fadeInUp 0.3s ease forwards`,
                  animationDelay: `${idx * 0.1}s`,
                  opacity: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      backgroundColor: '#dbeafe', color: '#1e40af',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', fontWeight: 600,
                    }}>{bid.contractorName[0]}</div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>{bid.contractorName}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                        提交于 {new Date(bid.submittedAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 500,
                    backgroundColor: status.bg,
                    color: status.color,
                  }}>{status.label}</span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>报价(万元)</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#1e40af' }}>{bid.price}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>工期(天)</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#374151' }}>{bid.duration}</div>
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6, marginBottom: '12px', minHeight: '40px' }}>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>方案：</span>
                  {bid.planSummary || '暂无方案描述'}
                </div>

                {bid.attachmentUrl && (
                  <div style={{ marginBottom: '16px' }}>
                    <a href={bid.attachmentUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>
                      📎 查看附件
                    </a>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
                  {bid.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(bid.id, 'shortlisted')}
                        style={{ ...btnBase, backgroundColor: '#fef3c7', color: '#b45309', padding: '6px 12px', fontSize: '12px', flex: 1 }}
                        onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                        onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >⭐ 标记入围</button>
                      <button
                        onClick={() => handleStatusChange(bid.id, 'rejected')}
                        style={{ ...btnBase, backgroundColor: '#fee2e2', color: '#b91c1c', padding: '6px 12px', fontSize: '12px', flex: 1 }}
                        onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                        onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >✕ 淘汰</button>
                    </>
                  )}
                  {bid.status === 'shortlisted' && (
                    <>
                      <button
                        onClick={() => startNegotiation(bid)}
                        style={{ ...btnBase, backgroundColor: '#3b82f6', color: 'white', padding: '6px 12px', fontSize: '12px', flex: 1 }}
                        onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                        onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >💬 发起洽谈</button>
                      <button
                        onClick={() => handleStatusChange(bid.id, 'rejected')}
                        style={{ ...btnBase, backgroundColor: '#fee2e2', color: '#b91c1c', padding: '6px 12px', fontSize: '12px' }}
                        onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                        onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >✕</button>
                    </>
                  )}
                  {bid.status === 'rejected' && (
                    <button
                      onClick={() => handleStatusChange(bid.id, 'shortlisted')}
                      style={{ ...btnBase, backgroundColor: '#e5e7eb', color: '#4b5563', padding: '6px 12px', fontSize: '12px', flex: 1 }}
                      onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                      onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >↻ 恢复入围</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showBidModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowBidModal(false)}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '28px',
            width: '520px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', color: '#1e40af', marginBottom: '20px' }}>提交投标</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: 500 }}>承包方名称 *</label>
                <input type="text" value={bidForm.contractorName}
                  onChange={(e) => setBidForm({ ...bidForm, contractorName: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  placeholder="如：XX工程有限公司" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: 500 }}>报价(万元) *</label>
                  <input type="number" min="0" value={bidForm.price || ''}
                    onChange={(e) => setBidForm({ ...bidForm, price: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: 500 }}>工期(天) *</label>
                  <input type="number" min="0" value={bidForm.duration || ''}
                    onChange={(e) => setBidForm({ ...bidForm, duration: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: 500 }}>方案简述</label>
                <textarea rows={4} value={bidForm.planSummary}
                  onChange={(e) => setBidForm({ ...bidForm, planSummary: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', resize: 'vertical' }}
                  placeholder="简要介绍实施方案、技术优势等..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: 500 }}>附件链接</label>
                <input type="text" value={bidForm.attachmentUrl}
                  onChange={(e) => setBidForm({ ...bidForm, attachmentUrl: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  placeholder="https://..." />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowBidModal(false)}
                style={{ ...btnBase, backgroundColor: '#f3f4f6', color: '#4b5563' }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}>取消</button>
              <button onClick={handleSubmitBid}
                style={{ ...btnBase, backgroundColor: '#3b82f6', color: 'white' }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}>提交投标</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
