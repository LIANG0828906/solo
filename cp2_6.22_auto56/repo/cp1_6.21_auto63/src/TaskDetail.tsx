import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { Task, TeamMember, Comment } from './types';
import { addComment } from './api';

interface TaskDetailProps {
  task: Task;
  members: TeamMember[];
  onClose: () => void;
  onCommentAdded: () => void;
  onTaskUpdated: (task: Task) => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({
  task,
  members,
  onClose,
  onCommentAdded,
  onTaskUpdated
}) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState(members[0]?.id || '');
  const [localComments, setLocalComments] = useState<Comment[]>(task.comments);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localComments]);

  const handleSubmitComment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!commentText.trim() || !selectedAuthor) return;

    setIsSubmitting(true);
    try {
      const newComment = await addComment(task.id, {
        content: commentText,
        authorId: selectedAuthor
      });
      setLocalComments(prev => [...prev, newComment]);
      setCommentText('');
      onCommentAdded();
      const updatedTask = { ...task, comments: [...localComments, newComment] };
      onTaskUpdated(updatedTask);
    } catch (err) {
      console.error('添加评论失败', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200
      }}
      onClick={onClose}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)'
      }} />

      <div
        className="slide-up"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          minHeight: '400px',
          backgroundColor: 'var(--bg-white)',
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-gray)'
        }}>
          <div style={{ flex: 1, marginRight: '16px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '4px'
            }}>
              {task.title}
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '13px',
              color: 'var(--text-muted)'
            }}>
              <span>创建于 {task.createdAt}</span>
              <span>•</span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: task.status === 'todo' ? 'var(--column-todo)' :
                  task.status === 'inProgress' ? 'var(--column-progress)' : 'var(--column-done)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 500
              }}>
                {task.status === 'todo' ? '待办' : task.status === 'inProgress' ? '进行中' : '已完成'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '18px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={20} color="#666" />
          </button>
        </div>

        <div style={{
          display: 'flex',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-gray)',
          gap: '24px'
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '8px'
            }}>
              任务描述
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-primary)',
              lineHeight: 1.6
            }}>
              {task.description || '暂无描述'}
            </p>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: task.assignee.avatarColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
              {task.assignee.name.charAt(0)}
            </div>
            <span style={{
              fontSize: '13px',
              color: 'var(--text-secondary)'
            }}>
              {task.assignee.name}
            </span>
          </div>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 24px',
          minHeight: 0
        }}>
          <h3 style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: '12px'
          }}>
            评论 ({localComments.length})
          </h3>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            paddingRight: '8px'
          }}>
            {localComments.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
                padding: '20px'
              }}>
                暂无评论，快来发表第一条评论吧
              </div>
            ) : (
              localComments.map(comment => (
                <div
                  key={comment.id}
                  style={{
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: comment.author.avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    flexShrink: 0
                  }}>
                    {comment.author.name.charAt(0)}
                  </div>
                  <div style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '2px'
                    }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--text-primary)'
                      }}>
                        {comment.author.name}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)'
                      }}>
                        {comment.createdAt}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          <form onSubmit={handleSubmitComment} style={{ display: 'flex', gap: '12px' }}>
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              style={{
                padding: '0 12px',
                border: '2px solid var(--border-gray)',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: 'white',
                cursor: 'pointer',
                minWidth: '100px',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent-blue)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-gray)'; }}
            >
              {members.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入评论，按回车提交..."
                style={{
                  width: '100%',
                  height: '80px',
                  padding: '12px 44px 12px 16px',
                  border: '2px solid var(--border-gray)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent-blue)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border-gray)'; }}
              />
              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                style={{
                  position: 'absolute',
                  right: '8px',
                  bottom: '8px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: commentText.trim() ? 'var(--accent-blue)' : '#ccc',
                  color: 'white',
                  cursor: commentText.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
