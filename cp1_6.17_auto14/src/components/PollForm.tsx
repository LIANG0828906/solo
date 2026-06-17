import { useState, useMemo, useRef, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Select,
  Space,
  Divider,
  message,
  Tag,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  HolderOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { usePollStore } from '../pollStore';
import type { Question, QuestionType } from '../types';

const { TextArea } = Input;

interface DraftQuestion extends Omit<Question, 'id' | 'order'> {
  _id: string;
}

const TYPE_LABELS: Record<QuestionType, string> = {
  single: '单选题',
  multiple: '多选题',
  rating: '评分题 (1-10)',
};

const TYPE_COLORS: Record<QuestionType, string> = {
  single: '#2196F3',
  multiple: '#4CAF50',
  rating: '#9C27B0',
};

function createEmptyQuestion(type: QuestionType): DraftQuestion {
  return {
    _id: uuidv4(),
    type,
    title: '',
    options: type === 'rating' ? undefined : ['选项1', '选项2'],
  };
}

function PollForm() {
  const navigate = useNavigate();
  const createPoll = usePollStore((s) => s.createPoll);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    createEmptyQuestion('single'),
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ shortCode: string; pollId: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const addQuestion = (type: QuestionType) => {
    setQuestions((prev) => [...prev, createEmptyQuestion(type)]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, patch: Partial<DraftQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    );
  };

  const addOption = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx && q.options
          ? { ...q, options: [...q.options, `选项${q.options.length + 1}`] }
          : q
      )
    );
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx && q.options
          ? {
              ...q,
              options: q.options.map((o, j) => (j === optIdx ? value : o)),
            }
          : q
      )
    );
  };

  const removeOption = (qIdx: number, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx && q.options && q.options.length > 2
          ? { ...q, options: q.options.filter((_, j) => j !== optIdx) }
          : q
      )
    );
  };

  const onDragStart = (e: DragEvent<HTMLDivElement>, idx: number) => {
    dragIdx.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    const target = e.currentTarget as HTMLDivElement;
    target.classList.add('dragging');
  };

  const onDragEnd = (e: DragEvent<HTMLDivElement>) => {
    const target = e.currentTarget as HTMLDivElement;
    target.classList.remove('dragging');
    document.querySelectorAll('.qv-question-card').forEach((el) => {
      el.classList.remove('drag-placeholder');
    });
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  };

  const onDragEnter = (e: DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    document.querySelectorAll('.qv-question-card').forEach((el) => {
      el.classList.remove('drag-placeholder');
    });
    (e.currentTarget as HTMLDivElement).classList.add('drag-placeholder');
    setDragOverIdx(idx);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).classList.remove('drag-placeholder');
  };

  const onDrop = (e: DragEvent<HTMLDivElement>, targetIdx: number) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).classList.remove('drag-placeholder');
    const srcIdx = dragIdx.current;
    if (srcIdx === null || srcIdx === targetIdx) return;
    setQuestions((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(srcIdx, 1);
      arr.splice(targetIdx, 0, moved);
      return arr;
    });
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;
    if (questions.length === 0) return false;
    return questions.every((q) => {
      if (!q.title.trim()) return false;
      if ((q.type === 'single' || q.type === 'multiple') && (!q.options || q.options.some((o) => !o.trim()))) {
        return false;
      }
      return true;
    });
  }, [title, questions]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      message.warning('请完整填写所有必填项');
      return;
    }
    setSubmitting(true);
    try {
      const poll = await createPoll({
        title: title.trim(),
        description: description.trim() || undefined,
        questions: questions.map((q, idx) => ({
          type: q.type,
          title: q.title.trim(),
          options: q.options,
          order: idx,
        })),
      });
      setCreated({ shortCode: poll.shortCode, pollId: poll.id });
      message.success('投票创建成功！');
    } catch (err) {
      message.error((err as Error).message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const copyShortCode = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.shortCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      message.success('短码已复制到剪贴板');
    } catch {
      message.warning('复制失败，请手动复制');
    }
  };

  if (created) {
    return (
      <div className="anim-fade-simple">
        <div className="qv-card" style={{ padding: 40, textAlign: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #81C784, #4CAF50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(76,175,80,0.3)',
            }}
          >
            <CheckCircleOutlined style={{ fontSize: 40, color: '#fff' }} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>投票创建成功！</h2>
          <div style={{ color: 'var(--color-text-secondary)', marginBottom: 32 }}>
            分享下方6位短码，让参与者快速进入投票
          </div>
          <div style={{ marginBottom: 32 }}>
            <div
              className="qv-shortcode-badge"
              onClick={copyShortCode}
              title="点击复制短码"
            >
              {created.shortCode}
              {copied ? (
                <span className="qv-shortcode-hint">✓ 已复制</span>
              ) : (
                <CopyOutlined className="qv-shortcode-hint" />
              )}
            </div>
          </div>
          <Space size="middle">
            <Button
              onClick={() => navigate(`/vote/${created.shortCode}`)}
              target="_blank"
              style={{ borderRadius: 20, paddingInline: 20 }}
            >
              预览投票页面
            </Button>
            <Button
              type="primary"
              onClick={() => navigate(`/poll/${created.pollId}`)}
              style={{ borderRadius: 20, paddingInline: 20 }}
            >
              查看实时仪表盘
            </Button>
          </Space>
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--color-divider)' }}>
            <Button
              type="link"
              onClick={() => {
                setCreated(null);
                setTitle('');
                setDescription('');
                setQuestions([createEmptyQuestion('single')]);
              }}
              icon={<PlusOutlined />}
            >
              再创建一个投票
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="anim-fade">
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ borderRadius: 20, marginBottom: 16 }}
          type="text"
        >
          返回
        </Button>
        <h2 style={{ fontSize: 24, margin: 0 }}>创建投票 / 问卷</h2>
        <div style={{ color: 'var(--color-text-secondary)', marginTop: 6, fontSize: 13 }}>
          支持单选、多选与评分题，拖拽排序快速调整
        </div>
      </div>

      <div className="qv-card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'grid', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 8, fontSize: 14 }}>
              投票标题 <span style={{ color: '#f44336' }}>*</span>
            </label>
            <Input
              size="large"
              placeholder="例如：团建活动地点投票"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 8, fontSize: 14 }}>
              描述说明（可选）
            </label>
            <TextArea
              rows={2}
              placeholder="补充说明、截止时间、填写注意事项等"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
            />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 500, fontSize: 15 }}>
            题目列表 <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>({questions.length} 题)</span>
          </div>
          <Space size="small">
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => addQuestion('single')}
              style={{ borderRadius: 16 }}
            >
              单选
            </Button>
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => addQuestion('multiple')}
              style={{ borderRadius: 16 }}
            >
              多选
            </Button>
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => addQuestion('rating')}
              style={{ borderRadius: 16 }}
            >
              评分
            </Button>
          </Space>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, marginBottom: 32 }}>
        {questions.map((q, qIdx) => (
          <div
            key={q._id}
            className="qv-question-card"
            draggable
            onDragStart={(e) => onDragStart(e, qIdx)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => onDragOver(e, qIdx)}
            onDragEnter={(e) => onDragEnter(e, qIdx)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, qIdx)}
            style={dragOverIdx === qIdx ? { borderColor: '#3F51B5' } : undefined}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  paddingTop: 4,
                  cursor: 'grab',
                }}
              >
                <HolderOutlined
                  style={{ color: '#BDBDBD', fontSize: 18, cursor: 'grab' }}
                />
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  {qIdx + 1}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Tag color={TYPE_COLORS[q.type]} style={{ margin: 0, borderRadius: 4 }}>
                    {TYPE_LABELS[q.type]}
                  </Tag>
                  <Select
                    size="small"
                    value={q.type}
                    onChange={(v: QuestionType) => {
                      updateQuestion(qIdx, {
                        type: v,
                        options: v === 'rating' ? undefined : q.options || ['选项1', '选项2'],
                      });
                    }}
                    style={{ width: 130 }}
                    options={[
                      { value: 'single', label: '单选题' },
                      { value: 'multiple', label: '多选题' },
                      { value: 'rating', label: '评分题' },
                    ]}
                  />
                </div>
                <Input
                  placeholder="请输入题目内容"
                  value={q.title}
                  onChange={(e) => updateQuestion(qIdx, { title: e.target.value })}
                  maxLength={120}
                  style={{ marginBottom: 12 }}
                />
                {q.type !== 'rating' && (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {q.options?.map((opt, optIdx) => (
                      <div key={optIdx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: q.type === 'single' ? '50%' : 3,
                            border: '2px solid #BDBDBD',
                            flexShrink: 0,
                          }}
                        />
                        <Input
                          placeholder={`选项 ${optIdx + 1}`}
                          value={opt}
                          onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                          maxLength={80}
                          style={{ flex: 1 }}
                        />
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeOption(qIdx, optIdx)}
                          disabled={q.options && q.options.length <= 2}
                        />
                      </div>
                    ))}
                    <Button
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => addOption(qIdx)}
                      style={{ borderRadius: 16, width: 120, marginTop: 4 }}
                    >
                      添加选项
                    </Button>
                  </div>
                )}
                {q.type === 'rating' && (
                  <div
                    style={{
                      padding: 12,
                      background: '#F3E5F5',
                      borderRadius: 8,
                      color: '#6A1B9A',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div style={{ fontSize: 16 }}>📊</div>
                    <span>
                      评分范围 1-10 分，自动生成平均分趋势图
                    </span>
                  </div>
                )}
              </div>
              <Popconfirm
                title="确定删除此题？"
                onConfirm={() => removeQuestion(qIdx)}
                disabled={questions.length <= 1}
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={questions.length <= 1}
                />
              </Popconfirm>
            </div>
          </div>
        ))}
      </div>

      <Divider style={{ margin: '24px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {!canSubmit && <span style={{ color: '#F44336' }}>⚠ 请完整填写所有题目内容</span>}
        </div>
        <Space size="middle">
          <Button style={{ borderRadius: 20, paddingInline: 24 }} onClick={() => navigate('/')}>
            取消
          </Button>
          <Button
            type="primary"
            size="large"
            loading={submitting}
            disabled={!canSubmit}
            onClick={handleSubmit}
            style={{ borderRadius: 20, paddingInline: 32, fontWeight: 500 }}
          >
            创建并生成短码
          </Button>
        </Space>
      </div>
    </div>
  );
}

export default PollForm;
