import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Meme } from '../types';
import axios from 'axios';
import { saveAs } from 'file-saver';

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const [meme, setMeme] = useState<Meme | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios.get(`/api/memes/${id}`).then((res) => {
      setMeme(res.data);
      setLiked(res.data.liked || false);
      setLikeCount(res.data.likes || 0);
    }).catch(() => {
      setMeme(null);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleLike = useCallback(async () => {
    if (!id) return;
    try {
      const res = await axios.post(`/api/memes/${id}/like`);
      setLiked(res.data.liked);
      setLikeCount(res.data.likes);
    } catch {
      // ignore
    }
  }, [id]);

  const handleDownload = useCallback(async () => {
    if (!meme) return;
    setDownloading(true);
    try {
      const response = await axios.get(meme.imageUrl, {
        responseType: 'blob',
      });
      saveAs(response.data, `${meme.name || 'meme'}.png`);
    } catch {
      try {
        const response = await fetch(meme.imageUrl);
        const blob = await response.blob();
        saveAs(blob, `${meme.name || 'meme'}.png`);
      } catch {
        const a = document.createElement('a');
        a.href = meme.imageUrl;
        a.download = `${meme.name || 'meme'}.png`;
        a.click();
      }
    }
    setDownloading(false);
  }, [meme]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <span className="spin" style={{ fontSize: 36 }}>⏳</span>
      </div>
    );
  }

  if (!meme) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
        <p style={{ fontSize: 18 }}>未找到该表情包 😢</p>
        <Link to="/" style={{ color: '#54a0ff', textDecoration: 'none', marginTop: 12, display: 'inline-block' }}>
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 800,
      margin: '0 auto',
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: 500,
      }}>
        <img
          src={meme.imageUrl}
          alt={meme.name}
          style={{
            width: '100%',
            display: 'block',
          }}
        />
      </div>

      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 24,
        width: '100%',
        maxWidth: 500,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{meme.name}</h1>

        <div style={{ fontSize: 13, color: '#999', marginBottom: 12 }}>
          作者：{meme.author || '匿名'}
        </div>

        {meme.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {meme.tags.map((tag) => (
              <Link
                key={tag}
                to={`/?tag=${encodeURIComponent(tag)}`}
                style={{
                  background: '#e0eaf5',
                  color: '#54a0ff',
                  padding: '3px 12px',
                  borderRadius: 12,
                  fontSize: 12,
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#d0daf0')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#e0eaf5')}
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          borderTop: '1px solid #f0f0f0',
          paddingTop: 16,
        }}>
          <button
            onClick={handleLike}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              fontSize: 16,
              cursor: 'pointer',
              color: liked ? '#ff4757' : '#ccc',
              transition: 'color 0.2s, transform 0.2s',
              padding: '8px 16px',
              borderRadius: 8,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {liked ? '❤️' : '🤍'} {likeCount}
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#54a0ff',
              color: '#fff',
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              cursor: downloading ? 'not-allowed' : 'pointer',
              padding: '8px 20px',
              borderRadius: 8,
              transition: 'background 0.2s',
              opacity: downloading ? 0.7 : 1,
            }}
          >
            {downloading ? <span className="spin">⏳</span> : '⬇️'} 下载 ({meme.downloads})
          </button>
        </div>
      </div>
    </div>
  );
}
