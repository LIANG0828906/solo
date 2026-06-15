import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchMemes } from '../api';
import { Meme } from '../types';

function MemeCard({ meme, isNew }: { meme: Meme; isNew: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const width = 200 + Math.random() * 100;
  const height = 200 + Math.random() * 150;

  return (
    <Link
      to={`/meme/${meme.id}`}
      className={isNew ? 'fade-in' : ''}
      style={{
        display: 'block',
        width,
        marginBottom: 16,
        breakInside: 'avoid',
        background: '#fff',
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.25s, transform 0.25s',
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          width: '100%',
          height,
          background: loaded ? 'transparent' : '#e0eaf5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {!loaded && (
          <span className="spin" style={{ fontSize: 24, color: '#54a0ff' }}>⏳</span>
        )}
        <img
          src={meme.imageUrl}
          alt={meme.name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: loaded ? 'block' : 'none',
            transition: 'opacity 0.3s',
          }}
        />
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {meme.name}
        </div>
        <div style={{ fontSize: 11, color: '#999', marginTop: 4, display: 'flex', gap: 8 }}>
          <span>❤️ {meme.likes}</span>
          <span>⬇️ {meme.downloads}</span>
        </div>
      </div>
    </Link>
  );
}

export default function MasonryWall() {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const tag = searchParams.get('tag') || undefined;
  const observerRef = useRef<HTMLDivElement>(null);
  const newestIdRef = useRef<string | null>(null);

  const loadMemes = useCallback(async (p: number, t?: string) => {
    setLoading(true);
    try {
      const data = await fetchMemes(p, 20, t);
      if (p === 1) {
        setMemes(data.memes);
        if (data.memes.length > 0) {
          newestIdRef.current = data.memes[0].id;
        }
      } else {
        setMemes((prev) => [...prev, ...data.memes]);
      }
      setTotal(data.total);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setPage(1);
    loadMemes(1, tag);
  }, [tag, loadMemes]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && memes.length < total) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadMemes(nextPage, tag);
        }
      },
      { threshold: 0.1 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loading, memes.length, total, page, tag, loadMemes]);

  return (
    <div style={{ padding: '24px 24px 48px', maxWidth: 1200, margin: '0 auto' }}>
      {tag && (
        <div style={{ marginBottom: 16, fontSize: 14, color: '#666' }}>
          标签筛选：<span style={{ background: '#54a0ff', color: '#fff', padding: '2px 10px', borderRadius: 12 }}>{tag}</span>
          <Link to="/" style={{ marginLeft: 8, color: '#ff9f43', textDecoration: 'none' }}>清除</Link>
        </div>
      )}
      <div
        style={{
          columnCount: 4,
          columnGap: 16,
        }}
      >
        {memes.map((meme, idx) => (
          <MemeCard
            key={meme.id}
            meme={meme}
            isNew={idx === 0 && meme.id === newestIdRef.current}
          />
        ))}
      </div>
      {loading && (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <span className="spin" style={{ fontSize: 28 }}>⏳</span>
        </div>
      )}
      <div ref={observerRef} style={{ height: 1 }} />
      {!loading && memes.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: '#999', fontSize: 16 }}>
          还没有表情包，点击右上角"新建"来创建第一个吧！🎨
        </div>
      )}
    </div>
  );
}
