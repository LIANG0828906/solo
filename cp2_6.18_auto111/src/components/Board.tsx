import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, type Announcement } from '@/store/appStore';
import { getAnnouncementColor, truncateText } from '@/utils/helpers';
import { Search } from 'lucide-react';

const Board: React.FC = () => {
  const navigate = useNavigate();
  const { fetchAnnouncements, getFilteredAnnouncements, loading, searchQuery } = useAppStore();
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  useEffect(() => {
    const announcements = getFilteredAnnouncements();
    announcements.forEach((item, index) => {
      setTimeout(() => {
        setVisibleItems(prev => new Set([...prev, item.id]));
      }, index * 50);
    });
  }, [getFilteredAnnouncements]);

  const announcements = getFilteredAnnouncements();

  if (loading && announcements.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Search className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg">未找到相关公告或活动</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 md:p-6">
      {announcements.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          isVisible={visibleItems.has(announcement.id)}
          onClick={() => navigate(`/announcement/${announcement.id}`)}
        />
      ))}
    </div>
  );
};

interface AnnouncementCardProps {
  announcement: Announcement;
  isVisible: boolean;
  onClick: () => void;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement, isVisible, onClick }) => {
  const color = getAnnouncementColor(announcement.createdAt);

  return (
    <div
      onClick={onClick}
      className="
        relative overflow-hidden rounded-xl cursor-pointer
        bg-white/80 backdrop-blur-md
        shadow-md hover:shadow-xl
        transform hover:-translate-y-1
        transition-all duration-200 ease-out
        w-full md:w-[280px] h-[200px]
        md:h-[200px]
        animate-fade-in
      "
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.8)',
        transition: 'opacity 0.3s ease, transform 0.3s ease'
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: color }}
      />
      <div className="p-4 md:p-5 pl-5 md:pl-6 h-full flex flex-col">
        <h3
          className="text-[18px] font-semibold text-gray-800 mb-2 line-clamp-2"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {announcement.title}
        </h3>
        <p
          className="text-sm text-gray-600 flex-1 line-clamp-2"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {truncateText(announcement.content, 80)}
        </p>
        <div className="mt-3 flex justify-between items-center text-xs text-gray-400">
          <span className="font-medium">{announcement.author}</span>
          <span>{new Date(announcement.createdAt).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>
    </div>
  );
};

export default Board;
