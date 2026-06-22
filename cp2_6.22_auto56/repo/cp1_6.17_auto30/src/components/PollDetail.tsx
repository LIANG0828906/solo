import { useState, useEffect, useRef } from 'react';
import { usePollStore } from '../pollStore';
import ChartPanel from './ChartPanel';
import {
  DownloadOutlined,
  PlusOutlined,
  StopOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { Button, Modal, Form, Input, Select, message } from 'antd';
import type { QuestionType } from '../types';

const { Option } = Select;

function PollDetail() {
  const { currentPoll, currentResults, fetchResults, closePoll, addQuestion, lastUpdateTime } = usePollStore();
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newQuestionIds, setNewQuestionIds] = useState<string[]>([]);
  const [form] = Form.useForm();
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentPoll) {
      fetchResults(currentPoll.id);
      if (currentPoll.questions.length > 0) {
        setSelectedQuestionId(currentPoll.questions[0].id);
      }
    }
  }, [currentPoll?.id]);

  useEffect(() => {
    if (currentPoll?.questions && currentPoll.questions.length > 0 && !selectedQuestionId) {
      setSelectedQuestionId(currentPoll.questions[0].id);
    }
  }, [currentPoll?.questions]);

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'single':
        return '单选题';
      case 'multiple':
        return '多选题';
      case 'rating':
        return '评分题';
      default:
        return '';
    }
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleClosePoll = async () => {
    if (!currentPoll) return;
    Modal.confirm({
      title: '确认关闭投票',
      content: '关闭后将无法再接收新的投票，确定要关闭吗？',
      okText: '确认关闭',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await closePoll(currentPoll.id);
        message.success('投票已关闭');
      },
    });
  };

  const handleAddQuestion = async () => {
    try {
      const values = await form.validateFields();
      if (!currentPoll) return;

      const questionData: any = {
        type: values.type,
        title: values.title,
      };

      if (values.type === 'single' || values.type === 'multiple') {
        questionData.options = values.options.filter((opt: string) => opt.trim());
      }

      await addQuestion(currentPoll.id, questionData);
      message.success('题目已添加');
      setIsAddModalOpen(false);
      form.resetFields();

      setTimeout(() => {
        fetchResults(currentPoll.id);
      }, 500);
    } catch (error) {
      console.error('Add question failed:', error);
    }
  };

  const handleExportCSV = () => {
    if (!currentPoll || !currentResults) return;

    let csvContent = '\uFEFF';
    csvContent += `投票标题: ${currentPoll.title}\n`;
    csvContent += `短码: ${currentPoll.shortCode}\n`;
    csvContent += `总参与人数: ${currentResults.totalVotes}\n\n`;

    currentPoll.questions.forEach((q) => {
      const result = currentResults.results[q.id];
      csvContent += `题目: ${q.title} (${getQuestionTypeLabel(q.type)})\n`;

      if (q.type === 'single' || q.type === 'multiple') {
        csvContent += '选项,票数\n';
        q.options?.forEach((opt) => {
          csvContent += `${opt},${result?.data[opt] || 0}\n`;
        });
      } else if (q.type === 'rating') {
        csvContent += '分数,票数\n';
        for (let i = 1; i <= 10; i++) {
          csvContent += `${i},${result?.data[i] || 0}\n`;
        }
        csvContent += `平均分,${result?.average || 0}\n`;
      }
      csvContent += '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${currentPoll.title}_结果.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    message.success('导出成功');
  };

  const copyShortCode = () => {
    if (currentPoll) {
      navigator.clipboard.writeText(currentPoll.shortCode);
      message.success('短码已复制');
    }
  };

  if (!currentPoll) return null;

  return (
    <div className="fade-in" ref={resultsRef}>
      <div className="page-header">
        <h1 className="page-title">{currentPoll.title}</h1>
        <div className="page-actions">
          {!currentPoll.closed && (
            <>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsAddModalOpen(true)}
                style={{ borderRadius: 20 }}
              >
                添加题目
              </Button>
              <Button
                danger
                icon={<StopOutlined />}
                onClick={handleClosePoll}
                style={{ borderRadius: 20 }}
              >
                关闭投票
              </Button>
            </>
          )}
          <button className="btn-secondary" onClick={handleExportCSV}>
            <DownloadOutlined />
            导出 CSV
          </button>
        </div>
      </div>

      <div className="short-code-banner" onClick={copyShortCode}>
        <div>
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>投票短码（点击复制）</div>
          <div className="short-code-text">{currentPoll.shortCode}</div>
        </div>
        <div className="short-code-copy">
          <CopyOutlined style={{ marginRight: 4 }} />
          复制链接
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-left">
          <div style={{ fontSize: 14, fontWeight: '500', marginBottom: 12, color: '#333' }}>
            题目列表
            <span style={{ float: 'right', color: '#999', fontWeight: 'normal', fontSize: 13 }}>
              {currentResults?.totalVotes || 0} 人参与
            </span>
          </div>
          {currentPoll.questions.map((q, index) => (
            <div
              key={q.id}
              className={`question-list-item ${selectedQuestionId === q.id ? 'selected' : ''} ${newQuestionIds.includes(q.id) ? 'new-question-highlight' : ''}`}
              onClick={() => setSelectedQuestionId(q.id)}
            >
              <span className={`question-type-tag ${q.type}`}>
                {getQuestionTypeLabel(q.type)}
              </span>
              <div style={{ fontSize: 13, color: '#333' }}>
                {index + 1}. {q.title}
              </div>
            </div>
          ))}
        </div>

        <div className="detail-right chart-panel">
          {currentResults && selectedQuestionId && (() => {
            const question = currentPoll.questions.find((q) => q.id === selectedQuestionId);
            const result = currentResults.results[selectedQuestionId];
            if (!question || !result) return null;
            return <ChartPanel question={question} result={result} />;
          })()}
          
          <div className="last-update">
            最后更新: {formatTime(lastUpdateTime)}
          </div>
        </div>
      </div>

      <Modal
        title="添加题目"
        open={isAddModalOpen}
        onOk={handleAddQuestion}
        onCancel={() => setIsAddModalOpen(false)}
        okText="添加"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="type"
            label="题目类型"
            rules={[{ required: true, message: '请选择题目类型' }]}
            initialValue="single"
          >
            <Select>
              <Option value="single">单选题</Option>
              <Option value="multiple">多选题</Option>
              <Option value="rating">评分题 (1-10分)</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="题目标题"
            rules={[{ required: true, message: '请输入题目标题' }]}
          >
            <Input placeholder="请输入题目标题" />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              if (type === 'single' || type === 'multiple') {
                return (
                  <Form.List
                    name="options"
                    rules={[
                      {
                        validator: async (_, options) => {
                          if (!options || options.filter((o: string) => o.trim()).length < 2) {
                            return Promise.reject(new Error('至少需要2个选项'));
                          }
                        },
                      },
                    ]}
                    initialValue={['选项1', '选项2']}
                  >
                    {(fields, { add, remove }) => (
                      <>
                        <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 14 }}>
                          选项
                        </div>
                        {fields.map((field, index) => (
                          <div key={field.key} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <Form.Item
                              {...field}
                              validateTrigger={['onChange', 'onBlur']}
                              rules={[{ required: true, message: '请输入选项' }]}
                              style={{ flex: 1, marginBottom: 0 }}
                            >
                              <Input placeholder={`选项 ${index + 1}`} />
                            </Form.Item>
                            {fields.length > 2 && (
                              <Button
                                type="text"
                                danger
                                onClick={() => remove(field.name)}
                                icon={null}
                              >
                                删除
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                          添加选项
                        </Button>
                      </>
                    )}
                  </Form.List>
                );
              }
              return null;
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default PollDetail;
