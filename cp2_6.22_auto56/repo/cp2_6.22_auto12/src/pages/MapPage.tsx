import { useEffect } from 'react';
import { ArrowLeft, Download, Calendar, MapPin } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapView } from '../components/MapView';
import { useTripStore } from '../store/useTripStore';
import { useUiStore } from '../store/useUiStore';
import { formatDate } from '../utils/dateUtils';

export const MapPage = () => {
  const { tripId = '' } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { currentTrip, fetchTripById, loading } = useTripStore();
  const { reset } = useUiStore();
  
  useEffect(() => {
    fetchTripById(tripId);
    
    return () => {
      reset();
    };
  }, [tripId, fetchTripById, reset]);
  
  if (loading && !currentTrip) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!currentTrip) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-warm-700 mb-2">找不到旅行计划</h3>
          <button onClick={() => navigate('/')} className="btn-primary">
            返回看板
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-warm-50">
      <header className="bg-white shadow-sm sticky top-0 z-30 backdrop-blur-md bg-white/90">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/trip/${tripId}`)}
                className="btn-icon"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-xl font-bold text-warm-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent-500" />
                  {currentTrip.destination} · 路线地图
                </h1>
                <p className="text-sm text-warm-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(currentTrip.startDate)} - {formatDate(currentTrip.endDate)}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => navigate(`/trip/${tripId}/export`)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">导出PDF</span>
            </button>
          </div>
        </div>
      </header>
      
      <main className="container py-6">
        <MapView />
      </main>
    </div>
  );
};
