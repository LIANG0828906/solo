import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import { VoteOption, VoteCreateData } from '../types';

const VoteCreator: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<VoteOption[]>([
    { id: uuidv4(), name: '', description: '', order: 0 },
    { id: uuidv4(), name: '', description: '', order: 1 },
  ]);

  const addOption = useCallback(() => {
    setOptions((prev) => [
      ...prev,
      { id: uuidv4(), name: '', description: '', order: prev.length },
    ]);
  }, []);

  const removeOption = useCallback((id: string) => {
    setOptions((prev) => {
      if (prev.length <= 2) return prev;
      const filtered = prev.filter((opt) => opt.id !== id);
      return filtered.map((opt, index) => ({ ...opt, order: index }));
    });
  }, []);

  const handleOptionChange = useCallback(
    (id: string, field: keyof VoteOption, value: string) => {
      setOptions((prev) =>
        prev.map((opt) => (opt.id === id ? { ...opt, [field]: value } : opt))
      );
    },
    []
  );

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    setOptions((prev) => {
      const items = Array.from(prev);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination!.index, 0, reorderedItem);
      return items.map((opt, index) => ({ ...opt, order: index }));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('请输入投票标题');
      return;
    }

    const validOptions = options.filter((opt) => opt.name.trim() !== '');
    if (validOptions.length < 2) {
      alert('至少需要2个有名称的选项');
      return;
    }

    const payload: VoteCreateData = {
      title: title.trim(),
      description: description.trim(),
      options: options.map((opt) => ({
        ...opt,
        name: opt.name.trim(),
        description: opt.description.trim(),
      })),
    };

    try {
      const res = await axios.post('/api/votes', payload);
      navigate(`/vote/${res.data.voteId}`);
    } catch (err: any) {
      alert(err.response?.data?.message || '创建投票失败，请重试');
    }
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: 800,
    margin: '0 auto',
    padding: '40px 20px',
  };

  const titleStyle: React.CSSProperties = {
    color: '#1a365d',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  };

  const subtitleStyle: React.CSSProperties = {
    color: '#4a5568',
    marginBottom: 32,
  };

  const cardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 8,
    fontWeight: 600,
    color: '#2d3748',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 14,
    boxSizing: 'border-box',
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: 80,
    resize: 'vertical',
  };

  const optionCardStyle: React.CSSProperties = {
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    background: '#fafbfc',
    cursor: 'grab',
  };

  const optionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  };

  const optionTitleStyle: React.CSSProperties = {
    fontWeight: 600,
    color: '#2d3748',
  };

  const removeBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#e53e3e',
    cursor: 'pointer',
    fontWeight: 500,
    padding: '4px 8px',
    borderRadius: 4,
  };

  const addBtnStyle: React.CSSProperties = {
    background: '#e6f2ff',
    color: '#2b6cb0',
    border: 'none',
    padding: '10px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 500,
    width: '100%',
    marginBottom: 20,
  };

  const submitBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: 14,
    background: 'linear-gradient(135deg, #3182ce, #2b6cb0)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.2s',
  };

  const mobileStyle = `
    @media (max-width: 768px) {
      .vote-creator-container {
        padding: 20px 12px !important;
      }
      .option-card {
        padding: 12px !important;
      }
    }
  `;

  return (
    <div style={containerStyle} className="vote-creator-container">
      <style>{mobileStyle}</style>
      <h1 style={titleStyle}>创建新投票</h1>
      <p style={subtitleStyle}>设置投票标题、描述和选项，可拖拽调整选项顺序</p>

      <form onSubmit={handleSubmit}>
        <div style={cardStyle}>
          <label style={labelStyle}>投票标题</label>
          <input
            type="text"
            style={inputStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入投票标题"
          />

          <div style={{ height: 20 }} />

          <label style={labelStyle}>投票描述</label>
          <textarea
            style={textareaStyle}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请输入投票描述（可选）"
          />
        </div>

        <div style={cardStyle}>
          <label style={{ ...labelStyle, marginBottom: 16 }}>投票选项（拖拽排序）</label>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="options">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {options.map((option, index) => (
                    <Draggable key={option.id} draggableId={option.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...optionCardStyle,
                            ...provided.draggableProps.style,
                            background: snapshot.isDragging ? '#ebf8ff' : '#fafbfc',
                          }}
                          className="option-card"
                        >
                          <div style={optionHeaderStyle}>
                            <span style={optionTitleStyle}>选项 {index + 1}</span>
                            {options.length > 2 && (
                              <button
                                type="button"
                                style={removeBtnStyle}
                                onClick={() => removeOption(option.id)}
                              >
                                删除
                              </button>
                            )}
                          </div>

                          <label style={labelStyle}>选项名称</label>
                          <input
                            type="text"
                            style={inputStyle}
                            value={option.name}
                            onChange={(e) => handleOptionChange(option.id, 'name', e.target.value)}
                            placeholder="请输入选项名称"
                          />

                          <div style={{ height: 12 }} />

                          <label style={labelStyle}>选项描述</label>
                          <textarea
                            style={textareaStyle}
                            value={option.description}
                            onChange={(e) =>
                              handleOptionChange(option.id, 'description', e.target.value)
                            }
                            placeholder="请输入选项描述（可选）"
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <button type="button" style={addBtnStyle} onClick={addOption}>
            + 添加选项
          </button>
        </div>

        <button
          type="submit"
          style={submitBtnStyle}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          创建投票
        </button>
      </form>
    </div>
  );
};

export default VoteCreator;
