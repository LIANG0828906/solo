import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, User } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { getAnnouncementColor, formatDate, truncateText } from '@/utils/helpers';

const Profile: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'announcements' | 'activities'>(
    tabParam === 'activities' ? 'activities' : 'announcements'
  );
  const { currentUser, announcements, activities, users } = useAppStore();

  useEffect(() => {
    if (tabParam === 'activities') {
      setActiveTab('activities');
    } else {
      setActiveTab('announcements');
    }
  }, [tabParam]);

  const myAnnouncements = currentUser
    ? announcements.filter(a => a.author === currentUser.name)
    : [];

  const myActivities = currentUser
    ? activities.filter(a => a.participants.includes(currentUser.id))
    : [];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回
        </button>

        {currentUser && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 mb-6 animate-fade-in">
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-full bg-[#6366f1] flex items-center justify-center text-white text-2xl font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold text-gray-800">{currentUser.name}</h1>
                <p className="text-gray-500 text-sm">社区活跃成员</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`
              flex items-center px-6 py-3 font-medium text-sm border-b-2 transition-all
              ${activeTab === 'announcements'
                ? 'border-[#6366f1] text-[#6366f1]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <FileText className="w-4 h-4 mr-2" />
            我的公告 ({myAnnouncements.length})
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`
              flex items-center px-6 py-3 font-medium text-sm border-b-2 transition-all
              ${activeTab === 'activities'
                ? 'border-[#6366f1] text-[#6366f1]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <Calendar className="w-4 h-4 mr-2" />
            我的活动 ({myActivities.length})
          </button>
        </div>

        <div className="animate-fade-in">
          {activeTab === 'announcements' ? (
            myAnnouncements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myAnnouncements.map((announcement) => (
                  <div
                    key={announcement.id}
                    onClick={() => navigate(`/announcement/${announcement.id}`)}
                    className="
                      relative overflow-hidden rounded-xl cursor-pointer
                      bg-white/80 backdrop-blur-md
                      shadow-md hover:shadow-xl
                      transform hover:-translate-y-1
                      transition-all duration-200 ease-out
                      h-[200px]
                    "
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                      style={{ backgroundColor: getAnnouncementColor(announcement.createdAt) }}
                    />
                    <div className="p-5 pl-6 h-full flex flex-col">
                      <h3
                        className="text-[18px] font-semibold text-gray-800 mb-2"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {announcement.title}
                      </h3>
                      <p
                        className="text-sm text-gray-600 flex-1"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {truncateText(announcement.content, 80)}
                      </p>
                      <div className="mt-3 text-xs text-gray-400">
                        {new Date(announcement.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>暂无发布的公告</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 text-[#6366f1] hover:text-indigo-700"
                >
                  去发布第一条公告
                </button>
              </div>
            )
          ) : (
            myActivities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myActivities.map((activity) => {
                  const organizer = users.find(u => u.name === activity.organizer);
                  return (
                    <div
                      key={activity.id}
                      onClick={() => navigate(`/activity/${activity.id}`)}
                      className="
                        relative overflow-hidden rounded-xl cursor-pointer
                        bg-white/80 backdrop-blur-md
                        shadow-md hover:shadow-xl
                        transform hover:-translate-y-1
                        transition-all duration-200 ease-out
                      "
                    >
                      <div className="p-4">
                        <div className="mb-2">
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-600 rounded-full">
                            {activity.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                          {activity.title}
                        </h3>
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-4 h-4 mr-1 text-indigo-500" />
                            <span>{formatDate(activity.date)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            <span>{activity.organizer}</span>
                          </div>
                          <span>{activity.participants.length}/{activity.capacity}人</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>暂无参加的活动</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 text-[#6366f1] hover:text-indigo-700"
                >
                  去发现感兴趣的活动
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
