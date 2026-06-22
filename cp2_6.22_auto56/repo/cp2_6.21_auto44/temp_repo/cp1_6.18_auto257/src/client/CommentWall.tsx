import { useEffect, useRef } from 'react';
import { useBookStore } from './store';
import type { Comment } from '../shared/types';

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 58%)`;
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function CommentItem({ comment }: { comment: Comment }) {
  const color = hashColor(comment.username);
  const initial = comment.username.slice(0, 1);

  return (
    <article className="comment-item" key={comment.id}>
      <div className="avatar" style={{ backgroundColor: color }} aria-hidden>
        {initial}
      </div>
      <div className="comment-body">
        <div className="comment-meta">
          <span className="comment-username">{comment.username}</span>
          <span className="comment-book-tag" title={`《${comment.bookTitle}》`}>
            《{comment.bookTitle}》
          </span>
          <time className="comment-time" dateTime={new Date(comment.timestamp).toISOString()}>
            {formatTime(comment.timestamp)}
          </time>
        </div>
        <p className="comment-text">{comment.content}</p>
      </div>
    </article>
  );
}

export default function CommentWall() {
  const comments = useBookStore((s) => s.comments);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(comments.length);

  useEffect(() => {
    if (comments.length > prevLen.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevLen.current = comments.length;
  }, [comments.length]);

  return (
    <div className="wall-wrapper" aria-label="热评墙">
      <div className="wall-header">
        <div className="wall-title">热 评 墙</div>
        <div className="wall-count">共 {comments.length} 条实时评论</div>
      </div>
      <div className="wall-scroll" ref={scrollRef}>
        {comments.length === 0 ? (
          <div className="empty-wall">发表第一条评论，开启阅读对话 ✨</div>
        ) : (
          comments
            .slice()
            .reverse()
            .map((c) => <CommentItem key={c.id} comment={c} />)
        )}
      </div>
    </div>
  );
}
