import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  message,
  Space,
} from 'antd';
import {
  MenuOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePollStore } from '../pollStore';
import type { Question } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface SortableItemProps {
  id: string;
  index: number;
  question: Question;
  onDelete: (index: number) => void;
  onUpdate: (index: number, field: string, value: any) => void;
}

const SortableQuestionItem: React.FC<SortableItemProps> = ({
  id,
  index,
  question,
  onDelete,
  onUpdate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  const questionTypeOptions = [
    { label: '单选题', value: 'single' },
    { label: '多选题', value: 'multiple' },
    { label: '评分题', value: 'rating' },
  ];

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className="question-card"
        style={{
          position: 'relative',
          paddingLeft: '40px',
        }}
      >
        <div
          className="drag-handle"
          {...attributes}
          {...listeners}
          style={{
            position: 'absolute',
            left: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '18px',
            color: '#999',
          }}
        >
          <MenuOutlined />
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <Select
            value={question.type}
            onChange={(value) => onUpdate(index, 'type', value)}
            options={questionTypeOptions}
            style={{ width: '120px' }}
            size="small"
          />
          <Input
            value={question.title}
            onChange={(e) => onUpdate(index, 'title', e.target.value)}
            placeholder="请输入题目标题"
            size="small"
            style={{ flex: 1 }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(index)}
            size="small"
          />
        </div>
        {question.type !== 'rating' && (
          <div>
            {(question.options || []).map((opt, optIndex) => (
              <div
                key={optIndex}
                style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}
              >
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#F0F0F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: '#666',
                  }}
                >
                  {String.fromCharCode(65 + optIndex)}
                </span>
                <Input
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...(question.options || [])];
                    newOptions[optIndex] = e.target.value;
                    onUpdate(index, 'options', newOptions);
                  }}
                  placeholder={`选项 ${optIndex + 1}`}
                  size="small"
                />
                {(question.options?.length || 0) > 2 && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    onClick={() => {
                      const newOptions = [...(question.options || [])];
                      newOptions.splice(optIndex, 1);
                      onUpdate(index, 'options', newOptions);
                    }}
                  >
                    删除
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="dashed"
              size="small"
              block
              icon={<PlusOutlined />}
              onClick={() => {
                const newOptions = [...(question.options || []), ''];
                onUpdate(index, 'options', newOptions);
              }}
              style={{ marginTop: '4px' }}
            >
              添加选项
            </Button>
          </div>
        )}
        {question.type === 'rating' && (
          <div style={{ fontSize: '12px', color: '#888' }}>
            评分范围: 1 - 10 分
          </div>
        )}
      </div>
    </div>
  );
};

const PollForm: React.FC = () => {
  const navigate = useNavigate();
  const { createPoll } = usePollStore();
  const [form] = Form.useForm();
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: uuidv4(),
      type: 'single',
      title: '',
      options: ['', ''],
    },
  ]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: uuidv4(),
      type: 'single',
      title: '',
      options: ['', ''],
    };
    setQuestions([...questions, newQuestion]);
  };

  const deleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      message.warning('至少需要保留一个题目');
      return;
    }
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (values: any) => {
    const validQuestions = questions.filter((q) => q.title.trim());
    if (validQuestions.length === 0) {
      message.error('请至少添加一个有标题的题目');
      return;
    }

    for (const q of validQuestions) {
      if (q.type !== 'rating') {
        const validOptions = (q.options || []).filter((o) => o.trim());
        if (validOptions.length < 2) {
          message.error('每个选择题至少需要2个有效选项');
          return;
        }
      }
    }

    const cleanedQuestions = validQuestions.map((q) => {
      if (q.type === 'rating') {
        return { id: q.id, type: q.type, title: q.title };
      }
      return {
        id: q.id,
        type: q.type,
        title: q.title,
        options: (q.options || []).filter((o) => o.trim()),
      };
    });

    try {
      const newPoll = await createPoll(values.title, cleanedQuestions as Question[]);
      message.success('投票创建成功！');
      navigate(`/poll/${newPoll.id}`);
    } catch (err) {
      message.error('创建失败，请重试');
    }
  };

  const activeQuestion = activeId
    ? questions.find((q) => q.id === activeId)
    : null;

  return (
    <div className="fade-in">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          style={{ color: '#3F51B5', marginRight: '16px' }}
        >
          返回
        </Button>
        <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>创建投票</h2>
      </div>

      <Card
        style={{
          maxWidth: '700px',
          margin: '0 auto',
          borderRadius: '8px',
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="投票标题"
            name="title"
            rules={[{ required: true, message: '请输入投票标题' }]}
          >
            <Input
              placeholder="请输入投票/问卷标题"
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <span style={{ fontWeight: 500, fontSize: '14px' }}>
                题目列表（拖拽排序）
              </span>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addQuestion}
                size="small"
                style={{ borderRadius: '20px' }}
              >
                添加题目
              </Button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                {questions.map((question, index) => (
                  <SortableQuestionItem
                    key={question.id}
                    id={question.id}
                    index={index}
                    question={question}
                    onDelete={deleteQuestion}
                    onUpdate={updateQuestion}
                  />
                ))}
              </SortableContext>
              <DragOverlay>
                {activeQuestion ? (
                  <div
                    className="question-card"
                    style={{
                      transform: 'translateY(10px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      opacity: 0.9,
                      paddingLeft: '40px',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '18px',
                        color: '#999',
                      }}
                    >
                      <MenuOutlined />
                    </div>
                    <div style={{ fontWeight: 500, marginBottom: '8px' }}>
                      {activeQuestion.title || '未命名题目'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      {activeQuestion.type === 'single' && '单选题'}
                      {activeQuestion.type === 'multiple' && '多选题'}
                      {activeQuestion.type === 'rating' && '评分题'}
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => navigate('/')}
                style={{ borderRadius: '20px' }}
              >
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{ borderRadius: '20px' }}
              >
                创建投票
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PollForm;
