import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Lightbulb } from 'lucide-react';
import { ideaApi } from '../utils/api';
import type { Idea, SortType } from '../types';
import IdeaCard from './创意卡片组件';
import TrendingList from '../components/热度排行榜';
import styles from './创意广场容器.module.css';

const IdeaSquare: React.FC = () => {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [sort, setSort] = useState<SortType>('hot');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ideaApi.getList({ sort, q: searchQuery });
      setIdeas(data.items);
      setAnimKey(prev => prev + 1);
    } catch (e) {
      console.error('Failed to fetch ideas:', e);
    } finally {
      setLoading(false);
    }
  }, [sort, searchQuery]);

  const fetchTrending = useCallback(async () => {
    try {
      const data = await ideaApi.getTrending();
      setTrending(data);
    } catch (e) {
      console.error('Failed to fetch trending:', e);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  const handleSortChange = (newSort: SortType) => {
    if (newSort !== sort) {
      setSort(newSort);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Lightbulb size={28} />
          创意孵化器
        </div>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="搜索创意标题、标签..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </header>

      <div className={styles.sortBar}>
        <span className={styles.sortLabel}>排序：</span>
        <div className={styles.sortTabs}>
          <button
            className={`${styles.sortTab} ${sort === 'hot' ? styles.active : ''}`}
            onClick={() => handleSortChange('hot')}
          >
            🔥 热度
          </button>
          <button
            className={`${styles.sortTab} ${sort === 'latest' ? styles.active : ''}`}
            onClick={() => handleSortChange('latest')}
          >
            🆕 最新
          </button>
          <button
            className={`${styles.sortTab} ${sort === 'random' ? styles.active : ''}`}
            onClick={() => handleSortChange('random')}
          >
            🎲 随机
          </button>
        </div>
      </div>

      <div className={styles.mainContent}>
        <aside className={styles.sidebar}>
          <TrendingList items={trending} />
        </aside>

        <main>
          {loading ? (
            <div className={styles.loading}>加载中...</div>
          ) : ideas.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🌟</div>
              <p>暂无相关创意</p>
            </div>
          ) : (
            <div key={animKey} className={styles.ideasGrid}>
              {ideas.map((idea, index) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  index={index}
                  searchQuery={searchQuery}
                  onClick={() => navigate(`/ideas/${idea.id}`)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default IdeaSquare;
