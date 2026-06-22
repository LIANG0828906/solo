import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import TripCard from '@/components/TripCard';
import { mockTrips, Trip } from '@/data/mocks';
import { useToastStore } from '@/stores/toastStore';

export default function ExplorePage() {
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('全部');
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const filters = ['全部', '热门', '最新', '推荐', '周边'];

  const handleLike = (id: string) => {
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

  const handleFavorite = (id: string) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === id
          ? { ...trip, isFavorited: !trip.isFavorited }
          : trip
      )
    );
    const trip = trips.find((t) => t.id === id);
    addToast({
      message: trip?.isFavorited ? '已取消收藏' : '已添加到收藏',
      type: 'success',
    });
  };

  const handleCardClick = (id: string) => {
    navigate(`/trip/${id}`);
  };

  const filteredTrips = trips.filter((trip) =>
    trip.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />

      <div className="relative bg-gradient-to-br from-[#1a73e8] via-[#2a85e8] to-[#34a853] py-16 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fadeInDown">
            发现精彩旅行路线
          </h1>
          <p className="text-white/80 text-lg mb-8 animate-fadeInUp">
            探索全球热门目的地，找到属于你的完美旅程
          </p>
          <div className="relative max-w-xl mx-auto animate-fadeInUp">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索目的地、路线..."
              className="w-full pl-12 pr-4 py-4 rounded-xl shadow-lg text-gray-700 bg-white focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === filter
                      ? 'bg-gradient-to-r from-[#1a73e8] to-[#34a853] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
              <Filter size={18} />
              <span>筛选</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="text-[#1a73e8]" size={22} />
            热门路线
          </h2>
          <span className="text-sm text-gray-500">
            共 {filteredTrips.length} 条路线
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {filteredTrips.map((trip, index) => (
            <div
              key={trip.id}
              style={{ animationDelay: `${index * 0.1}s` }}
              className="animate-fadeInUp"
            >
              <TripCard
                trip={trip}
                onLike={handleLike}
                onFavorite={handleFavorite}
                onClick={handleCardClick}
              />
            </div>
          ))}
        </div>

        {filteredTrips.length === 0 && (
          <div className="text-center py-16">
            <MapPin className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">没有找到相关路线</p>
          </div>
        )}
      </div>
    </div>
  );
}
