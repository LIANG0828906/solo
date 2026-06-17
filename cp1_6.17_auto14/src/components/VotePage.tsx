import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Radio,
  Checkbox,
  Slider,
  Alert,
  Spin,
  Result,
  Space,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { usePollStore } from '../pollStore';
import type { Poll, Question, QuestionType } from '../types';

type AnswerMap = Record<string, string | string[] | number>;

function QuestionRenderer({
  question,
  value,
  onChange,
  disabled,
}: {
  question: Question;
  value: string | string[] | number | undefined;
  onChange: (v: string | string[] | number) => void;
  disabled: boolean;
}) {
  if (question.type === 'single') {
    return (
      <Radio.Group
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{ width: '100%' }}
      >
        <div style={{ display: 'grid', gap: 10 }}>
          {(question.options || []).map((opt, idx) => (
            <label
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: value === opt ? '#E8EAF6' : '#fff',
                borderColor: value === opt ? 'var(--color-primary)' : 'var(--color-border)',
                transition: 'all 0.15s ease',
              }}
            >
              <Radio value={opt} disabled={disabled} />
              <span style={{ flex: 1 }}>{opt}</span>
            </label>
          ))}
        </div>
      </Radio.Group>
    );
  }
  if (question.type === 'multiple') {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    return (
      <Checkbox.Group
        value={arr}
        onChange={(v) => onChange(v as string[])}
        disabled={disabled}
        style={{ width: '100%' }}
      >
        <div style={{ display: 'grid', gap: 10 }}>
          {(question.options || []).map((opt, idx) => {
            const checked = arr.includes(opt);
            return (
              <label
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  background: checked ? '#E8F5E9' : '#fff',
                  borderColor: checked ? 'var(--color-success)' : 'var(--color-border)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Checkbox value={opt} disabled={disabled} />
                <span style={{ flex: 1 }}>{opt}</span>
              </label>
            );
          })}
        </div>
      </Checkbox.Group>
    );
  }
  if (question.type === 'rating') {
    const num = typeof value === 'number' ? value : 0;
    return (
      <div style={{ padding: '8px 4px' }}>
        <Slider
          min={1}
          max={10}
          marks={{
            1: '1',
            3: '3',
            5: '5',
            7: '7',
            10: '10',
          }}
          value={num || 1}
          onChange={(v) => onChange(Number(v))}
          disabled={disabled}
          tooltip={{ formatter: (v) => `${v} 分` }}
        />
        <div
          style={{
            textAlign: 'center',
            marginTop: 4,
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--color-purple)',
            letterSpacing: 2,
          }}
        >
          {num || 1} <span style={{ fontSize: 14, fontWeight: 400 }}>分</span>
        </div>
      </div>
    );
  }
  return null;
}

