import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Tool, ToolStatus } from '../types';

const STATUS_COLORS: Record<ToolStatus, { bg: string; text: string }> = {
  '空闲': { bg: '#E8F5E9', text: '#2E7D32' },
  '借用中': { bg: '#FFF8E1', text: '#F57F17' },
  '维修中': { bg: '#FFEBEE', text: '#C62828' },
};

interface BorrowForm {
  toolId: number;
  borrower: string;
  expectedReturnDate: string;
}

export default function ToolManager() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [borrowForm, setBorrowForm] = useState<BorrowForm>({
    toolId: 0,
    borrower: '',
    expectedReturnDate: '',
  });

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const { data } = await axios.get<Tool[]>('/api/tools');
      setTools(data);
    } catch (error) {
      console.error('Failed to fetch tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return tools;
    const query = searchQuery.toLowerCase();
    return tools.filter((t) => t.name.toLowerCase().includes(query));
  }, [tools, searchQuery]);

  const handleBorrow = async () => {
    if (!borrowForm.borrower.trim()) {
      alert('请填写借用人姓名');
      return;
    }
    if (!borrowForm.expectedReturnDate) {
      alert('请选择预计归还时间');
      return;
    }
    try {
      await axios.post(`/api/tools/${borrowForm.toolId}/borrow`, {
        borrower: borrowForm.borrower,
        expectedReturnDate: borrowForm.expectedReturnDate,
      });
      fetchTools();
      setShowBorrowModal(false);
      setBorrowForm({ toolId: 0, borrower: '', expectedReturnDate: '' });
    } catch (error) {
      console.error('Failed to borrow tool:', error);
    }
  };

  const handleReturn = async (toolId: number) => {
    try {
      await axios.post(`/api/tools/${toolId}/return`);
      fetchTools();
    } catch (error) {
      console.error('Failed to return tool:', error);
    }
  };

  const openBorrowModal = (tool: Tool) => {
    setSelectedTool(tool);
    setBorrowForm({
      toolId: tool.id,
      borrower: '',
      expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setShowBorrowModal(true);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px' }}>加载中...</div>;
  }

  const statusCounts = tools.reduce(
    (acc, t) => {
      acc[t.status]++;
      return acc;
    },
    { '空闲': 0, '借用中': 0, '维修中': 0 } as Record<ToolStatus, number>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#333', marginBottom: '24px' }}>
        工具借用管理
      </h2>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {(['空闲', '借用中', '维修中'] as ToolStatus[]).map((status) => (
          <div
            key={status}
            style={{
              padding: '12px 20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: STATUS_COLORS[status].text,
              }}
            />
            <span style={{ color: '#666', fontSize: '14px' }}>{status}</span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: STATUS_COLORS[status].text }}>
              {statusCounts[status]}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 搜索工具名称..."
          style={{
            width: '100%',
            maxWidth: '320px',
            padding: '10px 16px',
            border: '1px solid #E0E0E0',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.2s ease-out',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#D4A574';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#E0E0E0';
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 16px rgba(139,94,60,0.12)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>{tool.name}</h3>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  backgroundColor: STATUS_COLORS[tool.status].bg,
                  color: STATUS_COLORS[tool.status].text,
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                {tool.status}
              </span>
            </div>

            {tool.status === '借用中' && (
              <div style={{ marginBottom: '12px', fontSize: '13px', color: '#666' }}>
                <div style={{ marginBottom: '4px' }}>借用人：{tool.currentBorrower}</div>
                <div>借出日期：{tool.borrowDate?.split('T')[0]}</div>
                <div>预计归还：{tool.expectedReturnDate?.split('T')[0]}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              {tool.status === '空闲' && (
                <button
                  onClick={() => openBorrowModal(tool)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#8B5E3C',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#A06A42';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#8B5E3C';
                  }}
                >
                  借用
                </button>
              )}
              {tool.status === '借用中' && (
                <button
                  onClick={() => handleReturn(tool.id)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#5CB85C',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#4CAF50';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#5CB85C';
                  }}
                >
                  归还
                </button>
              )}
              {tool.status === '维修中' && (
                <button
                  disabled
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#E0E0E0',
                    color: '#999',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'not-allowed',
                  }}
                >
                  维修中
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredTools.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '48px',
              textAlign: 'center',
              color: '#999',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            {searchQuery ? '未找到匹配的工具' : '暂无工具数据'}
          </div>
        )}
      </div>

      {showBorrowModal && selectedTool && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '360px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
              借用工具
            </h3>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              {selectedTool.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  借用人姓名
                </label>
                <input
                  type="text"
                  value={borrowForm.borrower}
                  onChange={(e) => setBorrowForm({ ...borrowForm, borrower: e.target.value })}
                  placeholder="请输入借用人姓名"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  预计归还日期
                </label>
                <input
                  type="date"
                  value={borrowForm.expectedReturnDate}
                  onChange={(e) => setBorrowForm({ ...borrowForm, expectedReturnDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowBorrowModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#F5F5F5',
                  color: '#666',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'all 0.2s ease-out',
                }}
              >
                取消
              </button>
              <button
                onClick={handleBorrow}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#8B5E3C',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#A06A42';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#8B5E3C';
                }}
              >
                确认借用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
