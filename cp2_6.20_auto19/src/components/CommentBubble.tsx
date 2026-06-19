import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useDocumentStore, Comment } from '../store/useDocumentStore';

dayjs.extend(relativeTime);

interface Props {
  paragraphId: string;
}

export default function CommentBubble({ paragraphId }: Props) {
  const { comments, addComment } = useDocumentStore();
  const list = comments[paragraphId] || [];
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (expanded) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [expanded]);

  const submitComment = () => {
    const content = input.trim();
    if (!content) return;
    const comment: Comment = {
      id: uuid(),
      userId: 'u_001',
      userName: '李译者',
      avatar: 'LZ',
      content,
      createdAt: new Date().toISOString(),
    };
    addComment(paragraphId, comment);
    setInput('');
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitComment();
    }
  };

  return (
    <div className={`comment-bubble ${expanded ? 'expanded' : ''}`}>
      <button
        className="bubble-toggle"
        onClick={() => setExpanded(!expanded)}
        title={list.length > 0 ? `${list.length} 条评论` : '添加评论'}
      >
        <span className="bubble-icon">💬</span>
        {list.length > 0 && <span className="bubble-count">{list.length}</span>}
      </button>

      <div className="comment-panel">
        <div className="comment-panel-header">
          <span>评论讨论</span>
          <button className="icon-btn-small" onClick={() => setExpanded(false)}>✕</button>
        </div>

        <div className="comment-list">
          {list.length === 0 && (
            <div className="comment-empty">暂无评论，添加第一条建议吧～</div>
          )}
          {list.map((c, i) => (
            <div
              key={c.id}
              className="comment-item"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="comment-avatar" title={c.userName}>{c.avatar}</div>
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-name">{c.userName}</span>
                  <span className="comment-time">{dayjs(c.createdAt).fromNow()}</span>
                </div>
                <div className="comment-content">{c.content}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="comment-input-box">
          <textarea
            ref={inputRef}
            className="comment-input"
            placeholder="输入建议或修改意见…（Enter 发送，Shift+Enter 换行）"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={2}
          />
          <button
            className="btn btn-send"
            onClick={submitComment}
            disabled={!input.trim()}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
