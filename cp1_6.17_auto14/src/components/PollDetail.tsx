import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Spin,
  Tag,
  Modal,
  Input,
  Select,
  Space,
  Tooltip,
  Popconfirm,
  Result,
  Alert,
  Divider,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  StopOutlined,
  CopyOutlined,
  PlusOutlined,
  BarChartOutlined,
  TeamOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { usePollStore } from '../pollStore';
import ChartPanel from './ChartPanel';
import type { Poll, Question, QuestionStat, ResultData } from '../types';

function computeStats(poll: Poll): QuestionStat[] {
  return poll.questions.map((q) => {
    const stat: QuestionStat = {
      questionId: q.id,
      type: q.type,
      title: q.title,
      total: 0,
      data: [],
    };
    const answers = poll.submissions
      .map((s) => s.answers[q.id])
      .filter((a) => a !== undefined && a !== null);

    if (q.type === 'single') {
      const counts: Record<string, number> = {};
      (q.options || []).forEach((o) => (counts[o] = 0));
      answers.forEach((a) => {
        if (typeof a === 'string' && counts[a] !== undefined) counts[a]++;
      });
      stat.data = Object.entries(counts).map(([label, value]) => ({ label, value }));
      stat.total = answers.length;
    } else if (q.type === 'multiple') {
      const counts: Record<string, number> = {};
      (q.options || []).forEach((o) => (counts[o] = 0));
      answers.forEach((arr) => {
        if (Array.isArray(arr)) {
          arr.forEach((o) => {
            if (counts[o] !== undefined) counts[o]++;
          });
        }
      });
      stat.data = Object.entries(counts).map(([label, value]) => ({ label, value }));
      stat.total = answers.length;
    } else if (q.type === 'rating') {
      const numeric = answers
        .map((n) => Number(n))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 10);
      const buckets = Array.from({ length: 10 }, (_, i) => ({
        label: `${i + 1}分`,
        rating: i + 1,
        value: 0,
      }));
      numeric.forEach((n) => {
        buckets[n - 1].value++;
      });
      stat.data = buckets;
      stat.total = numeric.length;
      stat.average = numeric.length > 0 ? numeric.reduce((a, b) => a + b, 0) / numeric.length : 0;
      const sorted = poll.submissions
        .slice()
        .sort((a, b) => a.timestamp - b.timestamp);
      let sum = 0;
      let count = 0;
      const trend: { index: number; average: number }[] = [];
      sorted.forEach((s) => {
        const v = Number(s.answers[q.id]);
        if (!isNaN(v) && v >= 1 && v <= 10) {
          sum += v;
          count++;
          trend.push({ index: count, average: Number((sum / count).toFixed(2)) });
        }
      });
      stat.trend = trend;
    }
    return stat;
  });
}

function QuestionTypeBadge({ type }: { type: string }) {
  const map: Record<string, { text: string; color: string }> = {
    single: { text: '单选', color: 'blue' },
    multiple: { text: '多选', color: 'green' },
    rating: { text: '评分', color: 'purple' },
  };
  const info = map[type] || { text: type, color: 'default' };
  return <Tag color={info.color}>{info.text}</Tag>;
}

