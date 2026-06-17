import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Input, Select, Button, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined, CheckCircleOutlined, HolderOutlined } from '@ant-design/icons';
import { usePollStore, QuestionType, Question } from '../pollStore';

const { TextArea } = Input;
const { Option } = Select;

interface FormQuestion {
  id: string;
  type: QuestionType;
  title: string;
  options: string[];
}

const PollForm = () => {
  const navigate = useNavigate();
  const createPoll = usePollStore(s => s.createPoll);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<FormQuestion[]>([
    { id: '1', type: 'single', title: '', options: ['', ''] },
  ]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [createdShortCode, setCreatedShortCode] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: String(Date.now()),
        type: 'single',
        title: '',
        options: ['', ''],
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      message.warning('至少需要一道题目');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof FormQuestion, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    setQuestions(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push('');
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options.length <= 2) {
      message.warning('至少需要两个选项');
      return;
    }
    newQuestions[qIndex].options.splice(oIndex, 1);
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newQuestions = [...questions];
    const [removed] = newQuestions.splice(dragIndex, 1);
    newQuestions.splice(dropIndex, 0, removed);
    setQuestions(newQuestions);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      message.error('请输入投票标题');
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.title.trim()) {
        message.error(`第 ${i + 1} 题标题不能为空`);
        return;
      }
      if ((q.type === 'single' || q.type === 'multiple') && q.options.filter(o => o.trim()).length < 2) {
        message.error(`第 ${i + 1} 题至少需要两个有效选项`);
        return;
      }
    }

    const pollQuestions: Omit<Question, 'id'>[] = questions.map(q => ({
      type: q.type,
      title: q.title,
      options: q.type === 'rating' ? undefined : q.options.filter(o => o.trim()),
      minRating: q.type === 'rating' ? 1 : undefined,
      maxRating: q.type === 'rating' ? 10 : undefined,
    }));

    try {
      const poll = await createPoll({ title: title.trim(), questions: pollQuestions });
      setCreatedShortCode(poll.shortCode);
    } catch (e) {
      message.error('创建失败，请重试');
    }
  };

  const copyShortCode = () => {
    if (createdShortCode) {
      navigator.clipboard.writeText(createdShortCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const getTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'single': return '单选题';
      case 'multiple': return '多选题';
      case 'rating': return '评分题';
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>投票标题</label>
        <Input
          size="large"
          placeholder="请输入投票标题"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ borderRadius: 8 }}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <label style={{ fontWeight: 600, color: '#333' }}>题目列表（可拖拽调整顺序）</label>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addQuestion}
            style={{ borderRadius: 20, background: '#3F51B5' }}
          >
            添加题目
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {questions.map((q, qIndex) => (
            <div
              key={q.id}
              draggable
              onDragStart={() => handleDragStart(qIndex)}
              onDragOver={(e) => handleDragOver(e, qIndex)}
              onDrop={() => handleDrop(qIndex)}
              onDragEnd={handleDragEnd}
              style={{
                background: '#FFFFFF',
                borderRadius: 8,
                border: dragOverIndex === qIndex && dragIndex !== qIndex
                  ? '2px dashed #3F51B5'
                  : '1px solid #E0E0E0',
                padding: 20,
                transform: dragIndex === qIndex ? 'translateY(10px)' : 'translateY(0)',
                opacity: dragIndex === qIndex ? 0.8 : 1,
                boxShadow: dragIndex === qIndex ? '0 6px 16px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'box-shadow 0.2s, transform 0.2s',
                cursor: 'move',
                animation: 'fadeIn 0.3s ease',
              }}
              onMouseOver={(e) => {
                if (dragIndex !== qIndex) {
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)';
                }
              }}
              onMouseOut={(e) => {
                if (dragIndex !== qIndex) {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                }
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                <HolderOutlined style={{ fontSize: 20, color: '#ccc', marginTop: 8, cursor: 'grab' }} />
                <div style={{
                  background: '#3F51B5',
                  color: '#fff',
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: 13,
                  flexShrink: 0,
                }}>
                  {qIndex + 1}
                </div>
                <Select
                  value={q.type}
                  onChange={val => updateQuestion(qIndex, 'type', val)}
                  style={{ width: 120, flexShrink: 0 }}
                  size="middle"
                >
                  <Option value="single">单选题</Option>
                  <Option value="multiple">多选题</Option>
                  <Option value="rating">评分题</Option>
                </Select>
                <div style={{ flex: 1 }}>
                  <Input
                    placeholder={`请输入${getTypeLabel(q.type)}标题`}
                    value={q.title}
                    onChange={e => updateQuestion(qIndex, 'title', e.target.value)}
                    size="middle"
                  />
                </div>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeQuestion(qIndex)}
                />
              </div>

              {(q.type === 'single' || q.type === 'multiple') && (
                <div style={{ paddingLeft: 64, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: '#999', width: 24 }}>{oIndex + 1}.</span>
                      <Input
                        placeholder={`选项 ${oIndex + 1}`}
                        value={opt}
                        onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                      />
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeOption(qIndex, oIndex)}
                      />
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => addOption(qIndex)}
                    style={{ width: 'fit-content', marginTop: 4 }}
                  >
                    添加选项
                  </Button>
                </div>
              )}

              {q.type === 'rating' && (
                <div style={{ paddingLeft: 64, color: '#666', fontSize: 13 }}>
                  评分范围：1 - 10 分
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <Button
          size="large"
          onClick={() => navigate('/')}
          style={{ borderRadius: 20, padding: '0 24px' }}
        >
          取消
        </Button>
        <Button
          type="primary"
          size="large"
          onClick={handleSubmit}
          style={{ borderRadius: 20, padding: '0 32px', background: '#3F51B5' }}
        >
          创建投票
        </Button>
      </div>

      <Modal
        open={!!createdShortCode}
        footer={null}
        closable={false}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#4CAF50', marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#333' }}>
            投票创建成功！
          </div>
          <div style={{ color: '#666', marginBottom: 20 }}>
            分享以下短码让参与者投票
          </div>
          <div
            onClick={copyShortCode}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              background: '#4CAF50',
              color: '#fff',
              padding: '12px 28px',
              borderRadius: 6,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 4,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              marginBottom: 8,
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {createdShortCode}
            {copySuccess ? <CheckCircleOutlined /> : <CopyOutlined style={{ fontSize: 18 }} />}
          </div>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 24 }}>
            {copySuccess ? '已复制到剪贴板' : '点击复制'}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button
              style={{ borderRadius: 20, padding: '0 24px' }}
              onClick={() => { setCreatedShortCode(null); navigate('/'); }}
            >
              返回仪表盘
            </Button>
            <Button
              type="primary"
              style={{ borderRadius: 20, padding: '0 24px', background: '#3F51B5' }}
              onClick={() => { setCreatedShortCode(null); navigate(`/poll/${usePollStore.getState().polls[usePollStore.getState().polls.length - 1]?.id}`); }}
            >
              查看详情
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default PollForm;
