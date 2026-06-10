import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Award, Scale, BookOpen } from 'lucide-react';
import { CaseList } from './CaseList';
import { CaseDetail } from './CaseDetail';
import { LawBook } from './LawBook';
import { JudgementPanel, AchievementBadge } from './JudgementPanel';
import { useStore } from '@/store';
import type { CaseEntry, LawArticle } from '@/types';

export const Desk: React.FC = () => {
  const { setCases, setLaws, currentCase, unlockedBadges, userScore } = useStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'detail' | 'judgement'>('detail');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [casesRes, lawsRes] = await Promise.all([
          fetch('/api/cases'),
          fetch('/api/laws'),
        ]);
        const casesData: CaseEntry[] = await casesRes.json();
        const lawsData: LawArticle[] = await lawsRes.json();
        setCases(casesData);
        setLaws(lawsData);
      } catch (error) {
        console.error('加載數據失敗:', error);
        const { mockCases } = await import('../../server/data/cases');
        const { mockLaws } = await import('../../server/data/laws');
        setCases(mockCases);
        setLaws(mockLaws);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [setCases, setLaws]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-amber-500"
        >
          <Scale size={48} />
        </motion.div>
        <p className="ml-4 text-amber-400">正在開啟二堂...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2a2a2a]">
      <header className="bg-[#1a1a1a] border-b-2 border-amber-900 px-4 py-3">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="drawer-toggle antique-btn p-2"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Scale className="text-amber-500" size={24} />
              <div>
                <h1 className="text-amber-200 font-bold text-lg">江南蘇州府吳江縣衙</h1>
                <p className="text-amber-500 text-xs">光緒二十六年 春</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {unlockedBadges.length > 0 && (
              <div className="flex items-center gap-2">
                <Award className="text-yellow-500" size={18} />
                <span className="text-xs text-yellow-400">{unlockedBadges.length}</span>
              </div>
            )}
            <div className="text-right">
              <p className="text-amber-400 text-sm font-bold">{userScore} 分</p>
              <p className="text-gray-500 text-xs">考成績分</p>
            </div>
          </div>
        </div>
      </header>

      {unlockedBadges.includes('刑名师爷') && (
        <div className="bg-gradient-to-r from-amber-900/50 via-yellow-900/50 to-amber-900/50 py-2">
          <div className="max-w-[1920px] mx-auto px-4 flex items-center justify-center gap-2">
            <span className="text-2xl">🦄</span>
            <span className="text-amber-300 text-sm">已解鎖「刑名師爺」成就</span>
          </div>
        </div>
      )}

      <main className="max-w-[1920px] mx-auto p-4">
        <div className="hidden 2xl:grid 2xl:grid-cols-[280px_1fr_1fr_380px] gap-4 h-[calc(100vh-120px)]">
          <div className="antique-card p-2 overflow-hidden">
            <CaseList />
          </div>

          <div className="antique-card p-4 overflow-hidden">
            <CaseDetail />
          </div>

          <div className="antique-card p-4 overflow-hidden">
            <LawBook />
          </div>

          <div className="antique-card p-4 overflow-hidden">
            <JudgementPanel />
          </div>
        </div>

        <div className="hidden xl:grid 2xl:hidden xl:grid-cols-[280px_1fr_380px] gap-4 h-[calc(100vh-120px)]">
          <div className="antique-card p-2 overflow-hidden">
            <CaseList />
          </div>

          <div className="flex flex-col gap-4 overflow-hidden">
            <div className="antique-card p-2 overflow-hidden">
              <LawBook isMobile={false} />
            </div>
            
            <div className="antique-card p-2">
              <LawBook isMobile={true} />
            </div>
          </div>

          <div className="antique-card p-4 overflow-hidden">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('detail')}
                className={`flex-1 antique-btn text-xs ${activeTab === 'detail' ? 'antique-btn-primary' : ''}`}
              >
                <BookOpen size={12} className="inline mr-1" />
                案情深處
              </button>
              <button
                onClick={() => setActiveTab('judgement')}
                className={`flex-1 antique-btn text-xs ${activeTab === 'judgement' ? 'antique-btn-primary' : ''}`}
              >
                <Scale size={12} className="inline mr-1" />
                判詞
              </button>
            </div>
            <div className="h-[calc(100%-3rem)] overflow-hidden">
              <AnimatePresence mode="wait">
                {activeTab === 'detail' ? (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="h-full"
                  >
                    <CaseDetail />
                  </motion.div>
                ) : (
                  <motion.div
                    key="judgement"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <JudgementPanel />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="xl:hidden space-y-4">
          <div className="antique-card p-2">
            <LawBook isMobile={true} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="antique-card p-4 h-[500px] overflow-hidden">
              <LawBook />
            </div>

            <div className="space-y-4">
              <div className="antique-card p-4 h-[400px] overflow-hidden">
                {currentCase ? (
                  <CaseDetail />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <p>請從左側選擇案卷</p>
                  </div>
                )}
              </div>

              <div className="antique-card p-4 h-[400px] overflow-hidden">
                <JudgementPanel />
              </div>
            </div>
          </div>

          <AchievementBadge />
        </div>
      </main>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <CaseList 
              isDrawerOpen={drawerOpen} 
              onCloseDrawer={() => setDrawerOpen(false)} 
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
