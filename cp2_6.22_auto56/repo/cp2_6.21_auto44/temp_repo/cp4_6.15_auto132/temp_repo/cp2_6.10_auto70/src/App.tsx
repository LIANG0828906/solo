import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, BookOpen, ShoppingBag, Coins } from 'lucide-react';
import Counter from './components/Counter';
import Book from './components/Book';
import Market from './components/Market';
import { usePawnStore } from './store/pawnStore';

type TabType = 'counter' | 'book' | 'market';

const tabLabels: Record<TabType, { label: string; icon: React.ReactNode }> = {
  counter: { label: '柜台', icon: <Store className="w-5 h-5" /> },
  book: { label: '账册', icon: <BookOpen className="w-5 h-5" /> },
  market: { label: '估衣市', icon: <ShoppingBag className="w-5 h-5" /> }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('counter');
  const { balance, checkDeadPawns, items } = usePawnStore();

  useEffect(() => {
    const checkInterval = setInterval(() => {
      if ('requestIdleCallback' in window) {
        (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
          checkDeadPawns();
        });
      } else {
        checkDeadPawns();
      }
    }, 30000);

    checkDeadPawns();

    return () => clearInterval(checkInterval);
  }, [checkDeadPawns]);

  const pageVariants = {
    initial: {
      opacity: 0,
      filter: 'blur(10px)',
      boxShadow: '0 0 30px rgba(42, 31, 24, 0.8)'
    },
    animate: {
      opacity: 1,
      filter: 'blur(0px)',
      boxShadow: '0 0 0 rgba(42, 31, 24, 0)',
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      filter: 'blur(10px)',
      transition: {
        duration: 0.3
      }
    }
  };

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'counter':
        return <Counter />;
      case 'book':
        return <Book />;
      case 'market':
        return <Market />;
      default:
        return <Counter />;
    }
  }, [activeTab]);

  const activeCount = items.filter(i => i.status === 'active').length;
  const deadCount = items.filter(i => i.status === 'dead').length;

  return (
    <div className="h-screen w-screen bg-[#2a1f18] flex flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-[60%] h-1/2 md:h-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-full md:w-[40%] h-1/2 md:h-full bg-[#f5e6c8] flex flex-col border-l-4 border-[#6b4226]">
        <div className="bg-[#8b5e3c] p-4 border-b-4 border-[#6b4226]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#6b4226] border-2 border-[#d4af37] flex items-center justify-center">
                <span className="text-[#d4af37] font-brush text-xl font-bold">恒</span>
              </div>
              <div>
                <h1 className="text-xl font-brush font-bold text-[#f5e6c8]">恒升当</h1>
                <p className="text-xs text-[#e8d5a3]">清末大栅栏 · 百年字号</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-[#d4af37]">
                <Coins className="w-4 h-4" />
                <span className="text-lg font-bold">{balance}</span>
                <span className="text-xs">文</span>
              </div>
              <p className="text-xs text-[#e8d5a3]">掌柜结余</p>
            </div>
          </div>

          <div className="flex gap-2">
            {(Object.keys(tabLabels) as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab
                    ? 'bg-[#c04040] text-white shadow-lg transform -translate-y-1'
                    : 'bg-[#f5e6c8] text-[#8b5e3c] hover:bg-[#e8d5a3]'
                }`}
              >
                {tabLabels[tab].icon}
                <span>{tabLabels[tab].label}</span>
                {tab === 'book' && activeCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-[#d4af37] text-[#2a1f18] text-xs rounded-full">
                    {activeCount}
                  </span>
                )}
                {tab === 'market' && deadCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-[#c04040] text-white text-xs rounded-full animate-pulse">
                    {deadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-[#f5e6c8]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`info-${activeTab}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full p-4"
            >
              {activeTab === 'counter' && (
                <div className="space-y-4">
                  <div className="bg-[#e8d5a3] rounded-lg p-4 border border-[#8b5e3c]">
                    <h3 className="font-bold text-[#8b5e3c] mb-2 flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      掌柜须知
                    </h3>
                    <ul className="text-sm text-[#6b4226] space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-[#c04040]">•</span>
                        <span>点击<strong>戥</strong>称量物品重量</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#c04040]">•</span>
                        <span>点击<strong>镜</strong>观察物品瑕疵</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#c04040]">•</span>
                        <span>点击<strong>算</strong>拨动算盘估值</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#c04040]">•</span>
                        <span>当本为估值的30%-60%</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#c04040]">•</span>
                        <span>月利2分，当期半年</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-[#e8d5a3] rounded-lg p-4 border border-[#8b5e3c]">
                    <h3 className="font-bold text-[#8b5e3c] mb-2">今日概览</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-[#f5e6c8] p-2 rounded text-center">
                        <div className="text-xs text-[#8b5e3c]">在当物品</div>
                        <div className="text-xl font-bold text-[#c04040]">{activeCount}</div>
                      </div>
                      <div className="bg-[#f5e6c8] p-2 rounded text-center">
                        <div className="text-xs text-[#8b5e3c]">死当物品</div>
                        <div className="text-xl font-bold text-[#c04040]">{deadCount}</div>
                      </div>
                      <div className="bg-[#f5e6c8] p-2 rounded text-center">
                        <div className="text-xs text-[#8b5e3c]">已赎当</div>
                        <div className="text-xl font-bold text-[#50a860]">
                          {items.filter(i => i.status === 'redeemed').length}
                        </div>
                      </div>
                      <div className="bg-[#f5e6c8] p-2 rounded text-center">
                        <div className="text-xs text-[#8b5e3c]">已售出</div>
                        <div className="text-xl font-bold text-[#8b5e3c]">
                          {items.filter(i => i.status === 'sold').length}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#e8d5a3] rounded-lg p-4 border border-[#8b5e3c]">
                    <h3 className="font-bold text-[#8b5e3c] mb-2">估值维度</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#6b4226]">材质</span>
                        <span className="text-[#c04040]">权重 35%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6b4226]">年代</span>
                        <span className="text-[#c04040]">权重 25%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6b4226]">品相</span>
                        <span className="text-[#c04040]">权重 25%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6b4226]">流通性</span>
                        <span className="text-[#c04040]">权重 15%</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-[#8b5e3c] text-center opacity-70">
                    <p>恒升当 · 光绪二十六年 · 大栅栏街</p>
                    <p className="mt-1">公平交易 · 童叟无欺</p>
                  </div>
                </div>
              )}

              {activeTab === 'book' && (
                <div className="h-full flex items-center justify-center text-[#8b5e3c]">
                  <div className="text-center">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-brush">流水账册</p>
                    <p className="text-sm opacity-70 mt-1">左侧表格查看所有交易记录</p>
                    <p className="text-sm opacity-70">点击行可展开当票详情</p>
                  </div>
                </div>
              )}

              {activeTab === 'market' && (
                <div className="h-full flex items-center justify-center text-[#8b5e3c]">
                  <div className="text-center">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-brush">估衣市</p>
                    <p className="text-sm opacity-70 mt-1">死当物品可在此重新标价出售</p>
                    <p className="text-sm opacity-70">建议售价：原当本 + 40% ~ 100%</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default App;
