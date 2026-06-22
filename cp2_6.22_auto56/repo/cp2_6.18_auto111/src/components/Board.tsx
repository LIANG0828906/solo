import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, type Announcement } from '@/store/appStore';
import { getAnnouncementColor } from '@/utils/helpers';
import { Search } from 'lucide-react';

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

const isCJKChar = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x3000 && code <= 0x303f) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xff00 && code <= 0xffef)
  );
};

const getCharDisplayWidth = (char: string): number => {
  return isCJKChar(char) ? 2 : 1;
};

const Board: React.FC = () => {
  const navigate = useNavigate();
  const { fetchAnnouncements, getFilteredAnnouncements, loading, getAdjustedServerTime } = useAppStore();
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());

  const isRecentAnnouncement = useCallback((createdAt: string): boolean => {
    const serverNow = getAdjustedServerTime();
    const announcementTime = new Date(createdAt).getTime();
    return serverNow - announcementTime < TWENTY_FOUR_HOURS;
  }, [getAdjustedServerTime]);

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

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const truncateContentByWidth = (content: string, maxWidth: number = 200): string => {
    let totalWidth = 0;
    let result = '';

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const charWidth = getCharDisplayWidth(char);

      if (totalWidth + charWidth > maxWidth) {
        return result + '...';
      }

      result += char;
      totalWidth += charWidth;
    }

    return content;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 md:p-6">
      {announcements.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          isVisible={visibleItems.has(announcement.id)}
          isRecent={isRecentAnnouncement(announcement.createdAt)}
          formatDateTime={formatDateTime}
          truncateContentByWidth={truncateContentByWidth}
          onClick={() => navigate(`/announcement/${announcement.id}`)}
        />
      ))}
    </div>
  );
};

interface AnnouncementCardProps {
  announcement: Announcement;
  isVisible: boolean;
  isRecent: boolean;
  formatDateTime: (dateString: string) => string;
  truncateContentByWidth: (content: string, maxWidth?: number) => string;
  onClick: () => void;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  isVisible,
  isRecent,
  formatDateTime,
  truncateContentByWidth,
  onClick
}) => {
  const color = getAnnouncementColor(announcement.createdAt);

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
      `}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.8)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        background: isRecent
          ? 'var(--announcement-card-recent-bg)'
          : 'var(--announcement-card-bg)',
        boxShadow: isRecent ? '0 0 0 2px var(--announcement-card-recent-ring), var(--shadow-card)' : 'var(--shadow-card)'
      }}
    >
      {isRecent && (
        <div className="absolute top-3 right-3 z-10">
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold shadow-md animate-pulse"
            style={{
              background: 'var(--new-badge-bg)',
              color: 'var(--new-badge-text)'
            }}
          >
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
          className="text-[18px] font-semibold text-gray-800 mb-2 pr-8"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {announcement.title}
        </h3>

        <p
          className="text-sm text-gray-600 flex-1 mb-3"
          style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}
        >
          {truncateContentByWidth(announcement.content, 200)}
        </p>

        <div className="border-t border-gray-100 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">{announcement.author}</span>
            <span className={`text-xs ${isRecent ? 'font-medium' : 'text-gray-400'}`}
              style={isRecent ? { color: 'var(--color-primary)' } : undefined}
            >
              {formatDateTime(announcement.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Board;
