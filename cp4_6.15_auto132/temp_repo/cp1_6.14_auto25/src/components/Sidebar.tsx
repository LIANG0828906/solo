import React from 'react';
import { X, User, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';
import ProfileForm from './ProfileForm';

const Sidebar: React.FC = () => {
  const { sidebarOpen, setSidebarOpen, currentUser } = useStore();

  if (!sidebarOpen || !currentUser) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={() => setSidebarOpen(false)}
      />

      <div className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-[#FFF5E6] z-50 shadow-2xl transform transition-transform duration-300 overflow-y-auto">
        <div className="sticky top-0 bg-[#FFF5E6] z-10 px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/50">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-[#FF6B6B]" />
            <h2 className="text-lg font-bold text-gray-800">编辑资料</h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center hover:bg-white transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-2 flex items-center gap-3 mb-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
            style={{ backgroundColor: currentUser.avatarColor }}
          >
            {currentUser.nickname.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{currentUser.nickname}</p>
            <p className="text-sm text-gray-500">编辑后将实时更新推荐列表</p>
          </div>
        </div>

        <ProfileForm editMode={true} initialData={currentUser} />
      </div>
    </>
  );
};

export default Sidebar;
