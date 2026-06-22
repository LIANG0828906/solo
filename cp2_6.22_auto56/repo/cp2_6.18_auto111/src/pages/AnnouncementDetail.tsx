import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { getAnnouncementColor, formatFullDate } from '@/utils/helpers';

const AnnouncementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { announcements } = useAppStore();

  const announcement = announcements.find(a => a.id === id);

  if (!announcement) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">公告不存在</p>
          <button
            onClick={() => navigate('/')}
            className="text-[#6366f1] hover:text-indigo-700"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const color = getAnnouncementColor(announcement.createdAt);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回
        </button>

        <div
          className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden animate-fade-in"
        >
          <div
            className="h-2"
            style={{ backgroundColor: color }}
          />
          <div className="p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              {announcement.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                <span>{announcement.author}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{formatFullDate(announcement.createdAt)}</span>
              </div>
            </div>

            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                {announcement.content}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDetail;
