import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePollStore } from '../pollStore';
import ChartPanel from './ChartPanel';
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
} from 'antd';
import {
  DownloadOutlined,
  CopyOutlined,
  CheckOutlined,
  PlusOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';

const PollDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { polls, currentPoll, setCurrentPoll, closePoll, addQuestion, lastUpdateTime } = usePollStore();
  const [copied, setCopied] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newlyAddedIndex, setNewlyAddedIndex] = useState<number | null>(null);
  const [form] = Form.useForm();

  const poll = currentPoll?.id === id ? currentPoll : polls.find((p) => p.id === id);

  useEffect(() => {
    if (poll) {
      setCurrentPoll(poll);
    }
  }, [poll, setCurrentPoll]);

  const handleCopyCode = async () => {
    if (!poll) return;
    try {
      await navigator.clipboard.writeText(poll.shortCode);
      setCopied(true);
      message.success('短码已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      message.error('复制失败，请手动复制');
    }
  };

  const handleExport = () => {
    if (!poll) return;
    window.open(`/api/polls/${poll.id}/export`, '_blank');
  };

  const handleClosePoll = async () => {
    if (!poll) return;
    await closePoll(poll.id);
    message.success('投票已关闭');
  };

  const handleAddQuestion = async (values: any) => {
    if (!poll) return;
    const question: any = {
      id: `q-${Date.now()}`,
      type: values.type,
      title: values.title,
    };
    if (values.type !== 'rating') {
      question.options = values.options || [];
    }
    await addQuestion(poll.id, question);
    setIsAddModalOpen(false);
    form.resetFields();
    message.success('题目添加成功');
    setNewlyAddedIndex(poll.questions.length);
    setTimeout(() => setNewlyAddedIndex(null), 2000);
  };

  if (!poll) {
    return <div style={{ padding: 24 }}>加载中...</div>;
  }

  const questionTypeOptions = [
    { label: '单选题', value: 'single' },
    { label: '多选题', value: 'multiple' },
    { label: '评分题', value: 'rating' },
  ];

  return (
    <div className="fade-in">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            style={{ color: '#3F51B5' }}
          >
            返回
          </Button>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>{poll.title}</h2>
          <span
            className="short-code-badge"
            onClick={handleCopyCode}
            title="点击复制短码"
          >
            {copied ? <CheckOutlined style={{ fontSize: '12px' }} /> : <CopyOutlined style={{ fontSize: '12px', marginRight: '4px' }} />}
            <span style={{ marginLeft: copied ? '4px' : '4px' }}>
              {poll.shortCode}
            </span>
          </span>
          {poll.closed && (
            <span
              style={{
                background: '#F44336',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
              }}
            >
              已结束
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            className="btn-export"
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            导出CSV
          </Button>
          {!poll.closed && (
            <>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsAddModalOpen(true)}
                style={{ borderRadius: 20 }}
              >
                添加题目
              </Button>
              <Popconfirm
                title="确定要关闭这个投票吗？"
                description="关闭后将无法再收集新的投票"
                onConfirm={handleClosePoll}
                okText="确定关闭"
                cancelText="取消"
              >
                <Button
                  danger
                  icon={<CloseOutlined />}
                  style={{ borderRadius: 20 }}
                >
                  关闭投票
                </Button>
              </Popconfirm>
            </>
          )}
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-questions">
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            题目列表 ({poll.questions.length})
          </h3>
          {poll.questions.map((q, index) => (
            <div
              key={q.id}
              className={`question-list-item ${newlyAddedIndex === index ? 'pulse-highlight' : ''}`}
            >
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                {index + 1}. {q.title}
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                {q.type === 'single' && '单选题'}
                {q.type === 'multiple' && '多选题'}
                {q.type === 'rating' && '评分题 (1-10分)'}
              </div>
            </div>
          ))}
          {poll.questions.length === 0 && (
            <div style={{ color: '#999', textAlign: 'center', padding: '20px 0' }}>
              暂无题目
            </div>
          )}
        </div>

        <div className="detail-charts">
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            实时结果 ({poll.votes.length} 人参与)
          </h3>
          {poll.questions.map((q, index) => (
            <ChartPanel
              key={q.id}
              question={q}
              questionIndex={index}
              votes={poll.votes}
              lastUpdateTime={lastUpdateTime}
            />
          ))}
          {poll.questions.length === 0 && (
            <div style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
              暂无题目数据
            </div>
          )}
        </div>
      </div>

      <Modal
        title="添加新题目"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleAddQuestion}>
          <Form.Item
            label="题目类型"
            name="type"
            rules={[{ required: true, message: '请选择题目类型' }]}
          >
            <Select options={questionTypeOptions} placeholder="请选择题目类型" />
          </Form.Item>
          <Form.Item
            label="题目标题"
            name="title"
            rules={[{ required: true, message: '请输入题目标题' }]}
          >
            <Input placeholder="请输入题目标题" />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              if (type === 'rating') return null;
              return (
                <Form.List
                  name="options"
                  rules={[
                    {
                      validator: async (_, options) => {
                        if (!options || options.length < 2) {
                          return Promise.reject(new Error('至少需要2个选项'));
                        }
                      },
                    },
                  ]}
                >
                  {(fields, { add, remove }, { errors }) => (
                    <>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                        选项
                      </label>
                      {fields.map((field, index) => (
                        <Form.Item
                          {...field}
                          key={field.key}
                          validateTrigger={['onChange', 'onBlur']}
                          rules={[{ required: true, message: '请输入选项内容' }]}
                        >
                          <Input
                            placeholder={`选项 ${index + 1}`}
                            style={{ width: '80%' }}
                          />
                          {fields.length > 2 ? (
                            <Button
                              type="text"
                              danger
                              onClick={() => remove(field.name)}
                              style={{ marginLeft: '8px' }}
                            >
                              删除
                            </Button>
                          ) : null}
                        </Form.Item>
                      ))}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          icon={<PlusOutlined />}
                        >
                          添加选项
                        </Button>
                        <Form.ErrorList errors={errors} />
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              );
            }}
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: '16px' }}>
            <Button
              onClick={() => setIsAddModalOpen(false)}
              style={{ marginRight: '8px', borderRadius: 20 }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit" style={{ borderRadius: 20 }}>
              添加
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PollDetail;
