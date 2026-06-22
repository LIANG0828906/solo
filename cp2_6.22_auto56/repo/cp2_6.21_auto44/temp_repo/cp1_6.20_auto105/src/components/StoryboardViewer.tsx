import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Storyboard, StoryboardCard } from '../types';
import { api } from '../api/client';
import { DetailModal } from './DetailModal';
import { useImageCache } from '../hooks/useImageCache';

interface Props {
  id: string;
  onNavigate: (route: { name: 'editor' | 'list'; id?: string }) => void;
  notify: (msg: string) => void;
}

const AUTO_PLAY_MS = 5000;

export const StoryboardViewer: React.FC<Props> = ({ id, onNavigate, notify }) => {
  const [sb, setSb] = useState<Storyboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [detailCard, setDetailCard] = useState<StoryboardCard | null>(null);
  const [detailIdx, setDetailIdx] = useState(0);
  const { preload, ensure } = useImageCache();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadSent = useRef<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.getStoryboard(id);
        setSb(data);
      } catch (err) {
        notify('加载失败：' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, notify]);

  const cards = useMemo(() => sb?.cards ?? [], [sb]);
  const currentCard = cards[current];

  // 预缓存当前 + 后续4张
  useEffect(() => {
    if (!cards.length) return;
    const urls: string[] = [];
    for (let i = 0; i < 5; i++) {
      const idx = (current + i) % cards.length;
      const url = cards[idx]?.imageUrl;
      if (url && !preloadSent.current.has(url)) {
        urls.push(url);
        preloadSent.current.add(url);
      }
    }
    if (urls.length) preload(urls);
  }, [current, cards, preload]);

  // 自动播放
  useEffect(() => {
    if (!playing || !cards.length) return;
    const t = window.setTimeout(() => {
      setCurrent((c) => (c + 1) % cards.length);
    }, AUTO_PLAY_MS);
    return () => window.clearTimeout(t);
  }, [playing, current, cards.length]);

  // 键盘
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (detailCard) return;
      if (e.key === 'ArrowLeft') setCurrent((c) => (c - 1 + cards.length) % cards.length);
      else if (e.key === 'ArrowRight') setCurrent((c) => (c + 1) % cards.length);
      else if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === 'Escape') onNavigate({ name: 'editor', id });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cards.length, detailCard, onNavigate, id]);

  // 音乐
  useEffect(() => {
    if (!sb?.musicUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }
    try {
      if (!audioRef.current) {
        const a = new Audio(sb.musicUrl);
        a.loop = true;
        a.volume = 0.6;
        audioRef.current = a;
      }
      audioRef.current.src = sb.musicUrl;
      if (playing) {
        const p = audioRef.current.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
    } catch {
      /* ignore */
    }
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [sb?.musicUrl]);

  useEffect(() => {
    if (audioRef.current) {
      if (playing) {
        const p = audioRef.current.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [playing]);

  const goTo = useCallback(
    (i: number) => {
      setCurrent(i);
      const url = cards[i]?.imageUrl;
      if (url) ensure(url);
    },
    [cards, ensure]
  );

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  if (!sb) return <div className="loading-wrap">故事板不存在</div>;

  return (
    <div className="viewer">
      <div className="viewer-controls">
        <button className="ctrl-btn" onClick={() => setPlaying((p) => !p)} title={playing ? '暂停 (Space)' : '播放 (Space)'}>
          {playing ? '⏸' : '▶'}
        </button>
        <button
          className="ctrl-btn"
          title="返回编辑 (ESC)"
          onClick={() => onNavigate({ name: 'editor', id: sb.id })}
        >
          ✎
        </button>
        <button
          className="ctrl-btn"
          title="返回列表"
          onClick={() => onNavigate({ name: 'list' })}
        >
          ✕
        </button>
      </div>

      <button
        className="left-arrow"
        title="上一张 (←)"
        onClick={() => goTo((current - 1 + cards.length) % cards.length)}
      >
        ‹
      </button>
      <button
        className="right-arrow"
        title="下一张 (→)"
        onClick={() => goTo((current + 1) % cards.length)}
      >
        ›
      </button>

      {cards.map((c, i) =>
        i === current ? (
          <div key={c.id} className={`viewer-slide anim-enter-${currentCard?.animation || 'none'}`}>
            <div
              className="slide-img-wrap"
              onClick={() => {
                setDetailCard(c);
                setDetailIdx(i);
              }}
            >
              {c.imageUrl ? (
                <img src={c.imageUrl} alt="" draggable={false} />
              ) : (
                <div className="slide-placeholder">
                  {c.title || `卡片 ${i + 1} · 暂无图片`}
                </div>
              )}
            </div>
            {(c.title || c.description) && (
              <div className="slide-caption">
                {c.title && <h3>{c.title}</h3>}
                {c.description && <p>{c.description}</p>}
              </div>
            )}
          </div>
        ) : null
      )}

      <div className="progress">
        {String(current + 1).padStart(2, '0')} / {String(cards.length).padStart(2, '0')}
      </div>

      <div className="thumbs-bar">
        {cards.map((c, i) => (
          <div
            key={c.id}
            className={`thumb ${i === current ? 'active' : ''}`}
            onClick={() => goTo(i)}
            onMouseEnter={() => c.imageUrl && ensure(c.imageUrl)}
          >
            {c.imageUrl ? <img src={c.imageUrl} alt="" loading="lazy" /> : null}
            <span className="tip">{c.title || `卡片 ${i + 1}`}</span>
          </div>
        ))}
      </div>

      <DetailModal
        card={detailCard}
        index={detailIdx}
        total={cards.length}
        onClose={() => setDetailCard(null)}
      />
    </div>
  );
};
