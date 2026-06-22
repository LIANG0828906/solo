import { useState } from 'react';
import {
  MapPin,
  Heart,
  Bookmark,
  Calendar,
  Edit3,
  User as UserIcon,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import TripCard from '@/components/TripCard';
import { mockTrips, Trip } from '@/data/mocks';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { useNavigate } from 'react-router-dom';

type TabType = 'trips' | 'favorites';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('trips');
  const [userTrips, setUserTrips] = useState<Trip[]>(mockTrips.slice(0, 3));
  const [favoriteTrips, setFavoriteTrips] = useState<Trip[]>(
    mockTrips.filter((t) => t.isFavorited)
  );

  const handleLike = (id: string, listType: TabType) => {
    const setTrips = listType === 'trips' ? setUserTrips : setFavoriteTrips;
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === id
          ? {
              ...trip,
              isLiked: !trip.isLiked,
              likes: trip.isLiked ? trip.likes - 1 : trip.likes + 1,
            }
          : trip
      )
    );
  };

  const handleFavorite = (id: string, listType: TabType) => {
    const setTrips = listType === 'trips' ? setUserTrips : setFavoriteTrips;
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === id
          ? { ...trip, isFavorited: !trip.isFavorited }
          : trip
      )
    );

    if (listType === 'favorites') {
      setFavoriteTrips((prev) => prev.filter((t) => t.id !== id));
      addToast({ message: '已取消收藏', type: 'success' });
    } else {
      addToast({ message: '已添加收藏', type: 'success' });
      const trip = userTrips.find((t) => t.id === id);
      if (trip && !favoriteTrips.find((t) => t.id === id)) {
        setFavoriteTrips((prev) => [...prev, { ...trip, isFavorited: true }]);
      }
    }
  };

  const handleCardClick = (id: string) => {
    navigate(`/trip/${id}/edit`);
  };

  const stats = [
    { label: '路线', value: userTrips.length, icon: MapPin },
    { label: '收藏', value: favoriteTrips.length, icon: Bookmark },
    { label: '获赞', value: userTrips.reduce((sum, t) => sum + t.likes, 0), icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />

      <div className="relative bg-gradient-to-br from-[#1a73e8] via-[#2a85e8] to-[#34a853] pb-24 pt-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-fadeInUp">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                <img
                  src={user?.avatar || 'https://picsum.photos/seed/default/120/120'}
                  alt="avatar"
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                />
                <button className="absolute bottom-0 right-0 p-1.5 bg-[#1a73e8] text-white rounded-full shadow-md hover:bg-[#1557b0] transition-colors">
                  <Edit3 size={14} />
                </button>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.username || '旅行者'}
                </h1>
                <p className="text-gray-500 mt-1">
                  {user?.bio || '热爱旅行，探索世界的美好'}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-400">加入于 2024年1月</span>
                </div>
              </div>

              <button className="px-5 py-2 text-sm font-medium text-[#1a73e8] border border-[#1a73e8] rounded-lg hover:bg-blue-50 transition-colors">
                编辑资料
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <stat.icon size={20} className="text-[#1a73e8]" />
                    <span className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100">
            <div className="flex">
              <button
                onClick={() => setActiveTab('trips')}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'trips'
                    ? 'text-[#1a73e8]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <MapPin size={18} />
                  <span>我的路线</span>
                </div>
                {activeTab === 'trips' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#1a73e8] rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'favorites'
                    ? 'text-[#1a73e8]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Bookmark size={18} />
                  <span>收藏路线</span>
                </div>
                {activeTab === 'favorites' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#1a73e8] rounded-full"></div>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pb-12">
          {activeTab === 'trips' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  我的路线
                </h2>
                <span className="text-sm text-gray-500">
                  共 {userTrips.length} 条
                </span>
              </div>
              {userTrips.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userTrips.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      onLike={(id) => handleLike(id, 'trips')}
                      onFavorite={(id) => handleFavorite(id, 'trips')}
                      onClick={handleCardClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-12 text-center">
                  <UserIcon className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500 mb-4">你还没有创建路线</p>
                  <button
                    onClick={() => navigate('/create')}
                    className="btn-primary"
                  >
                    创建第一条路线
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'favorites' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  收藏路线
                </h2>
                <span className="text-sm text-gray-500">
                  共 {favoriteTrips.length} 条
                </span>
              </div>
              {favoriteTrips.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteTrips.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      onLike={(id) => handleLike(id, 'favorites')}
                      onFavorite={(id) => handleFavorite(id, 'favorites')}
                      onClick={handleCardClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-12 text-center">
                  <Bookmark className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500 mb-4">你还没有收藏路线</p>
                  <button
                    onClick={() => navigate('/explore')}
                    className="btn-primary"
                  >
                    去发现路线
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
