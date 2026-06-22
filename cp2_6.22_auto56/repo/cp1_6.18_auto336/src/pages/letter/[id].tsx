import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useLetterStore } from '@/store';
import { formatDate } from '@/utils/time';
import HeartIcon from '@/components/HeartIcon';
import BookIcon from '@/components/BookIcon';
import type { Letter, FavoriteResponse } from '@/types';

export default function LetterDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { favorites, toggleFavorite, initFavorites } = useLetterStore();

  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFontFamily = (f: string) => {
    switch (f) {
      case '楷体':
        return 'var(--font-kaiti)';
      case '宋体':
        return 'var(--font-songti)';
      case '仿宋':
        return 'var(--font-fangsong)';
      default:
        return 'var(--font-kaiti)';
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchFavorites = async () => {
      try {
        const res = await fetch('/api/favorites');
        const data = await res.json();
        if (data.ids) initFavorites(data.ids);
      } catch (err) {
        console.error('Failed to fetch favorites:', err);
      }
    };
    fetchFavorites();
  }, [id, initFavorites]);

  useEffect(() => {
    if (!id) return;

    const fetchLetter = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/letters?limit=100`);
        const data = await res.json();
        const found = data.letters.find((l: Letter) => l.id === Number(id));
        if (found) {
          setLetter(found);
        } else {
          setError('未找到该信笺');
        }
      } catch (err) {
        setError('加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchLetter();
  }, [id]);

  const handleFavorite = async () => {
    if (!letter) return;
    setHeartAnimating(true);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letterId: letter.id }),
      });
      const data: FavoriteResponse = await res.json();
      toggleFavorite(letter.id, data.favoritesCount);
      setLetter({ ...letter, favoritesCount: data.favoritesCount });
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    } finally {
      setTimeout(() => setHeartAnimating(false), 300);
    }
  };

  if (loading) {
    return (
      <div style