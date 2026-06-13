import { useState, useEffect } from 'react';
import { ApiProxy, Contract } from './ApiProxy';

const btnBase = {
  padding: '8px 16px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'all 0.1s ease',
} as const;

const statusFilters = [
  { key: 'all', label: '全部', color: '#6b7280' },
  { key: 'pending', label: '待签署', color: '#f59e0b' },
  { key: 'active', label: '已生效', color: '#22c55e' },
  { key: 'completed', label: '已完成', color: '#3b82f6' },
] as const;

const statusBar: Record<string, string> = {
  pending: 'linear-gradient(90deg, #fde68a 0%, #f59e0b 100%)',
  active: 'linear-gradient(90deg, #86efac 0%, #22c55e 100%)',
  completed: 'linear-gradient(90deg, #93c5fd 0%, #3b82f6 100%)',
};

const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待签署', color: '#b45309', bg: '#fef3c7' },
  active: { label: '已生效', color: '#16a34a', bg: '#dcfce7' },
  completed: { label: '已完成', color: '#2563eb', bg: '#dbeafe' },
};

export default function ContractModule() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<typeof statusFilters[number]['key']>('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const data = await ApiProxy.getContracts();
      setContracts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (id: string) => {
    if (!confirm('确认签署此合同？签署后不可撤销。')) return;
    try {
      await ApiProxy.signContract(id, 'publisher');
      await ApiProxy.signContract(id, 'contractor');
      fetchContracts();
      alert('合同已签署并生效！');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = (c: Contract) => {
    const text = `
合同编号：${c.contractNo}
签订日期：${c.signedAt ? new Date(c.signedAt).toLocaleDateString('zh-CN') : '未签订'}

甲方（发包方）：${c.publisherName}
乙方（承包方）：${c.contractorName}

一、项目信息
项目名称：${c.projectName}
项目描述：${c.description}

二、合同条款
1. 合同金额：${c.finalPrice}万元人民币
2. 工期：${c.finalDuration}天
3. 本合同自双方签署之日起生效

三、签署
甲方签字：${c.publisherSigned ? '✓ 已签署' : '未签署'}
乙方签字：${c.contractorSigned ? '✓ 已签署' : '未签署'}

合同状态：${statusLabel[c.status].label}
    `.trim();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `合同_${c.contractNo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredContracts = filter === 'all'
    ? contracts
    : contracts.filter((c) => c.status === filter);

  const stats = {
    total: contracts.length,
    pending: contracts.filter((c) => c.status === 'pending').length,
    active: contracts.filter((c) => c.status === 'active').length,
    completed: contracts.filter((c) => c.status === 'completed').length,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: '#1e40af', marginBottom: '4px' }}>合同管理</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>查看、签署和管理所有合同</p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>合同总数</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e40af' }}>{stats.total}</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>待签署</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>{stats.pending}</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>已生效</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#22c55e' }}>{stats.active}</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>已完成</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#3b82f6' }}>{stats.completed}</div>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                ...btnBase,
                backgroundColor: filter === f.key ? '#1e40af' : '#f3f4f6',
                color: filter === f.key ? 'white' : '#4b5563',
                padding: '6px 16px',
                fontSize: '13px',
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {f.label} ({f.key === 'all' ? stats.total : stats[f.key as keyof typeof stats]})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>加载中...</div>
      ) : filteredContracts.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', backgroundColor: 'white', borderRadius: '12px' }}>
          暂无合同数据
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '20px',
        }}>
          {filteredContracts.map((c, idx) => {
            const st = statusLabel[c.status];
            return (
              <div
                key={c.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  animation: `fadeInUp 0.3s ease forwards`,
                  animationDelay: `${idx * 0.05}s`,
                  opacity: 0,
                  transition: 'box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)')}
              >
                <div style={{
                  height: '6px',
                  background: statusBar[c.status] || statusBar.pending,
                }} />
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>合同编号</div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e40af', fontFamily: 'monospace' }}>{c.contractNo}</div>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 500,
                      backgroundColor: st.bg,
                      color: st.color,
                    }}>{st.label}</span>
                  </div>

                  <h3 style={{ fontSize: '16px', color: '#1f2937', fontWeight: 600, marginBottom: '12px' }}>
                    {c.projectName}
                  </h3>

                  <div style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>合同金额</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e40af' }}>{c.finalPrice}<span style={{ fontSize: '12px', fontWeight: 400 }}>万元</span></div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>工期</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#374151' }}>{c.finalDuration}<span style={{ fontSize: '12px', fontWeight: 400 }}>天</span></div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af', width: '60px' }}>发包方</span>
                      <span style={{ fontSize: '13px', color: '#374151' }}>{c.publisherName}</span>
                      {c.publisherSigned && <span style={{ fontSize: '11px', color: '#22c55e' }}>✓已签</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af', width: '60px' }}>承包方</span>
                      <span style={{ fontSize: '13px', color: '#374151' }}>{c.contractorName}</span>
                      {c.contractorSigned && <span style={{ fontSize: '11px', color: '#22c55e' }}>✓已签</span>}
                    </div>
                    {c.signedAt && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#9ca3af', width: '60px' }}>签订日</span>
                        <span style={{ fontSize: '13px', color: '#374151' }}>{new Date(c.signedAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    paddingTop: '16px',
                    borderTop: '1px solid #f3f4f6',
                  }}>
                    <button
                      onClick={() => setSelectedContract(c)}
                      style={{
                        ...btnBase,
                        backgroundColor: '#eff6ff',
                        color: '#1e40af',
                        flex: 1,
                        padding: '8px',
                        fontSize: '12px',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                      onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      📄 查看详情
                    </button>
                    {c.status === 'pending' && (
                      <button
                        onClick={() => handleSign(c.id)}
                        style={{
                          ...btnBase,
                          backgroundColor: '#1e40af',
                          color: 'white',
                          flex: 1,
                          padding: '8px',
                          fontSize: '12px',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                        onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        ✍️ 确认签署
                      </button>
                    )}
                    {(c.status === 'active' || c.status === 'completed') && (
                      <button
                        onClick={() => handleDownload(c)}
                        style={{
                          ...btnBase,
                          backgroundColor: '#22c55e',
                          color: 'white',
                          flex: 1,
                          padding: '8px',
                          fontSize: '12px',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                        onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        ⬇️ 下载
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedContract && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setSelectedContract(null)}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '32px',
            width: '600px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              height: '8px',
              background: statusBar[selectedContract.status] || statusBar.pending,
              margin: '-32px -32px 24px -32px',
              borderRadius: '12px 12px 0 0',
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>合同详情</div>
                <h2 style={{ fontSize: '22px', color: '#1e40af', fontFamily: 'monospace' }}>{selectedContract.contractNo}</h2>
              </div>
              <span style={{
                padding: '6px 14px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: statusLabel[selectedContract.status].bg,
                color: statusLabel[selectedContract.status].color,
              }}>{statusLabel[selectedContract.status].label}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <h3 style={{ fontSize: '16px', color: '#1e40af', marginBottom: '12px' }}>{selectedContract.projectName}</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.7 }}>{selectedContract.description}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>合同金额</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e40af' }}>{selectedContract.finalPrice} 万元</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#dcfce7', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>合同工期</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}>{selectedContract.finalDuration} 天</div>
                </div>
              </div>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>双方信息</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>发包方（甲方）</div>
                    <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>{selectedContract.publisherName}</div>
                    <div style={{ fontSize: '11px', color: selectedContract.publisherSigned ? '#22c55e' : '#f59e0b', marginTop: '4px' }}>
                      {selectedContract.publisherSigned ? '✓ 已签署' : '○ 待签署'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>承包方（乙方）</div>
                    <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>{selectedContract.contractorName}</div>
                    <div style={{ fontSize: '11px', color: selectedContract.contractorSigned ? '#22c55e' : '#f59e0b', marginTop: '4px' }}>
                      {selectedContract.contractorSigned ? '✓ 已签署' : '○ 待签署'}
                    </div>
                  </div>
                </div>
              </div>

              {selectedContract.signedAt && (
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#16a34a' }}>
                    📅 合同签订日期：{new Date(selectedContract.signedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setSelectedContract(null)}
                style={{ ...btnBase, backgroundColor: '#f3f4f6', color: '#4b5563' }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >关闭</button>
              {(selectedContract.status === 'active' || selectedContract.status === 'completed') && (
                <button
                  onClick={() => handleDownload(selectedContract)}
                  style={{ ...btnBase, backgroundColor: '#22c55e', color: 'white' }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >⬇️ 下载合同</button>
              )}
              {selectedContract.status === 'pending' && (
                <button
                  onClick={() => { handleSign(selectedContract.id); setSelectedContract(null); }}
                  style={{ ...btnBase, backgroundColor: '#1e40af', color: 'white' }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >✍️ 确认签署</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
