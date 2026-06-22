import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { CalendarView } from '@/ui/components/CalendarView';
import { ActivityCard } from '@/ui/components/ActivityCard';
import { CreateActivityModal } from '@/ui/components/CreateActivityModal';
import { getAllBoardgames } from '@/modules/boardgame/BoardgameService';
import { getUpcomingActivitiesForNext7Days, getActivityPlayers } from '@/modules/activity/ActivityService';
import type { Activity, Boardgame, ActivityPlayer } from '@/types';
import styles from './HomePage.module.css';

export function HomePage() {
  const { boardgames, setBoardgames, activities } = useAppStore();
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>([]);
  const [playerCounts, setPlayerCounts] = useState<Record<string, number>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const games = await getAllBoardgames();
        setBoardgames(games);

        const upcoming = await getUpcomingActivitiesForNext7Days();
        setUpcomingActivities(upcoming);

        const counts: Record<string, number> = {};
        for (const activity of upcoming) {
          const players = await getActivityPlayers(activity.id);
          counts[activity.id] = players.length;
        }
        setPlayerCounts(counts);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [setBoardgames, activities]);

  const boardgameMap = useMemo(() => {
    const map = new Map<string, Boardgame>();
    boardgames.forEach((g) => map.set(g.id, g));
    return map;
  }, [boardgames]);

  const handleCreateActivity = () => {
    setShowCreateModal(true);
  };

  const handleJoinActivity = () => {
    navigate('/join');
  };

  const handleActivityCreated = () => {
    setShowCreateModal(false);
    window.location.reload();
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <h1 className={styles.title}>欢迎来到桌游吧</h1>
          <p className={styles.subtitle}>找到你的桌游伙伴，开启精彩对局</p>
        </div>

        <div className={styles.quickActions}>
          <div className={styles.actionCard} onClick={handleCreateActivity}>
            <div className={styles.actionIcon}>🎯</div>
            <div className={styles.actionLabel}>发起活动</div>
          </div>
          <div className={styles.actionCard} onClick={handleJoinActivity}>
            <div className={styles.actionIcon}>🔗</div>
            <div className={styles.actionLabel}>输入邀请码</div>
          </div>
        </div>

        <CalendarView activities={activities} boardgames={boardgames} />
      </div>

      <div className={styles.sidebarContent}>
        <div>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>📅</span>
            即将开始
          </h2>
          {isLoading ? (
            <div className={styles.emptyCard}>
              <div className={styles.emptyIcon}>⏳</div>
              <div className={styles.emptyText}>加载中...</div>
            </div>
          ) : upcomingActivities.length > 0 ? (
            <div className={styles.upcomingList}>
              {upcomingActivities.map((activity, index) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  boardgame={boardgameMap.get(activity.boardgameId)}
                  playerCount={playerCounts[activity.id] || 0}
                  delay={index * 80}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyCard}>
              <div className={styles.emptyIcon}>🎲</div>
              <div className={styles.emptyText}>最近7天暂无活动</div>
              <button className={styles.createBtn} onClick={handleCreateActivity}>
                + 发起活动
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateActivityModal
          boardgames={boardgames}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleActivityCreated}
        />
      )}
    </div>
  );
}
