import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import Board from '@/components/Board';
import MasonryGrid from '@/components/MasonryGrid';
import CategoryTabs from '@/components/CategoryTabs';
import FloatingButton from '@/components/FloatingButton';
import CreateAnnouncementModal from '@/components/CreateAnnouncementModal';

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'announcements' | 'activities'>('announcements');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { fetchActivities, getFilteredActivities, loading, selectedCategory } = useAppStore();

  useEffect(() => {
    fetchActivities(selectedCategory);
  }, [fetchActivities, selectedCategory]);

  const filteredActivities = getFilteredActivities();

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <CategoryTabs />

      <div className="max-w-7xl mx-auto pt-4">
        <div className="flex justify-center mb-6 px-4">
          <div className="inline-flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`
                px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTab === 'announcements'
                  ? 'bg-[#6366f1] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
                }
              `}
            >
              公告板
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`
                px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTab === 'activities'
                  ? 'bg-[#6366f1] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
                }
              `}
            >
              活动广场
            </button>
          </div>
        </div>

        <div className="animate-fade-in">
          {activeTab === 'announcements' ? (
            <Board />
          ) : (
            <MasonryGrid activities={filteredActivities} loading={loading} />
          )}
        </div>
      </div>

      <FloatingButton onClick={() => setIsModalOpen(true)} />
      <CreateAnnouncementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Home;
