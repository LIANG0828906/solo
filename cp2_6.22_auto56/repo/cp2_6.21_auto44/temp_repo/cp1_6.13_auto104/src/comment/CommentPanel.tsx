import React, { useState, useRef, useEffect } from 'react';
import { Comment, DiffSegment, User } from '@/types';

interface CommentPanelProps {
  segment: DiffSegment | null;
  comments: Comment[];
  currentUser: User;
  onSubmitComment: (content: string, replyToNickname?: string) => void;
  isSmallScreen: boolean;
  stats: { accepted: number; rejected: number; pending: number; total: number };
}

const CommentPanel: React.FC<CommentPanelProps> = ({
  segment,
  comments,
  currentUser,
  onSubmitComment,
  isSmallScreen,
  stats
}) => {
  const [inputValue, setInputValue] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
  };

  const getInitial = (nickname: string) => {
    if (!nickname) return '?';
    const firstChar = nickname.trim().charAt(0);
    return firstChar.toUpperCase();
  };

  const handleSubmit = () => {
    if (!inputValue.trim() || !segment) return;
    onSubmitComment(inputValue.trim(), replyTo || undefined);
    setInputValue('');
    setReplyTo(null);
  };

  const handleReply = (nickname: string) => {
    setReplyTo(nickname);
    setInputValue(`@${nickname} `);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const val = textareaRef.current.value;
        textareaRef.current.setSelectionRange(val.length, val.length);
      }
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const sortedComments = [...comments].sort((a, b) => b.timestamp - a.timestamp);

  const percentage = (n: number) => stats.total === 0 ? 0 : Math.round((n / stats.total) * 100);

  const panelStyle: React.CSSProperties = isSmallScreen
    ? {
        position: 'fixed',
        left: 20,
        right: 20,
        bottom: isCollapsed ? 'calc(-40% + 56px + 20px)' : 20,
        height: '40%',
        background: '#FFFFFF',
        borderRadius: 16,
        boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }
    : {
        width: 280,
        flexShrink: 0,
        background: '#FFFFFF',
        borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        marginLeft: 16
      };

  return (
    <div style={panelStyle}>
      {/* 头部 */}
      <div style={{
        padding: '14px 18px',
        background: 'linear-gradient(135deg, #4A90D9 0%, #357ABD 100%)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: isSmallScreen ? 'pointer' : 'default'
      }}
        onClick={() => isSmallScreen && setIsCollapsed(!isCollapsed)}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>💬</span>
            校对评论
          </div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
            {segment ? `段落: ${segment.type === 'added' ? '新增' : segment.type === 'removed' ? '删除' : segment.type === 'modified' ? '修改' : '原文'}段` : '请选择差异段'}
          </div>
        </div>
        {isSmallScreen && (
          <div style={{
            fontSize: 18,
            transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}>
            ▼
          </div>
        )}
      </div>

      {/* 统计面板 */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid #F0F0F5',
        background: '#FAFBFD'
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>📊</span> 校对进度
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: '#52C41A', fontWeight: 500 }}>已采纳</span>
            <span style={{ color: '#52C41A', fontWeight: 600 }}>{stats.accepted} · {percentage(stats.accepted)}%</span>
          </div>
          <div style={{ height: 6, background: '#F0F0F5', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${percentage(stats.accepted)}%`,
              background: 'linear-gradient(90deg, #52C41A, #73D13D)',
              borderRadius: 3,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: '#FF4D4F', fontWeight: 500 }}>已拒绝</span>
            <span style={{ color: '#FF4D4F', fontWeight: 600 }}>{stats.rejected} · {percentage(stats.rejected)}%</span>
          </div>
          <div style={{ height: 6, background: '#F0F0F5', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${percentage(stats.rejected)}%`,
              background: 'linear-gradient(90deg, #FF4D4F, #FF7875)',
              borderRadius: 3,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: '#FA8C16', fontWeight: 500 }}>待讨论</span>
            <span style={{ color: '#FA8C16', fontWeight: 600 }}>{stats.pending} · {percentage(stats.pending)}%</span>
          </div>
          <div style={{ height: 6, background: '#F0F0F5', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${percentage(stats.pending)}%`,
              background: 'linear-gradient(90deg, #FA8C16, #FFA940)',
              borderRadius: 3,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      </div>

      {/* 评论列表 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: sortedComments.length > 0 ? '8px 0' : '24px 16px',
        minHeight: isSmallScreen ? 0 : 150
      }}>
        {!segment ? (
          <div style={{
            textAlign: 'center',
            color: '#9CA3AF',
            fontSize: 13,
            padding: '20px 0'
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👆</div>
            点击任意差异段<br />查看或添加评论
          </div>
        ) : sortedComments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#9CA3AF',
            fontSize: 13,
            padding: '20px 0'
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>💭</div>
            暂无评论<br />添加第一条讨论吧
          </div>
        ) : (
          sortedComments.map((comment, index) => (
            <div
              key={comment.id}
              style={{
                padding: '12px 16px',
                borderBottom: index < sortedComments.length - 1 ? '1px solid rgba(200,200,200,0.5)' : 'none',
                animation: 'slide-from-top 0.3s ease-out',
                animationDelay: `${index * 30}ms`,
                animationFillMode: 'backwards'
              }}
            >
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  minWidth: 40,
                  borderRadius: '50%',
                  background: comment.avatarColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}>
                  {getInitial(comment.userNickname)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 4
                  }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1F2937',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      {comment.userNickname}
                      {comment.userId === currentUser.id && (
                        <span style={{
                          fontSize: 10,
                          padding: '1px 6px',
                          background: 'rgba(74,144,217,0.12)',
                          color: '#4A90D9',
                          borderRadius: 10,
                          fontWeight: 500
                        }}>我</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleReply(comment.userNickname)}
                      style={{
                        fontSize: 11,
                        color: '#4A90D9',
                        padding: '2px 8px',
                        borderRadius: 4,
                        opacity: 0.8,
                        fontWeight: 500
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.background = 'rgba(74,144,217,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.8';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      回复
                    </button>
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: '#9CA3AF',
                    marginBottom: 6
                  }}>
                    {formatTimestamp(comment.timestamp)}
                  </div>
                  <div style={{
                    fontSize: 13,
                    color: '#374151',
                    lineHeight: 1.6,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {comment.replyToNickname && (
                      <span style={{ color: '#4A90D9', fontWeight: 500 }}>@{comment.replyToNickname} </span>
                    )}
                    {comment.content.replace(/^@\S+\s+/, comment.replyToNickname ? '' : '')}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 输入区 */}
      {segment && !isCollapsed && (
        <div style={{
          padding: 12,
          borderTop: '1px solid #F0F0F5',
          background: '#FAFBFD'
        }}>
          {replyTo && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 10px',
              background: 'rgba(74,144,217,0.08)',
              borderRadius: 6,
              marginBottom: 8,
              fontSize: 12,
              color: '#4A90D9'
            }}>
              <span>回复 @{replyTo}</span>
              <button
                onClick={() => {
                  setReplyTo(null);
                  setInputValue(v => v.replace(/^@\S+\s+/, ''));
                }}
                style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`输入评论，Ctrl+Enter 发送...`}
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              resize: 'none',
              fontSize: 13,
              lineHeight: 1.5,
              background: '#fff',
              marginBottom: 8
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                background: inputValue.trim() ? 'linear-gradient(135deg, #4A90D9, #357ABD)' : '#D1D5DB',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                boxShadow: inputValue.trim() ? '0 2px 8px rgba(74,144,217,0.3)' : 'none'
              }}
            >
              发送
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentPanel;
