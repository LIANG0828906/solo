import { useState, useRef } from 'react';
import { usePollStore } from '../pollStore';
import { PlusOutlined, DeleteOutlined, HolderOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { message } from 'antd';
import type { QuestionType, Question } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface PollFormProps {
  onCreated: () => void;
}

interface FormQuestion {
  id: string;
  type: QuestionType;
  title: string;
  options: string[];
}

function PollForm({ onCreated }: PollFormProps) {
  const { createPoll } = usePollStore();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<FormQuestion[]>([
    { id: uuidv4(), type: 'single', title: '', options: ['选项1', '选项2'] },
  ]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);

  const addQuestion = () => {
    const newQ: FormQuestion = {
      id: uuidv4(),
      type: 'single',
      title: '',
      options: ['选项1', '选项2'],
    };
    setQuestions([...questions, newQ]);
  };

  const deleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      message.warning('至少保留一个题目');
      return;
    }
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<FormQuestion>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const addOption = (questionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, options: [...q.options, `选项${q.options.length + 1}`] }
          : q
      )
    );
  };

  const updateOption = (questionId: string, index: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.map((opt, i) => (i === index ? value : opt)) }
          : q
      )
    );
  };

  const deleteOption = (questionId: string, index: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.filter((_, i) => i !== index) }
          : q
      )
    );
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    dragItemRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = dragItemRef.current;
    if (dragIndex === null || dragIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newQuestions = [...questions];
    const [removed] = newQuestions.splice(dragIndex, 1);
    newQuestions.splice(dropIndex, 0, removed);
    setQuestions(newQuestions);

    setDraggedIndex(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      message.error('请输入投票标题');
      return;
    }

    const validQuestions = questions.filter((q) => q.title.trim());
    if (validQuestions.length === 0) {
      message.error('至少需要一个有效题目');
      return;
    }

    for (const q of validQuestions) {
      if (q.type === 'single' || q.type === 'multiple') {
        const validOptions = q.options.filter((o) => o.trim());
        if (validOptions.length < 2) {
          message.error('每个选择题至少需要2个有效选项');
          return;
        }
      }
    }

    const questionsData = validQuestions.map((q) => ({
      type: q.type,
      title: q.title,
      ...((q.type === 'single' || q.type === 'multiple') && {
        options: q.options.filter((o) => o.trim()),
      }),
    })) as Omit<Question, 'id'>[];

    const result = await createPoll(title, questionsData);
    if (result) {
      message.success('投票创建成功');
      onCreated();
    } else {
      message.error('创建失败，请重试');
    }
  };

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

  return (
    <div className="form-container fade-in">
      <div className="page-header">
        <h1 className="page-title">
          <ArrowLeftOutlined
            style={{ fontSize: 18, marginRight: 12, cursor: 'pointer', color: '#666' }}
            onClick={onCreated}
          />
          创建投票
        </h1>
      </div>

      <div className="form-card">
        <label className="form-label">投票标题</label>
        <input
          className="form-input"
          placeholder="请输入投票标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 16, fontSize: 14, fontWeight: '500', color: '#333' }}>
        题目列表（拖拽调整顺序）
      </div>

      {questions.map((q, index) => (
        <div
          key={q.id}
          className={`question-card ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
        >
          <div className="question-card-header">
            <HolderOutlined className="drag-handle" />
            <div className="question-number">{index + 1}</div>
            <select
              className="question-type-select"
              value={q.type}
              onChange={(e) => updateQuestion(q.id, { type: e.target.value as QuestionType })}
            >
              <option value="single">单选题</option>
              <option value="multiple">多选题</option>
              <option value="rating">评分题 (1-10)</option>
            </select>
            <DeleteOutlined
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                deleteQuestion(q.id);
              }}
            />
          </div>
          <input
            className="form-input"
            placeholder="请输入题目标题"
            value={q.title}
            onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
            style={{ marginBottom: 12 }}
          />
          {(q.type === 'single' || q.type === 'multiple') && (
            <>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>选项：</div>
              {q.options.map((opt, optIndex) => (
                <div key={optIndex} className="option-item">
                  <input
                    className="option-input"
                    value={opt}
                    onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                  />
                  {q.options.length > 2 && (
                    <DeleteOutlined
                      style={{ color: '#F44336', cursor: 'pointer', opacity: 0.6 }}
                      onClick={() => deleteOption(q.id, optIndex)}
                    />
                  )}
                </div>
              ))}
              <div className="add-option-btn" onClick={() => addOption(q.id)}>
                <PlusOutlined />
                添加选项
              </div>
            </>
          )}
          {q.type === 'rating' && (
            <div style={{ fontSize: 13, color: '#666', padding: '8px 0' }}>
              评分范围：1 - 10 分
            </div>
          )}
        </div>
      ))}

      <button className="add-question-btn" onClick={addQuestion}>
        <PlusOutlined />
        添加题目
      </button>

      <div className="submit-area">
        <button
          className="btn-secondary"
          onClick={onCreated}
          style={{ background: '#fff', color: '#666', border: '1px solid #E0E0E0' }}
        >
          取消
        </button>
        <button className="btn-primary" onClick={handleSubmit}>
          创建投票
        </button>
      </div>
    </div>
  );
}

export default PollForm;
