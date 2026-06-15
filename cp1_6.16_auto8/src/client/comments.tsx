import { useEffect, useRef, useState } from 'react';

interface CommentsPanelProps {
  episodeId: string;
  wsOn: (type: string, handler: (data: unknown) => void) => void;
}

interface CommentData {
  id: string;
  author: string;
  avatarColor: string;
  content: string;
  timestamp: number;
}

export default function Comments({ episodeId, wsOn }: CommentsPanelProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/comments?episodeId=${episodeId}`)
      .then((r) => r.json())
      .then(setComments);
  }, [episodeId]);

  useEffect(() => {
    wsOn('comment', (data) => {
      const c = data as CommentData;
      setComments((prev) => [...prev, c]);
    });
  }, [wsOn]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !content.trim()) return;
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: author.trim(), content: content.trim(), episodeId }),
    });
    setContent('');
  };

  const formatTs = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="comments-panel">
      <h3 className="panel-title">💬 实时评论</h3>
      <div className="comments-list" ref={listRef}>
        {comments.map((c, i) => (
          <div
            key={c.id}
            className="comment-card"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="comment-avatar" style={{ backgroundColor: c.avatarColor }}>
              {c.author[0]}
            </div>
            <div className="comment-body">
              <div className="comment-meta">
                <span className="comment-author">{c.author}</span>
                <span className="comment-time">{formatTs(c.timestamp)}</span>
              </div>
              <div className="comment-content">{c.content}</div>
            </div>
          </div>
        ))}
      </div>
      <form className="comment-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="你的昵称"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="input-author"
        />
        <div className="input-row">
          <input
            type="text"
            placeholder="说点什么..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input-content"
          />
          <button type="submit" className="submit-btn">发送</button>
        </div>
      </form>
    </div>
  );
}
