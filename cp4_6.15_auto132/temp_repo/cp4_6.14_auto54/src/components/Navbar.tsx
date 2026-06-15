import React from 'react';
import { Map, FileDown, History } from 'lucide-react';
import type { TeamMember } from '@/types';

interface NavbarProps {
  tripName: string;
  members: TeamMember[];
  currentUser?: TeamMember;
  onExport: () => void;
  onToggleHistory: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  tripName,
  members,
  currentUser,
  onExport,
  onToggleHistory,
}) => {
  const maxVisibleMembers = 3;
  const visibleMembers = members.slice(0, maxVisibleMembers);
  const remainingCount = Math.max(members.length - maxVisibleMembers, 0);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] h-14 px-4 sm:px-6 flex items-center justify-between shadow-lg"
      style={{
        background: 'linear-gradient(90deg, #0c4a6e 0%, #1e3a8a 100%)',
      }}
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        <Map className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        <span className="text-white font-bold text-base sm:text-lg truncate">
          旅行规划协作
        </span>
      </div>

      <div className="flex-1 flex justify-center px-2 min-w-0">
        <span className="text-white text-xs sm:text-sm opacity-90 truncate max-w-xs">
          {tripName}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <div className="flex items-center">
          {visibleMembers.map((member, index) => (
            <div
              key={member.id}
              className="relative rounded-full overflow-hidden"
              style={{
                width: 32,
                height: 32,
                marginLeft: index === 0 ? 0 : -8,
                border: '2px solid white',
                zIndex: visibleMembers.length - index,
              }}
            >
              <img
                src={member.avatar}
                alt={member.name}
                className="w-full h-full object-cover"
              />
              {member.online && (
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border border-white"
                  style={{ boxSizing: 'content-box' }}
                />
              )}
            </div>
          ))}
          {remainingCount > 0 && (
            <div
              className="relative rounded-full flex items-center justify-center text-white text-xs font-semibold"
              style={{
                width: 32,
                height: 32,
                marginLeft: -8,
                border: '2px solid white',
                backgroundColor: '#6b7280',
                zIndex: 0,
              }}
            >
              +{remainingCount}
            </div>
          )}
        </div>

        {currentUser && (
          <div
            className="relative rounded-full overflow-hidden flex-shrink-0"
            style={{
              width: 36,
              height: 36,
              border: '2px solid white',
            }}
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-full h-full object-cover"
            />
            {currentUser.online && (
              <span
                className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border border-white"
                style={{ boxSizing: 'content-box' }}
              />
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onExport}
            className="flex items-center justify-center rounded-lg text-white transition-all duration-200 hover:scale-105 hover:brightness-110"
            style={{
              width: 36,
              height: 36,
              backgroundColor: '#f97316',
            }}
            title="导出"
          >
            <FileDown className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={onToggleHistory}
            className="flex items-center justify-center rounded-lg text-white transition-all duration-200 hover:scale-105 hover:brightness-150"
            style={{
              width: 36,
              height: 36,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
            }}
            title="历史记录"
          >
            <History className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
