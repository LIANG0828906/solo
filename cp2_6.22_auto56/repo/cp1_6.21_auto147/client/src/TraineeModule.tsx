import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useApp } from './context/AppContext';
import axios from 'axios';
import type { Trainee } from './types';
import Modal from './components/Modal';

const DEPARTMENTS = ['技术部', '市场部', '人资部', '财务部', '运营部', '产品部'];

export default function TraineeModule() {
  const { trainees, loading, refreshTrainees } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(400);
  const rowHeight = 64;
  const visibleCount = 30;
  const bufferCount = 5;

  const filteredTrainees = useMemo(() => {
    let result = trainees;

    if (selectedDept !== 'all') {
      result = result.filter(t => t.department === selectedDept);
    }

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(
        t =>
          t.email.toLowerCase().includes(keyword) ||
          t.name.toLowerCase().includes(keyword) ||
          t.department.toLowerCase().includes(keyword)
      );
    }

    return result;
  }, [trainees, selectedDept, searchKeyword]);

  const totalHeight = filteredTrainees.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - bufferCount);
  const endIndex = Math.min(
    filteredTrainees.length,
    startIndex + visibleCount + bufferCount * 2
  );
  const visibleTrainees = filteredTrainees.slice(startIndex, endIndex);
  const offsetY = startIndex * rowHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    if (tableRef.current) {
      setViewportHeight(tableRef.current.clientHeight);
    }
  }, [showAddModal]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除该学员吗？')) return;

    setDeletingId(id);
    try {
      await axios.delete(`/api/trainee/${id}`);
      await refreshTrainees();
    } catch (error) {
      console.error('Failed to delete trainee:', error);
      alert('删除失败，请重试');
    } finally {
      setDeletingId(null);
    }
  };

  const handleResend = async (id: string) => {
    setResendingId(id);
    try {
      const response = await axios.post(`/api/trainee/${id}/resend`);
      alert(`链接已复制: ${response.data.link}`);
    } catch (error) {
      console.error('Failed to resend:', error);
      alert('操作失败，请重试');
    } finally {
      setResendingId(null);
    }
  };

  const highlightText = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;

    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="highlight">{part}</span>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'submitted':
        return { label: '已提交', color: '#22C55E', bg: '#DCFCE7' };
      case 'viewed':
        return { label: '已查看', color: '#F59E0B', bg: '#FEF3C7' };
      default:
        return { label: '未查看', color: '#94A3B8', bg: '#F1F5F9' };
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div style={toolbarStyle}>
        <div style={toolbarLeftStyle}>
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            style={selectStyle}
          >
            <option value="all">全部部门</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <div style={searchStyle}>
            <input
              type="text"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              placeholder="搜索学员姓名或邮箱..."
              style={searchInputStyle}
            />
          </div>
        </div>

        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + 添加学员
        </button>
      </div>

      <div style={tableContainerStyle}>
        <div style={tableHeaderStyle}>
          <div style={{ ...tableCellStyle, flex: 2 }}>姓名 / 邮箱</div>
          <div style={{ ...tableCellStyle, flex: 1 }}>部门</div>
          <div style={{ ...tableCellStyle, flex: 1 }}>状态</div>
          <div style={{ ...tableCellStyle, flex: 1 }}>提交时间</div>
          <div style={{ ...tableCellStyle, flex: 1, textAlign: 'right' }}>操作</div>
        </div>

        <div
          ref={tableRef}
          style={tableBodyStyle}
          onScroll={handleScroll}
        >
          {filteredTrainees.length === 0 ? (
            <div style={emptyTableStyle}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>👤</p>
              <p style={{ color: '#94A3B8' }}>暂无学员数据</p>
            </div>
          ) : (
            <div style={{ height: totalHeight, position: 'relative' }}>
              <div style={{ transform: `translateY(${offsetY}px)` }}>
                {visibleTrainees.map((trainee, index) => {
                  const statusInfo = getStatusInfo(trainee.status);
                  const rowIndex = startIndex + index;
                  const isEven = rowIndex % 2 === 0;

                  return (
                    <div
                      key={trainee.id}
                      style={{
                        ...tableRowStyle,
                        backgroundColor: isEven ? '#FFFFFF' : '#FAFAFA',
                        height: rowHeight
                      }}
                    >
                      <div style={tableCellColumnStyle}>
                        <div style={traineeNameStyle}>
                          {highlightText(trainee.name, searchKeyword)}
                        </div>
                        <div style={traineeEmailStyle}>
                          {highlightText(trainee.email, searchKeyword)}
                        </div>
                      </div>
                      <div style={{ ...tableCellStyle, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {highlightText(trainee.department, searchKeyword)}
                      </div>
                      <div style={{ ...tableCellStyle, flex: 1 }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 500,
                            backgroundColor: statusInfo.bg,
                            color: statusInfo.color,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      <div style={{ ...tableCellStyle, flex: 1, color: '#64748B', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {formatDate(trainee.submittedAt)}
                      </div>
                      <div style={{ ...tableCellStyle, flex: 1, justifyContent: 'flex-end', gap: '4px' }}>
                        <button
                          className="btn-icon"
                          onClick={() => handleResend(trainee.id)}
                          title="重发链接"
                          disabled={resendingId === trainee.id}
                        >
                          {resendingId === trainee.id ? '⏳' : '📧'}
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDelete(trainee.id)}
                          title="删除"
                          style={{ color: deletingId === trainee.id ? '#DC2626' : undefined }}
                          disabled={deletingId === trainee.id}
                        >
                          {deletingId === trainee.id ? '⏳' : '🗑️'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={countStyle}>
        共 {filteredTrainees.length} 名学员
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="批量添加学员"
        width={500}
      >
        <AddTraineeForm
          onCancel={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            refreshTrainees();
          }}
        />
      </Modal>
    </div>
  );
}

function AddTraineeForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const [department, setDepartment] = useState('技术部');
  const [emailsText, setEmailsText] = useState('');
  const [importType, setImportType] = useState<'manual' | 'csv'>('manual');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emailCount = emailsText.trim()
    ? emailsText.trim().split('\n').filter(l => l.trim()).length
    : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const emails = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes('@'))
        .map(line => line.split(',')[0].trim());
      setEmailsText(emails.join('\n'));
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emails = emailsText
      .trim()
      .split('\n')
      .map(l => l.trim())
      .filter(l => l);

    if (emails.length === 0) {
      setError('请输入至少一个邮箱地址');
      return;
    }

    if (emails.length > 50) {
      setError('最多只能导入50个邮箱');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/trainee', { emails, department });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || '添加失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      {error && <div style={errorStyle}>{error}</div>}

      <div style={fieldStyle}>
        <label style={labelStyle}>选择部门</label>
        <select
          value={department}
          onChange={e => setDepartment(e.target.value)}
          style={{ width: '100%' }}
        >
          {DEPARTMENTS.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>导入方式</label>
        <div style={toggleStyle}>
          <button
            type="button"
            onClick={() => setImportType('manual')}
            style={{
              ...toggleBtnStyle,
              backgroundColor: importType === 'manual' ? '#3B82F6' : '#F1F5F9',
              color: importType === 'manual' ? 'white' : '#64748B'
            }}
          >
            手动输入
          </button>
          <button
            type="button"
            onClick={() => setImportType('csv')}
            style={{
              ...toggleBtnStyle,
              backgroundColor: importType === 'csv' ? '#3B82F6' : '#F1F5F9',
              color: importType === 'csv' ? 'white' : '#64748B'
            }}
          >
            CSV上传
          </button>
        </div>
      </div>

      {importType === 'manual' ? (
        <div style={fieldStyle}>
          <label style={labelStyle}>
            邮箱列表 <span style={countLabelStyle}>({emailCount}/50)</span>
          </label>
          <textarea
            value={emailsText}
            onChange={e => setEmailsText(e.target.value)}
            placeholder="每行一个邮箱地址，例如：&#10;zhangsan@company.com&#10;lisi@company.com"
            rows={10}
            style={{ width: '100%', resize: 'vertical' }}
          />
          <span style={hintStyle}>每行一个邮箱，最多50个</span>
        </div>
      ) : (
        <div style={fieldStyle}>
          <label style={labelStyle}>上传CSV文件</label>
          <div
            style={uploadAreaStyle}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <span style={{ fontSize: '32px', marginBottom: '8px' }}>📁</span>
            <p style={{ color: '#64748B', fontSize: '14px' }}>
              点击上传CSV文件
            </p>
            <p style={{ color: '#94A3B8', fontSize: '12px', marginTop: '4px' }}>
              每行一个邮箱或从CSV第一列读取
            </p>
          </div>
          {emailCount > 0 && (
            <p style={{ marginTop: '8px', fontSize: '13px', color: '#22C55E' }}>
              ✓ 已读取 {emailCount} 个邮箱
            </p>
          )}
        </div>
      )}

      <div style={footerStyle}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          取消
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? '添加中...' : '添加学员'}
        </button>
      </div>
    </form>
  );
}

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  gap: '16px',
  flexWrap: 'wrap'
};

const toolbarLeftStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap'
};

const selectStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #E2E8F0',
  backgroundColor: '#FFFFFF',
  fontSize: '14px',
  cursor: 'pointer',
  minWidth: '140px'
};

const searchStyle: React.CSSProperties = {
  position: 'relative'
};

const searchInputStyle: React.CSSProperties = {
  padding: '10px 12px 10px 36px',
  borderRadius: '8px',
  border: '1px solid #E2E8F0',
  fontSize: '14px',
  width: '280px'
};

const tableContainerStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  border: '1px solid #E2E8F0',
  overflow: 'hidden'
};

const tableHeaderStyle: React.CSSProperties = {
  display: 'flex',
  backgroundColor: '#F1F5F9',
  padding: '12px 16px',
  fontWeight: 600,
  fontSize: '13px',
  color: '#475569'
};

const tableCellStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '0 8px',
  minWidth: 0,
  flex: 1
};

const tableCellColumnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '0 8px',
  minWidth: 0,
  flex: 2,
  gap: '2px'
};