function VotePage() {
  const { shortCode = '' } = useParams();
  const navigate = useNavigate();
  const fetchPollByCode = usePollStore((s) => s.fetchPollByCode);
  const submitVote = usePollStore((s) => s.submitVote);

  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const code = shortCode.trim().toUpperCase();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    setPoll(null);
    fetchPollByCode(code)
      .then((p) => {
        if (cancelled) return;
        if (!p) {
          setErr('未找到该短码对应的投票，请核对后重试');
        } else {
          setPoll(p);
          const init: AnswerMap = {};
          p.questions.forEach((q) => {
            if (q.type === 'rating') init[q.id] = 5;
            if (q.type === 'multiple') init[q.id] = [];
          });
          setAnswers(init);
        }
      })
      .catch(() => !cancelled && setErr('加载失败，请检查网络'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [code, fetchPollByCode]);

  const answeredCount = useMemo(() => {
    if (!poll) return 0;
    let cnt = 0;
    poll.questions.forEach((q) => {
      const a = answers[q.id];
      if (q.type === 'multiple') {
        if (Array.isArray(a) && a.length > 0) cnt++;
      } else if (q.type === 'single') {
        if (typeof a === 'string' && a.length > 0) cnt++;
      } else if (q.type === 'rating') {
        if (typeof a === 'number' && a >= 1) cnt++;
      }
    });
    return cnt;
  }, [poll, answers]);

  const progressPct = poll ? Math.round((answeredCount / poll.questions.length) * 100) : 0;

  const canSubmit = poll && answeredCount === poll.questions.length;

  const setAnswer = (qid: string, v: string | string[] | number) => {
    setAnswers((prev) => ({ ...prev, [qid]: v }));
  };

  const handleSubmit = async () => {
    if (!poll || !canSubmit) return;
    setSubmitting(true);
    setSubmitErr(null);
    setProgress(10);
    const timer = setInterval(() => {
      setProgress((p) => (p < 85 ? p + Math.random() * 12 : p));
    }, 120);
    try {
      await submitVote({ pollId: poll.id, answers });
      setProgress(100);
      clearInterval(timer);
      setTimeout(() => navigate('/thanks'), 300);
    } catch (e) {
      clearInterval(timer);
      setProgress(0);
      setSubmitErr((e as Error).message || '提交失败');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: 40 }}>
        <div className="qv-card" style={{ maxWidth: 520, margin: '40px auto', padding: 48, textAlign: 'center' }}>
          <Result
            status="warning"
            title="投票不存在"
            subTitle={err}
            extra={
              <Space>
                <Button onClick={() => navigate('/')}>返回首页</Button>
                <Button
                  type="primary"
                  onClick={() => {
                    const c = prompt('请输入6位短码：');
                    if (c) navigate(`/vote/${c.trim().toUpperCase()}`);
                  }}
                >
                  重新输入短码
                </Button>
              </Space>
            }
          />
        </div>
      </div>
    );
  }

  if (!poll) return null;

  if (!poll.isActive) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <div className="qv-closed-banner">投票已结束</div>
        <div style={{ padding: 40 }}>
          <div className="qv-card" style={{ maxWidth: 520, margin: '40px auto', padding: 48, textAlign: 'center' }}>
            <Result
              status="info"
              title="此投票已关闭"
              subTitle="创建者已停止收集新的答卷"
              extra={
                <Button type="primary" onClick={() => navigate('/')}>
                  返回首页
                </Button>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #E8EAF6 0%, #F5F5F5 40%, #FCE4EC 100%)',
        padding: '32px 24px',
      }}
      className="anim-fade-simple"
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            style={{ borderRadius: 20 }}
            type="text"
          >
            返回首页
          </Button>
        </div>
        <div className="qv-card" style={{ padding: 36, marginBottom: 24 }}>
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--color-primary)',
              color: '#fff',
              padding: '4px 14px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 16,
              fontFamily: 'Menlo, Consolas, monospace',
              letterSpacing: 2,
            }}
          >
            {poll.shortCode}
          </div>
          <h1 style={{ fontSize: 26, margin: '0 0 8px', lineHeight: 1.3 }}>{poll.title}</h1>
          {poll.description && (
            <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: 14, lineHeight: 1.6 }}>
              {poll.description}
            </p>
          )}
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                marginBottom: 8,
              }}
            >
              <span>完成进度</span>
              <span>
                {answeredCount} / {poll.questions.length}
              </span>
            </div>
            <div className="qv-progress-bar-outer">
              <div
                className="qv-progress-bar-inner"
                style={{ width: `${submitting ? progress : progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {submitErr && (
          <Alert
            type="error"
            message={submitErr}
            showIcon
            style={{ marginBottom: 20, borderRadius: 8 }}
            closable
            onClose={() => setSubmitErr(null)}
          />
        )}

        <div style={{ display: 'grid', gap: 20 }}>
          {poll.questions
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((q, idx) => (
              <div
                key={q.id}
                className="qv-card anim-fade"
                style={{ padding: 28, animationDelay: `${idx * 60}ms` }}
              >
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'var(--color-primary)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <Tag
                      style={{ margin: 0, borderRadius: 4 }}
                      color={
                        q.type === 'single'
                          ? 'blue'
                          : q.type === 'multiple'
                          ? 'green'
                          : 'purple'
                      }
                    >
                      {q.type === 'single' ? '单选' : q.type === 'multiple' ? '多选' : '评分'}
                    </Tag>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.5 }}>{q.title}</div>
                </div>
                <QuestionRenderer
                  question={q}
                  value={answers[q.id]}
                  onChange={(v) => setAnswer(q.id, v)}
                  disabled={submitting}
                />
              </div>
            ))}
        </div>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!canSubmit}
            style={{
              borderRadius: 24,
              paddingInline: 48,
              height: 48,
              fontSize: 15,
              fontWeight: 500,
              boxShadow: '0 8px 24px rgba(63,81,181,0.3)',
            }}
          >
            {submitting ? '提交中…' : canSubmit ? '提交答卷' : `请完成所有题目 (${answeredCount}/${poll.questions.length})`}
          </Button>
          <div style={{ marginTop: 20, fontSize: 11, color: 'var(--color-text-hint)' }}>
            所有答案均匿名提交，仅用于统计目的
          </div>
        </div>
      </div>
    </div>
  );
}

export default VotePage;
