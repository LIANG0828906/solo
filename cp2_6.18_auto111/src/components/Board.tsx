import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, type Announcement } from '@/store/appStore';
import { getAnnouncementColor } from '@/utils/helpers';
import { Search } from 'lucide-react';

const Board: React.FC = () => {
  const navigate = useNavigate();
  const { fetchAnnouncements, getFilteredAnnouncements, loading } = useAppStore();
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

const isRecentAnnouncement = (createdAt: string): boolean => {
  const now = new Date().getTime();
  const announcementTime = new Date(createdAt).getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return now - announcementTime < twentyFourHours;
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const truncateContent = (content: string, maxLength: number = 150): string => {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
};

interface AnnouncementCardProps {
  announcement: Announcement;
  isVisible: boolean;
  onClick: () => void;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement, isVisible, onClick }) => {
  const color = getAnnouncementColor(announcement.createdAt);
  const isRecent = isRecentAnnouncement(announcement.createdAt);

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl cursor-pointer
        backdrop-blur-md
        shadow-md hover:shadow-xl
        transform hover:-translate-y-1
        transition-all duration-200 ease-out
        w-full md:w-[280px] h-[200px]
        animate-fade-in
        ${isRecent ? 'ring-2 ring-indigo-300 ring-opacity-50' : ''}
      `}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.8)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        background: isRecent
          ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(238,242,255,0.9) 100%)'
          : 'rgba(255,255,255,0.8)'
      }}
    >
      {isRecent && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md animate-pulse">
            新
          </span>
        </div>
      )}

      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: color }}
      />

      <div className="p-4 md:p-5 pl-5 md:pl-6 h-full flex flex-col">
        <h3
          className="text-[18px] font-semibold text-gray-800 mb-2 pr-8 line-clamp-2"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {announcement.title}
        </h3>

        <p
          className="text-sm text-gray-600 flex-1 mb-3"
          style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}
        >
          {truncateContent(announcement.content, 150)}
        </p>

        <div className="border-t border-gray-100 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">{announcement.author}</span>
            <span className={`text-xs ${isRecent ? 'text-indigo-500 font-medium' : 'text-gray-400'}`}>
              {formatDateTime(announcement.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Board;