const tableBodyStyle: React.CSSProperties = {
  maxHeight: '500px',
  overflow: 'auto'
};

const tableRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '0 16px',
  borderBottom: '1px solid #F1F5F9',
  transition: 'background-color 0.15s ease'
};

const traineeNameStyle: React.CSSProperties = {
  fontWeight: 500,
  color: '#334155',
  fontSize: '14px'
};

const traineeEmailStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#94A3B8',
  marginTop: '2px'
};

const emptyTableStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 20px'
};

const countStyle: React.CSSProperties = {
  marginTop: '12px',
  fontSize: '13px',
  color: '#64748B',
  textAlign: 'right'
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 500,
  color: '#334155'
};

const countLabelStyle: React.CSSProperties = {
  color: '#64748B',
  fontWeight: 'normal',
  fontSize: '13px'
};

const hintStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#94A3B8'
};

const errorStyle: React.CSSProperties = {
  backgroundColor: '#FEE2E2',
  color: '#DC2626',
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '13px'
};

const toggleStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px'
};

const toggleBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 16px',
  borderRadius: '8px',
  border: 'none',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};

const uploadAreaStyle: React.CSSProperties = {
  border: '2px dashed #E2E8F0',
  borderRadius: '10px',
  padding: '32px 20px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: '#FAFAFA'
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  paddingTop: '8px'
};
