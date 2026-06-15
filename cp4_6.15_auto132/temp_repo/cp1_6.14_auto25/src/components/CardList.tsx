import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { getRecommendUsers, sendHeart, getUser } from '../api';
import { useStore } from '../store/useStore';
import UserCard from './UserCard';
import MatchModal from './MatchModal';
import type { User } from '../types';

const CardList: React.FC = () => {
  const { currentUser, setMatchedUser, setShowMatchModal } = useStore();
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sentHearts, setSentHearts] = useState<Set<string>>(new Set());
  const [excludeIds, setExcludeIds] = useState<string[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const excludeIdsRef = useRef<string[]>([]);

  const loadUsers = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      if (!currentUser || loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);
      try {
        const startTime = Date.now();
        const response = await getRecommendUsers(
          currentUser.id,
          pageNum,
          10,
          reset ? [] : excludeIdsRef.current
        );

        if (pageNum > 1) {
          const elapsed = Date.now() - startTime;
          if (elapsed > 500) {
            console.warn(`推荐列表加载耗时: ${elapsed}ms，超过500ms限制`);
          }
        }

        if (reset) {
          setUsers(response.users);
          const newIds = response.users.map((u) => u.id);
          setExcludeIds(newIds);
          excludeIdsRef.current = newIds;
        } else {
          setUsers((prev) => [...prev, ...response.users]);
          const newIds = [...excludeIdsRef.current, ...response.users.map((u) => u.id)];
          setExcludeIds(newIds);
          excludeIdsRef.current = newIds;
        }
        setHasMore(response.hasMore);
        hasMoreRef.current = response.hasMore;
        pageRef.current = pageNum;
        setPage(pageNum);
      } catch (error) {
        console.error('加载用户失败:', error);
      } finally {
        loadingRef.current = false;
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [currentUser]
  );

  useEffect(() => {
    if (currentUser) {
      pageRef.current = 1;
      setPage(1);
      excludeIdsRef.current = [];
      setExcludeIds([]);
      hasMoreRef.current = true;
      setHasMore(true);
      loadUsers(1, true);
    }
  }, [currentUser, loadUsers]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !loadingRef.current
        ) {
          const nextPage = pageRef.current + 1;
          loadUsers(nextPage);
        }
      },
      { rootMargin: '200px', threshold: 0 }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loadUsers, users]);

  const handleSendHeart = async (toUserId: string) => {
    if (!currentUser || sentHearts.has(toUserId)) return;

    try {
      const response = await sendHeart(currentUser.id, toUserId);
      setSentHearts((prev) => new Set(prev).add(toUserId));

      if (response.isMatch && response.match) {
        const matchedUser = await getUser(toUserId);
        setMatchedUser(matchedUser);
        setShowMatchModal(true);
      }
    } catch (error) {
      console.error('发送心动失败:', error);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-[#FF6B6B] animate-spin" />
        <p className="text-gray-500">正在为您寻找缘分...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4 md:px-6">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FFB26B] flex items-center justify-center">
          <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-white" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">暂无推荐</h2>
        <p className="text-gray-500 max-w-md text-sm md:text-base">
          暂时没有符合您偏好的用户，请稍后再来看看，或者调整您的择偶偏好
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-[#FF6B6B]" />
            为你推荐
          </h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            根据您的择偶偏好，为您精选了{users.length}位优质用户
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              hasSentHeart={sentHearts.has(user.id)}
              onSendHeart={handleSendHeart}
            />
          ))}
        </div>

        <div ref={sentinelRef} className="py-6 md:py-8 flex justify-center min-h-[60px]">
          {loading && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>加载更多...</span>
            </div>
          )}
          {!hasMore && users.length > 0 && (
            <p className="text-gray-400 text-sm">已加载全部推荐</p>
          )}
        </div>
      </div>

      <MatchModal />
    </div>
  );
};

export default CardList;
