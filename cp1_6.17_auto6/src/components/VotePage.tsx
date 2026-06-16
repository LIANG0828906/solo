import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePollStore } from '../pollStore';
import {
  Form,
  Radio,
  Checkbox,
  Rate,
  Button,
  Progress,
  Card,
  Input,
  message,
} from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';

const VotePage: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const { fetchPollByShortCode, submitVote } = usePollStore();
  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPoll();
  }, [shortCode]);

  const loadPoll = async () => {
    if (!shortCode) return;
    setLoading(true);
    const result = await fetchPollByShortCode(shortCode.toUpperCase());
    if (result) {
      setPoll(result);
    } else {
      message.error('未找到该投票');
    }
    setLoading(false);
  };

  const handleSubmit = async (values: any) => {
    if (!poll) return;
    setSubmitting(true);
    setProgress(0);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      if (currentProgress >= 90) {
        clearInterval(interval);
      }
      setProgress(currentProgress);
    }, 30);

    setTimeout(() => {
      submitVote(poll.id, values);
      setProgress(100);
      clearInterval(interval);
      setTimeout(() => {
        setSubmitting(false);
        setSubmitted(true);
      }, 300);
    }, 500);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>
    );
  }

  if (!poll) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>未找到该投票</h3>
        <p>请检查短码是否正确</p>
        <Button type="primary" onClick={() => navigate('/')}>
          返回首页
        </Button>
      </div>
    );
  }

  if (poll.closed) {
    return (
      <div className="poll-closed-banner" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
        投票已结束
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="thank-you-page">
        <div className="checkmark-circle">
          <CheckCircleOutlined className="checkmark-icon" style={{ fontSize: '48px' }} />
        </div>
        <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>感谢您的参与！</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>您的回答已成功提交</p>
        <Button type="primary" onClick={() => navigate('/')}>
          返回首页
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
      <Card
        className="fade-in"
        style={{ borderRadius: '8px' }}
        bodyStyle={{ padding: '24px' }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', textAlign: 'center' }}>
          {poll.title}
        </h2>

        {submitting && (
          <div className="vote-progress">
            <Progress
              percent={progress}
              strokeColor="#2196F3"
              showInfo={false}
              strokeWidth={6}
            />
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={submitting}
        >
          {poll.questions.map((q: any, index: number) => (
            <Form.Item
              key={q.id}
              name={index}
              label={
                <span style={{ fontWeight: 500 }}>
                  {index + 1}. {q.title}
                </span>
              }
              rules={[{ required: true, message: '请回答此问题' }]}
            >
              {q.type === 'single' && (
                <Radio.Group>
                  {(q.options || []).map((opt: string, optIndex: number) => (
                    <Radio key={optIndex} value={opt}>
                      {opt}
                    </Radio>
                  ))}
                </Radio.Group>
              )}
              {q.type === 'multiple' && (
                <Checkbox.Group>
                  {(q.options || []).map((opt: string, optIndex: number) => (
                    <Checkbox key={optIndex} value={opt}>
                      {opt}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              )}
              {q.type === 'rating' && (
                <Rate count={10} allowHalf={false} />
              )}
            </Form.Item>
          ))}

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              style={{ borderRadius: '20px', height: '44px', fontSize: '16px' }}
              loading={submitting}
            >
              提交
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default VotePage;
