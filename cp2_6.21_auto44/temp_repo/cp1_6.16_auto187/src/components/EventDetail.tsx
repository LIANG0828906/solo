import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, LoadingOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Button, Form, InputNumber, Radio, message, Result, Empty, Spin } from 'antd';
import { useAppStore } from '@/store';
import type { RadioChangeEvent } from 'antd';

const formatCountdown = (ms: number): string => {
  if (ms <= 0) return '已开赛';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}时${m}分${s}秒`;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
};

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const events = useAppStore(s => s.events);
  const submitBet = useAppStore(s => s.submitBet);
  const getBetForEvent = useAppStore(s => s.getBetForEvent);
  const loadEvents = useAppStore(s => s.loadEvents);
  const currentUser = useAppStore(s => s.currentUser);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [optionId, setOptionId] = useState<string>('');
  const [amount, setAmount] = useState<number>(10);
  const [now, setNow] = useState(Date.now());
  const [messageApi, contextHolder] = message.useMessage();

  const event = events.find(e => e.id === id);
  const bet = event ? getBetForEvent(event.id) : undefined;

  useEffect(() => {
    if (events.length === 0) {
      setLoading(true);
      loadEvents().finally(() => setLoading(false));
    }
  }, [events.length, loadEvents]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOptionChange = (e: RadioChangeEvent) => {
    setOptionId(e.target.value);
  };

  const handleSubmit = async () => {
    if (!event || !optionId) {
      messageApi.warning('请选择竞猜选项');
      return;
    }
    if (!amount || amount < 1 || amount > 100) {
      messageApi.warning('投注积分必须在1-100之间');
      return;
    }
    if (currentUser && currentUser.points < amount) {
      messageApi.error('积分不足');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitBet(event.id, optionId, amount);
      if (result.success) {
        messageApi.open({
          type: 'success',
          content: '投注成功！祝您好运！',
          duration: 3,
        });
      } else {
        messageApi.open({
          type: 'error',
          content: result.message || '投注失败',
          duration: 3,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="empty-state">
        <Empty description="赛事不存在" />
        <Button
          type="primary"
          className="interactive-btn"
          style={{ marginTop: 24 }}
          onClick={() => navigate('/')}
        >
          返回首页
        </Button>
      </div>
    );
  }

  const timeLeft = event.startTime - now;
  const canBet = event.status === 'upcoming' && !bet;
  const selectedOption = event.options.find(o => o.id === optionId);
  const betOption = bet ? event.options.find(o => o.id === bet.optionId) : null;
  const winningOption = event.result ? event.options.find(o => o.id === event.result) : null;

  return (
    <div>
      {contextHolder}
      <Button
        type="text"
        className="interactive-btn"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/')}
        style={{ marginBottom: 20, color: '#d9d9d9', paddingLeft: 0 }}
      >
        返回赛事列表
      </Button>

      <div style={{
        background: '#1f1f1f',
        borderRadius: 8,
        padding: 32,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 28, marginBottom: 12, fontWeight: 700 }}>
              {event.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d9d9d9' }}>
              <ClockCircleOutlined />
              <span style={{ color: timeLeft > 0 && timeLeft < 60000 ? '#ff4d4f' : '#d9d9d9', fontSize: 16 }}>
                {event.status === 'finished' ? '赛事已结束' : event.status === 'live' ? '赛事进行中...' : `距离开赛: ${formatCountdown(timeLeft)}`}
              </span>
            </div>
          </div>
          <div style={{
            padding: '8px 16px',
            borderRadius: 20,
            background: event.status === 'upcoming'
              ? 'rgba(22, 119, 255, 0.15)'
              : event.status === 'live'
              ? 'rgba(82, 196, 26, 0.15)'
              : 'rgba(140, 140, 140, 0.15)',
            color: event.status === 'upcoming'
              ? '#1677ff'
              : event.status === 'live'
              ? '#52c41a'
              : '#8c8c8c',
            fontWeight: 600,
          }}>
            {event.status === 'upcoming' ? '接受投注' : event.status === 'live' ? '进行中' : '已结束'}
          </div>
        </div>

        {bet && betOption && (
          <Result
            icon={<CheckCircleOutlined style={{ color: bet.status === 'won' ? '#52c41a' : bet.status === 'lost' ? '#ff4d4f' : '#1677ff', fontSize: 48 }} />}
            status={bet.status === 'won' ? 'success' : bet.status === 'lost' ? 'error' : 'info'}
            title={
              bet.status === 'won'
                ? `恭喜！您赢得了 ${Math.floor(bet.amount * betOption.odds).toLocaleString()} 积分`
                : bet.status === 'lost'
                ? '很遗憾，未能猜中'
                : '您已完成投注，等待赛事结果'
            }
            subTitle={`投注选项: ${betOption.name}，投注积分: ${bet.amount}`}
            style={{ padding: 0, marginBottom: 24 }}
          />
        )}

        {event.status === 'finished' && winningOption && (
          <div style={{
            padding: 16,
            background: 'rgba(250, 173, 20, 0.1)',
            border: '1px solid rgba(250, 173, 20, 0.3)',
            borderRadius: 8,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <CheckCircleOutlined style={{ color: '#faad14', fontSize: 24 }} />
            <div>
              <div style={{ color: '#faad14', fontWeight: 600 }}>赛事结果</div>
              <div style={{ color: '#fff', fontSize: 16 }}>
                获胜选项: <strong>{winningOption.name}</strong> (赔率 {winningOption.odds.toFixed(2)})
              </div>
            </div>
          </div>
        )}

        {canBet && (
          <Form layout="vertical" style={{ maxWidth: 500 }}>
            <div style={{ marginBottom: 8, color: '#d9d9d9', fontSize: 14, fontWeight: 500 }}>
              选择竞猜选项
            </div>
            <Form.Item style={{ marginBottom: 24 }}>
              <Radio.Group
                value={optionId}
                onChange={handleOptionChange}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {event.options.map(opt => (
                  <Radio
                    key={opt.id}
                    value={opt.id}
                    style={{
                      width: '100%',
                      margin: 0,
                      padding: '14px 16px',
                      background: optionId === opt.id ? 'rgba(250, 173, 20, 0.08)' : 'rgba(255,255,255,0.03)',
                      border: optionId === opt.id ? '1px solid #faad14' : '1px solid #333',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ color: '#fff', fontSize: 15 }}>{opt.name}</span>
                    <span className="odds-gradient" style={{ fontSize: 20 }}>
                      x{opt.odds.toFixed(2)}
                    </span>
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>

            <div style={{ marginBottom: 8, color: '#d9d9d9', fontSize: 14, fontWeight: 500 }}>
              投注积分 (1 - 100)
            </div>
            <Form.Item style={{ marginBottom: 24 }}>
              <InputNumber
                min={1}
                max={100}
                value={amount}
                onChange={val => setAmount(val as number)}
                style={{ width: '100%', height: 44, fontSize: 16 }}
                addonBefore="积分"
                addonAfter={`/ ${currentUser?.points || 0}`}
              />
              {selectedOption && (
                <div style={{ marginTop: 8, color: '#52c41a', fontSize: 13 }}>
                  若获胜可得: <strong>{Math.floor(amount * selectedOption.odds).toLocaleString()}</strong> 积分
                </div>
              )}
            </Form.Item>

            <Button
              type="primary"
              size="large"
              block
              className="interactive-btn"
              loading={submitting}
              icon={submitting ? <LoadingOutlined /> : undefined}
              onClick={handleSubmit}
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #faad14, #fa8c16)',
                border: 'none',
              }}
            >
              {submitting ? '投注中...' : '确认投注'}
            </Button>
          </Form>
        )}

        {!canBet && event.status !== 'finished' && !bet && (
          <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>
            {event.status === 'live' ? '赛事进行中，已停止投注' : '暂不可投注'}
          </div>
        )}
      </div>
    </div>
  );
}
