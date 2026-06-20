import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { LoadingSpinner } from '../components/Common';

export const TeacherPage: React.FC<{ onNavigate: (page: string, assignmentId?: string) => void }> = ({ onNavigate }) => {
  const { assignments, fetchAssignments, createAssignment, loading, error, setError } = useAppStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [testCases, setTestCases] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('请输入作业标题');
      return;
    }
    if (title.length > 50) {
      setError('标题不能超过50字符');
      return;
    }
    if (!testCases.trim()) {
      setError('请输入测试用例');
      return;
    }
    setSubmitting(true);
    const result = await createAssignment(title.trim(), description, testCases);
    setSubmitting(false);
    if (result) {
      setTitle('');
      setDescription('');
      setTestCases('');
    }
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleString('zh-CN');

  return (
    <div>
      <h2 className="page-title">创建作业</h2>

      {error && (
        <div className="card" style={{ background: '#ffebee', color: '#c62828', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">作业标题 <span style={{ color: title.length > 50 ? '#f44336' : '#9e9e9e' }}>({title.length}/50)</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="例如：两数之和"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">题目描述（支持Markdown）</label>
            <textarea
              className="form-textarea"
              placeholder="描述题目要求，例如：\n给定一个整数数组 nums 和一个整数目标值 target，\n请你在该数组中找出和为目标值 target 的那两个整数。"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">测试用例（每行一个，格式：输入参数 => 期望输出）</label>
            <textarea
              className="form-textarea"
              placeholder={'例如：\n[2,7,11,15], 9 => [0,1]\n[3,2,4], 6 => [1,2]\n[3,3], 6 => [0,1]'}
              value={testCases}
              onChange={(e) => setTestCases(e.target.value)}
              rows={6}
              style={{ fontFamily: '"Consolas", "Monaco", monospace', fontSize: '13px' }}
            />
            <div style={{ fontSize: '12px', color: '#9e9e9e', marginTop: '4px' }}>
              提示：代码需实现 <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>solution(...args)</code> 函数
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || loading}
            >
              {submitting ? '创建中...' : '✓ 创建作业'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setTitle('');
                setDescription('');
                setTestCases('');
              }}
            >
              清空
            </button>
          </div>
        </form>
      </div>

      <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '32px 0 16px', color: '#455a64' }}>
        作业列表
      </h3>

      {loading ? (
        <LoadingSpinner />
      ) : assignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#9e9e9e', padding: '40px' }}>
          暂无作业，创建第一个作业吧
        </div>
      ) : (
        <div>
          {assignments.map((a) => (
            <div key={a.id} className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('stats', a.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#37474f' }}>{a.title}</h4>
                <span style={{ fontSize: '12px', color: '#9e9e9e' }}>{formatDate(a.createdAt)}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#607d8b', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
                {a.description || '暂无描述'}
              </p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#757575' }}>
                <span>📋 {a.testCases.length} 个测试用例</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
