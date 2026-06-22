import { useEffect } from 'react';
import { Plus, Map } from 'lucide-react';
import { TripBoard } from '../components/TripBoard';
import { SearchFilter } from '../components/SearchFilter';
import { CreateTripModal } from '../components/CreateTripModal';
import { useTripStore } from '../store/useTripStore';
import { useUiStore } from '../store/useUiStore';

export const BoardPage = () => {
  const { fetchAllTrips, loading, error } = useTripStore();
  const { setShowCreateTripModal } = useUiStore();
  
  useEffect(() => {
    fetchAllTrips();
  }, [fetchAllTrips]);
  
  return (
    <div className="min-h-screen bg-warm-50 pb-8">
      <header className="bg-white shadow-sm sticky top-0 z-30 backdrop-blur-md bg-white/90">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow">
                <Map className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-warm-800">旅行规划看板</h1>
                <p className="text-xs text-warm-500">管理您的每一次精彩旅程</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateTripModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">创建旅行</span>
            </button>
          </div>
        </div>
      </header>
      
      <main className="container py-6">
        <SearchFilter />
        
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        )}
        
        {error && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">😕</div>
            <h3 className="text-lg font-semibold text-warm-700 mb-2">加载失败</h3>
            <p className="text-warm-500 mb-4">{error}</p>
            <button onClick={fetchAllTrips} className="btn-secondary">
              重试
            </button>
          </div>
        )}
        
        {!loading && !error && <TripBoard />}
      </main>
      
      <CreateTripModal />
    </div>
  );
};