function formatTime(timestamp?: number | null) {
  if (!timestamp) return '—';
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function PollDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const currentPoll = usePollStore((s) => s.currentPoll);
  const lastUpdateTime = usePollStore((s) => s.lastUpdateTime);
  const highlightQuestionId = usePollStore((s) => s.highlightQuestionId);
  const clearHighlight = usePollStore((s) => s.clearHighlight);
  const fetchPollDetail = usePollStore((s) => s.fetchPollDetail);
  const closePoll = usePollStore((s) => s.closePoll);
  const addQuestion = usePollStore((s) => s.addQuestion);
  const exportCSV = usePollStore((s) => s.exportCSV);
  const wsConnected = usePollStore((s) => s.wsConnected);

  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [selectedQIdx, setSelectedQIdx] = useState(0);
  const [closing, setClosing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQType, setNewQType] = useState<'single' | 'multiple' | 'rating'>('single');
  const [newQTitle, setNewQTitle] = useState('');
  const [newQOptions, setNewQOptions] = useState<string[]>(['选项1', '选项2']);
  const [adding, setAdding] = useState(false);
  const [copyMsg, setCopyMsg] = useState(false);
  const [initialRenderKey, setInitialRenderKey] = useState(0);

  const poll = currentPoll && currentPoll.id === id ? currentPoll : null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadErr(null);
    fetchPollDetail(id)
      .then(() => !cancelled && setInitialRenderKey((k) => k + 1))
      .catch(() => !cancelled && setLoadErr('加载失败，请检查网络或投票是否存在'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, fetchPollDetail]);

  useEffect(() => {
    if (highlightQuestionId && poll) {
      const idx = poll.questions.findIndex((q) => q.id === highlightQuestionId);
      if (idx !== -1) {
        setSelectedQIdx(idx);
        const timer = setTimeout(clearHighlight, 3200);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightQuestionId, poll, clearHighlight]);

  const statsMap = useMemo<Record<string, QuestionStat>>(() => {
    if (!poll) return {};
    const arr = computeStats(poll);
    const map: Record<string, QuestionStat> = {};
    arr.forEach((s) => (map[s.questionId] = s));
    return map;
  }, [poll]);

  const sortedQuestions = useMemo<Question[]>(() => {
    if (!poll) return [];
    return poll.questions.slice().sort((a, b) => a.order - b.order);
  }, [poll]);

  useEffect(() => {
    if (selectedQIdx >= sortedQuestions.length) {
      setSelectedQIdx(Math.max(0, sortedQuestions.length - 1));
    }
  }, [sortedQuestions.length, selectedQIdx]);

  const selectedQ = sortedQuestions[selectedQIdx] || null;
  const selectedStat = selectedQ ? statsMap[selectedQ.id] || null : null;

  const handleClose = async () => {
    if (!poll) return;
    setClosing(true);
    try {
      await closePoll(poll.id);
      message.success('已关闭投票');
    } catch (e) {
      message.error('关闭失败');
    } finally {
      setClosing(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!poll) return;
    if (!newQTitle.trim()) {
      message.warning('请输入题目标题');
      return;
    }
    if (newQType !== 'rating') {
      const valid = newQOptions.filter((o) => o.trim());
      if (valid.length < 2) {
        message.warning('至少需要两个有效选项');
        return;
      }
    }
    setAdding(true);
    try {
      await addQuestion(poll.id, {
        type: newQType,
        title: newQTitle.trim(),
        options: newQType === 'rating' ? undefined : newQOptions.filter((o) => o.trim()),
        order: poll.questions.length,
      });
      message.success('题目已添加，参与者进入投票页会看到新题目');
      setShowAddModal(false);
      setNewQTitle('');
      setNewQType('single');
      setNewQOptions(['选项1', '选项2']);
    } catch (e) {
      message.error('添加失败');
    } finally {
      setAdding(false);
    }
  };

  const copyVoteLink = useCallback(async () => {
    if (!poll) return;
    const link = `${window.location.origin}/vote/${poll.shortCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopyMsg(true);
      setTimeout(() => setCopyMsg(false), 2000);
      message.success('投票链接已复制');
    } catch {
      message.warning('复制失败，请手动复制');
    }
  }, [poll]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (loadErr || !poll) {
    return (
      <div className="qv-card" style={{ padding: 48, textAlign: 'center' }}>
        <Result
          status="warning"
          title={loadErr || '投票不存在'}
          extra={
            <Button type="primary" onClick={() => navigate('/')}>
              返回仪表盘
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="anim-fade">
      <div style={{ marginBottom: 20 }}>
        <Space size="small" style={{ marginBottom: 16 }} wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={{ borderRadius: 20 }} type="text">
            返回仪表盘
          </Button>
        </Space>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 24 }}>{poll.title}</h2>
              <Tag
                color={poll.isActive ? 'green' : 'default'}
                style={{ margin: 0, borderRadius: 4, fontWeight: 500 }}
              >
                {poll.isActive ? '进行中' : '已结束'}
              </Tag>
            </div>
            {poll.description && (
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 12 }}>
                {poll.description}
              </div>
            )}
            <Space size="large" wrap style={{ marginTop: 8 }}>
              <span
                className="qv-shortcode-badge"
                onClick={copyVoteLink}
                style={{ cursor: 'pointer' }}
                title="点击复制投票链接"
              >
                {poll.shortCode}
                {copyMsg ? (
                  <span className="qv-shortcode-hint">✓ 已复制</span>
                ) : (
                  <CopyOutlined className="qv-shortcode-hint" />
                )}
              </span>
              <Space size="middle" style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <span>
                  <TeamOutlined style={{ color: 'var(--color-primary)', marginRight: 4 }} />
                  参与 <b style={{ color: 'var(--color-text-primary)' }}>{poll.submissions.length}</b>
                </span>
                <span>
                  <FileTextOutlined style={{ color: 'var(--color-accent)', marginRight: 4 }} />
                  题目 <b style={{ color: 'var(--color-text-primary)' }}>{poll.questions.length}</b>
                </span>
                <span>
                  <BarChartOutlined style={{ color: 'var(--color-warning)', marginRight: 4 }} />
                  创建于 {formatTime(poll.createdAt)}
                </span>
                <span>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: wsConnected ? '#4CAF50' : '#BDBDBD',
                      marginRight: 4,
                      verticalAlign: 'middle',
                    }}
                  />
                  {wsConnected ? '实时同步' : '连接断开'}
                </span>
              </Space>
            </Space>
          </div>
          <Space size="small" wrap>
            <Tooltip title="下载CSV格式的全部答卷">
              <button
                className="qv-export-btn"
                onClick={() => exportCSV(poll.id)}
              >
                <DownloadOutlined />
                导出CSV
              </button>
            </Tooltip>
            {poll.isActive && (
              <>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setShowAddModal(true)}
                  style={{ borderRadius: 20 }}
                >
                  添加题目
                </Button>
                <Popconfirm
                  title="确定关闭此投票？"
                  description="关闭后参与者将无法继续提交，结果保留30天"
                  onConfirm={handleClose}
                  okText="确认关闭"
                  cancelText="取消"
                >
                  <Button
                    danger
                    icon={<StopOutlined />}
                    loading={closing}
                    style={{ borderRadius: 20 }}
                  >
                    关闭投票
                  </Button>
                </Popconfirm>
              </>
            )}
          </Space>
        </div>
      </div>

      {!poll.isActive && (
        <Alert
          type="info"
          showIcon
          message="投票已结束"
          description="参与者无法再提交新答卷，统计结果保留30天后自动删除"
          style={{ marginBottom: 20, borderRadius: 8 }}
          closable
        />
      )}

      <div className="qv-detail-layout">
        <div className="qv-card anim-fade" style={{ padding: 8, position: 'sticky', top: 80 }}>
          <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-divider)', marginBottom: 4 }}>
            <FileTextOutlined style={{ marginRight: 6 }} />
            题目列表
          </div>
          <div style={{ padding: 8, maxHeight: '70vh', overflowY: 'auto' }}>
            {sortedQuestions.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-hint)', fontSize: 12 }}>
                暂无题目
                {poll.isActive && (
                  <div style={{ marginTop: 8 }}>
                    <Button size="small" icon={<PlusOutlined />} onClick={() => setShowAddModal(true)}>
                      添加
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              sortedQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className={`qv-question-list-item ${
                    selectedQIdx === idx ? 'selected' : ''
                  } ${q.id === highlightQuestionId ? 'new-added' : ''}`}
                  onClick={() => setSelectedQIdx(idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: selectedQIdx === idx ? 'var(--color-primary)' : '#E0E0E0',
                        color: selectedQIdx === idx ? '#fff' : '#666',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <QuestionTypeBadge type={q.type} />
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-hint)' }}>
                      {statsMap[q.id]?.total ?? 0}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: selectedQIdx === idx ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      paddingLeft: 28,
                      wordBreak: 'break-word',
                    }}
                  >
                    {q.title.length > 30 ? q.title.slice(0, 30) + '…' : q.title}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          {selectedQ ? (
            <div key={selectedQ.id + '-' + initialRenderKey} className="qv-card anim-fade" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {selectedQIdx + 1}
                </div>
                <QuestionTypeBadge type={selectedQ.type} />
                <Tag color="blue">{selectedStat?.total ?? 0} 份有效回答</Tag>
              </div>
              <h3 style={{ fontSize: 18, margin: '10px 0 20px', lineHeight: 1.4 }}>
                {selectedQ.title}
              </h3>
              <div>
                <ChartPanel
                  question={selectedQ}
                  stat={selectedStat}
                  initial={initialRenderKey > 0}
                />
              </div>
              <div className="qv-chart-lastupdate">
                {lastUpdateTime
                  ? `最后更新：${formatTime(lastUpdateTime)}`
                  : '等待数据…'}
              </div>
            </div>
          ) : (
            <div className="qv-card" style={{ padding: 48, textAlign: 'center' }}>
              <Result status="info" title="请选择左侧题目查看统计" />
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <div className="qv-card anim-fade" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 500 }}>
                  最近提交记录（共 {poll.submissions.length} 条）
                </div>
                <button className="qv-export-btn" onClick={() => exportCSV(poll.id)}>
                  <DownloadOutlined />
                  下载全部
                </button>
              </div>
              {poll.submissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-hint)', fontSize: 13 }}>
                  还没有提交
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    分享短码 <b style={{ fontFamily: 'Menlo,Consolas,monospace', color: 'var(--color-success)' }}>{poll.shortCode}</b> 邀请参与者
                  </div>
                </div>
              ) : (
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ position: 'sticky', top: 0, background: '#FAFAFA', zIndex: 1 }}>
                        <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--color-divider)', fontWeight: 500, color: 'var(--color-text-secondary)', fontSize: 12 }}>
                          序号
                        </th>
                        <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--color-divider)', fontWeight: 500, color: 'var(--color-text-secondary)', fontSize: 12 }}>
                          提交时间
                        </th>
                        {sortedQuestions.slice(0, 4).map((q) => (
                          <th
                            key={q.id}
                            style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--color-divider)', fontWeight: 500, color: 'var(--color-text-secondary)', fontSize: 12, maxWidth: 160 }}
                          >
                            {q.title.length > 8 ? q.title.slice(0, 8) + '…' : q.title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {poll.submissions
                        .slice()
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, 50)
                        .map((s, i) => (
                          <tr
                            key={s.id}
                            style={{
                              borderBottom: '1px solid #F5F5F5',
                            }}
                            className="anim-fade"
                          >
                            <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)', fontFamily: 'Menlo,Consolas,monospace', fontSize: 12 }}>
                              #{poll.submissions.length - i}
                            </td>
                            <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)', fontSize: 12 }}>
                              {formatTime(s.timestamp)}
                            </td>
                            {sortedQuestions.slice(0, 4).map((q) => {
                              const v = s.answers[q.id];
                              let txt = '';
                              if (Array.isArray(v)) txt = v.join(', ');
                              else if (v !== undefined) txt = String(v);
                              return (
                                <td
                                  key={q.id}
                                  style={{
                                    padding: '10px 12px',
                                    maxWidth: 160,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontSize: 12,
                                    color: 'var(--color-text-primary)',
                                  }}
                                >
                                  {txt || <span style={{ color: 'var(--color-text-hint)' }}>—</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {poll.submissions.length > 50 && (
                    <div style={{ textAlign: 'center', padding: 12, fontSize: 12, color: 'var(--color-text-hint)' }}>
                      仅展示最近 50 条，完整数据请使用「导出CSV」下载
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        title="动态添加题目"
        open={showAddModal}
        onCancel={() => setShowAddModal(false)}
        footer={null}
        destroyOnClose
      >
        <div style={{ display: 'grid', gap: 16, marginTop: 8 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
              题型
            </label>
            <Select
              value={newQType}
              onChange={(v: any) => {
                setNewQType(v);
                if (v !== 'rating' && newQOptions.length < 2) {
                  setNewQOptions(['选项1', '选项2']);
                }
              }}
              style={{ width: '100%' }}
              options={[
                { value: 'single', label: '单选题' },
                { value: 'multiple', label: '多选题' },
                { value: 'rating', label: '评分题（1-10分）' },
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
              题目标题
            </label>
            <Input.TextArea
              rows={2}
              value={newQTitle}
              onChange={(e) => setNewQTitle(e.target.value)}
              placeholder="请输入题目内容"
              maxLength={120}
            />
          </div>
          {newQType !== 'rating' && (
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                选项（至少 2 项）
              </label>
              <div style={{ display: 'grid', gap: 8 }}>
                {newQOptions.map((o, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <Input
                      value={o}
                      onChange={(e) => {
                        setNewQOptions((prev) =>
                          prev.map((x, j) => (j === i ? e.target.value : x))
                        );
                      }}
                      maxLength={80}
                      placeholder={`选项 ${i + 1}`}
                    />
                    <Button
                      type="text"
                      danger
                      onClick={() => {
                        if (newQOptions.length > 2) {
                          setNewQOptions((prev) => prev.filter((_, j) => j !== i));
                        }
                      }}
                      disabled={newQOptions.length <= 2}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setNewQOptions((p) => [...p, `选项${p.length + 1}`])}
                  style={{ borderRadius: 16, width: 140 }}
                >
                  添加选项
                </Button>
              </div>
            </div>
          )}
          <Alert
            type="info"
            showIcon
            message="题目添加后会立即生效"
            description="已进入投票页的参与者刷新页面后可见新题目。新题在左侧列表以脉冲动画高亮标记。"
            style={{ borderRadius: 6 }}
          />
          <Divider style={{ margin: '4px 0' }} />
          <Space style={{ justifyContent: 'flex-end' }}>
            <Button onClick={() => setShowAddModal(false)} style={{ borderRadius: 20 }}>
              取消
            </Button>
            <Button
              type="primary"
              loading={adding}
              onClick={handleAddQuestion}
              style={{ borderRadius: 20 }}
            >
              确认添加
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
}

export default PollDetail;
