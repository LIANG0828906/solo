import React, { useState } from 'react';
import { Plus, Grid3X3, List, ZoomIn, ZoomOut, Maximize2, Share2 } from 'lucide-react';
import { ColorFilterButton } from './ColorFilterButton';
import { UserAvatar } from './UserAvatar';
import type { User, ColorFilter, ViewMode, Note } from '../utils/types';

interface ToolbarProps {
  currentUser: User;
  users: User[];
  roomId: string;
  colorFilter: ColorFilter;
  viewMode: ViewMode;
  scale: number;
  notes: Note[];
  onColorFilterChange: (filter: ColorFilter) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onAddNote: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentUser,
  users,
  roomId,
  colorFilter,
  viewMode,
  scale,
  notes,
  onColorFilterChange,
  onViewModeChange,
  onAddNote,
  onZoomIn,
  onZoomOut,
  onResetView,
}) => {
  const [showUserList, setShowUserList] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const colorCounts = {
    all: notes.length,
    red: notes.filter(n => n.color === 'red').length,
    green: notes.filter(n => n.color === 'green').length,
    blue: notes.filter(n => n.color === 'blue').length,
    yellow: notes.filter(n => n.color === 'yellow').length,
  };

  const handleCopyRoomLink = () => {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('房间链接已复制到剪贴板！');
    });
  };

  return (
    <>
      <div className="toolbar fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💡</span>
                <h1 className="font-serif-sc text-xl font-bold text-gray-800 hide-on-mobile">
                  头脑风暴白板
                </h1>
              </div>
              <div className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg">
                <span className="text-xs text-gray-500">房间:</span>
                <span className="text-sm font-mono font-medium text-gray-700">{roomId}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 hide-on-mobile">
              {(['all', 'red', 'green', 'blue', 'yellow'] as ColorFilter[]).map((color) => (
                <ColorFilterButton
                  key={color}
                  color={color}
                  isActive={colorFilter === color}
                  count={colorCounts[color]}
                  onClick={() => onColorFilterChange(color)}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onAddNote}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 shadow-md hover:shadow-lg transition-all"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">添加便签</span>
              </button>

              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg hide-on-mobile">
                <button
                  onClick={onZoomOut}
                  className="p-2 rounded-lg hover:bg-white transition-colors"
                  title="缩小"
                >
                  <ZoomOut size={18} className="text-gray-600" />
                </button>
                <span className="text-sm font-medium text-gray-600 w-12 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={onZoomIn}
                  className="p-2 rounded-lg hover:bg-white transition-colors"
                  title="放大"
                >
                  <ZoomIn size={18} className="text-gray-600" />
                </button>
                <button
                  onClick={onResetView}
                  className="p-2 rounded-lg hover:bg-white transition-colors"
                  title="重置视图"
                >
                  <Maximize2 size={18} className="text-gray-600" />
                </button>
              </div>

              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => onViewModeChange('free')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'free' ? 'bg-white shadow-sm' : 'hover:bg-white'
                  }`}
                  title="自由布局"
                >
                  <Grid3X3 size={18} className="text-gray-600" />
                </button>
                <button
                  onClick={() => onViewModeChange('mindmap')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'mindmap' ? 'bg-white shadow-sm' : 'hover:bg-white'
                  }`}
                  title="思维导图"
                >
                  <List size={18} className="text-gray-600" />
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowUserList(!showUserList)}
                  className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  title="在线用户"
                >
                  <div className="flex -space-x-2">
                    {users.slice(0, 3).map((user) => (
                      <UserAvatar key={user.id} user={user} size="sm" showTooltip={false} />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-600">{users.length}</span>
                </button>

                {showUserList && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">在线用户 ({users.length})</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50"
                        >
                          <UserAvatar user={user} size="md" showTooltip={false} />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{user.name}</p>
                            {user.id === currentUser.id && (
                              <p className="text-xs text-blue-500">你</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowShareModal(true)}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors hide-on-mobile"
                title="分享"
              >
                <Share2 size={18} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showShareModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif-sc text-xl font-bold text-gray-800 mb-4">分享房间</h3>
            <p className="text-sm text-gray-600 mb-4">
              将以下链接分享给团队成员，他们可以加入同一个房间进行协作。
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/room/${roomId}`}
                className="flex-1 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 font-mono"
              />
              <button
                onClick={handleCopyRoomLink}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                复制
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  );
};
