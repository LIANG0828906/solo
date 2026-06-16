import React, { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Input,
  Space,
  List,
  InputNumber,
  Checkbox,
  Modal,
  message,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  StarOutlined,
  FileTextOutlined,
  DragOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from '../../store';
import type { Question, QuestionType, QuestionnaireTemplate } from '../../types';

const { TextArea } = Input;

const questionTypeConfig = [
  { type: 'single' as QuestionType, label: '单选题', icon: <CheckCircleOutlined />, color: '#5B8FF9' },
  { type: 'multiple' as QuestionType, label: '多选题', icon: <CheckSquareOutlined />, color: '#5AD8A6' },
  { type: 'rating' as QuestionType, label: '评分题(1-5)', icon: <StarOutlined />, color: '#F6BD16' },
  { type: 'text' as QuestionType, label: '开放文本', icon: <FileTextOutlined />, color: '#5D7092' },
];

const QuestionnaireDesigner: React.FC = () => {
  const { template, setTemplate, addQuestion, updateQuestion, deleteQuestion, reorderQuestions } = useAppStore();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [publishModalVisible, setPublishModalVisible] = useState(false);

  React.useEffect(() => {
    if (!template) {
      const initialTemplate: QuestionnaireTemplate = {
        id: uuidv4(),
        title: '用户满意度调研问卷',
        description: '感谢您抽出宝贵时间参与本次调研，您的反馈对我们非常重要。',
        questions: [],
        createdAt: new Date().toISOString(),
      };
      setTemplate(initialTemplate);
    }
  }, [template, setTemplate]);

  const handleAddQuestion = useCallback((type: QuestionType) => {
    const newQuestion: Question = {
      id: uuidv4(),
      type,
      title: type === 'single' ? '请选择一个选项' : 
             type === 'multiple' ? '请选择多个选项' :
             type === 'rating' ? '请为以下项目评分' : '请输入您的意见',
      options: type === 'single' || type === 'multiple' 
        ? [
            { id: uuidv4(), label: '选项 A' },
            { id: uuidv4(), label: '选项 B' },
            { id: uuidv4(), label: '选项 C' },
          ]
        : undefined,
      required: true,
      order: template?.questions.length || 0,
    };
    addQuestion(newQuestion);
  }, [addQuestion, template?.questions.length]);

  const handleUpdateOption = (questionId: string, optionId: string, label: string) => {
    const question = template?.questions.find(q => q.id === questionId);
    if (question?.options) {
      const newOptions = question.options.map(opt =>
        opt.id === optionId ? { ...opt, label } : opt
      );
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const handleAddOption = (questionId: string) => {
    const question = template?.questions.find(q => q.id === questionId);
    if (question?.options) {
      const newOption = { id: uuidv4(), label: `选项 ${String.fromCharCode(65 + question.options.length)}` };
      updateQuestion(questionId, { options: [...question.options, newOption] });
    }
  };

  const handleDeleteOption = (questionId: string, optionId: string) => {
    const question = template?.questions.find(q => q.id === questionId);
    if (question?.options && question.options.length > 2) {
      const newOptions = question.options.filter(opt => opt.id !== optionId);
      updateQuestion(questionId, { options: newOptions });
    } else {
      message.warning('选择题至少需要2个选项');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newQuestions = [...(template?.questions || [])];
    const draggedItem = newQuestions[draggedIndex];
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedItem);
    
    const reordered = newQuestions.map((q, i) => ({ ...q, order: i }));
    reorderQuestions(reordered);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handlePublish = async () => {
    if (!template || template.questions.length === 0) {
      message.error('请至少添加一道题目');
      return;
    }

    const invalidQuestions = template.questions.filter(q => !q.title.trim());
    if (invalidQuestions.length > 0) {
      message.error('所有题目标题不能为空');
      return;
    }

    try {
      const response = await fetch('/api/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      
      if (response.ok) {
        const savedTemplate = await response.json();
        setTemplate(savedTemplate);
        message.success('问卷发布成功！');
        setPublishModalVisible(false);
        console.log('问卷JSON:', JSON.stringify(savedTemplate, null, 2));
      } else {
        const error = await response.json();
        message.error(error.error || '发布失败');
      }
    } catch (error) {
      message.error('发布失败，请检查后端服务');
    }
  };

  const renderQuestionEditor = (question: Question, index: number) => {
    const typeConfig = questionTypeConfig.find(c => c.type === question.type);
    
    return (
      <Card
        key={question.id}
        className="question-item"
        style={{ 
          marginBottom: 16, 
          borderLeft: `4px solid ${typeConfig?.color}`,
          opacity: draggedIndex === index ? 0.5 : 1,
        }}
        draggable
        onDragStart={() => handleDragStart(index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragEnd={handleDragEnd}
        title={
          <Space>
            <DragOutlined style={{ cursor: 'move', color: '#999' }} />
            <span style={{ color: typeConfig?.color }}>{typeConfig?.icon} {typeConfig?.label}</span>
            <span style={{ color: '#999', fontSize: 12 }}>第 {index + 1} 题</span>
            <Checkbox
              checked={question.required}
              onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
            >
              必答
            </Checkbox>
          </Space>
        }
        extra={
          <Tooltip title="删除题目">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => deleteQuestion(question.id)}
            />
          </Tooltip>
        }
        size="small"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            value={question.title}
            onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
            placeholder="请输入题目标题"
            style={{ fontWeight: 500 }}
          />
          
          {(question.type === 'single' || question.type === 'multiple') && question.options && (
            <List
              size="small"
              dataSource={question.options}
              renderItem={(option, optIndex) => (
                <List.Item
                  key={option.id}
                  actions={[
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteOption(question.id, option.id)}
                    />,
                  ]}
                >
                  <Space>
                    <span style={{ color: '#999', width: 20 }}>{String.fromCharCode(65 + optIndex)}.</span>
                    <Input
                      value={option.label}
                      onChange={(e) => handleUpdateOption(question.id, option.id, e.target.value)}
                      style={{ width: 200 }}
                    />
                  </Space>
                </List.Item>
              )}
            />
          )}

          {(question.type === 'single' || question.type === 'multiple') && (
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => handleAddOption(question.id)}
              style={{ width: 'fit-content' }}
            >
              添加选项
            </Button>
          )}

          {question.type === 'rating' && (
            <Space>
              <span>评分范围：</span>
              <InputNumber min={1} max={5} value={1} disabled />
              <span>至</span>
              <InputNumber min={1} max={5} value={5} disabled />
              <span style={{ color: '#999' }}>（固定为1-5分）</span>
            </Space>
          )}

          {question.type === 'text' && (
            <TextArea
              placeholder="（此处为受访者输入区域预览）"
              disabled
              rows={3}
            />
          )}
        </Space>
      </Card>
    );
  };

  if (!template) return null;

  return (
    <div>
      <Card
        style={{ marginBottom: 16 }}
        title={
          <span style={{ color: '#1890FF', fontWeight: 600 }}>
            <RocketOutlined /> 问卷设计
          </span>
        }
        size="small"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            value={template.title}
            onChange={(e) => setTemplate({ ...template, title: e.target.value })}
            placeholder="问卷标题"
            style={{ fontSize: 16, fontWeight: 600 }}
          />
          <TextArea
            value={template.description}
            onChange={(e) => setTemplate({ ...template, description: e.target.value })}
            placeholder="问卷描述"
            rows={2}
          />
        </Space>
      </Card>

      <div style={{ display: 'flex', gap: 16, minHeight: 400 }}>
        <Card
          style={{ width: 200, flexShrink: 0 }}
          title={
            <span style={{ color: '#1890FF', fontWeight: 600 }}>
              <PlusOutlined /> 题目类型
            </span>
          }
          size="small"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {questionTypeConfig.map((config) => (
              <Button
                key={config.type}
                icon={config.icon}
                onClick={() => handleAddQuestion(config.type)}
                style={{ 
                  width: '100%', 
                  textAlign: 'left',
                  borderColor: config.color,
                  color: config.color,
                }}
                block
              >
                {config.label}
              </Button>
            ))}
          </Space>
        </Card>

        <Card
          style={{ flex: 1 }}
          title={
            <span style={{ color: '#1890FF', fontWeight: 600 }}>
              题目预览区 ({template.questions.length} 道题)
            </span>
          }
          size="small"
          bodyStyle={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}
          extra={
            <Button
              type="primary"
              icon={<RocketOutlined />}
              onClick={() => setPublishModalVisible(true)}
              disabled={template.questions.length === 0}
            >
              发布问卷
            </Button>
          }
        >
          {template.questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
              <PlusOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <p>点击左侧按钮添加题目</p>
            </div>
          ) : (
            template.questions.map((question, index) => renderQuestionEditor(question, index))
          )}
        </Card>
      </div>

      <Card
        style={{ marginTop: 16 }}
        size="small"
        bodyStyle={{ display: 'flex', justifyContent: 'center', padding: '16px 24px' }}
      >
        <Button
          type="primary"
          size="large"
          icon={<RocketOutlined />}
          onClick={() => setPublishModalVisible(true)}
          disabled={template.questions.length === 0}
        >
          发布问卷
        </Button>
      </Card>

      <Modal
        title="确认发布问卷"
        open={publishModalVisible}
        onOk={handlePublish}
        onCancel={() => setPublishModalVisible(false)}
        okText="确认发布"
        cancelText="取消"
      >
        <p>问卷标题：{template.title}</p>
        <p>题目数量：{template.questions.length} 道</p>
        <p>发布后将生成问卷链接供受访者填写。</p>
      </Modal>
    </div>
  );
};

export default QuestionnaireDesigner;
