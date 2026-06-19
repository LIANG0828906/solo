import { useState } from 'react';
import { motion } from 'framer-motion';
import { GameBoard } from '../components/GameBoard';
import { CollectionPage } from './CollectionPage';

type Tab = 'game' | 'collection';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('game');

  return (
    <div className="min-h-screen">
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 p-1 rounded-full glass-bg border border-white/10">
        <button
          onClick={() => setActiveTab('game')}
          className={`px-5 py-2 rounded-full font-medium text-sm transition-all ${
            activeTab === 'game'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
              : 'text-white/60 hover:text-white'
          }`}
        >
          合成
        </button>
        <button
          onClick={() => setActiveTab('collection')}
          className={`px-5 py-2 rounded-full font-medium text-sm transition-all ${
            activeTab === 'collection'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
              : 'text-white/60 hover:text-white'
          }`}
        >
          图鉴
        </button>
      </nav>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="pt-16"
      >
        {activeTab === 'game' ? <GameBoard /> : <CollectionPage />}
      </motion.div>
    </div>
  );
}
