import { useEffect } from 'react';
import { ArrowLeft, Map, Download, Calendar, MapPin } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { DayPlan } from '../components/DayPlan';
import { MiniTimeline } from '../components/MiniTimeline';
import { useTripStore } from '../store/useTripStore';
import { useUiStore } from '../store/useUiStore';
import { formatDate } from '../utils/dateUtils';
import { downloadPDF } from '../utils/pdfExport';

export const TripDetailPage = () => {
  const { tripId = '' } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { currentTrip, fetchTripById, loading } = useTripStore();
  const { setSelectedDayIndex, reset } = useUiStore();
  
  useEffect(() => {
    fetchTripById(tripId);
    setSelectedDayIndex(0);
    
    return () => {
      reset();
    };
  }, [tripId, fetchTripById, setSelectedDayIndex, reset]);
  
  const handleExportPDF = async () => {
    if (!currentTrip) return;
    
    try {
      await downloadPDF(currentTrip);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('导出失败，请重试');
    }
  };
  
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
    <div className="min-h-screen bg-warm-50 pb-36">
      <header className="bg-white shadow-sm sticky top-0 z-30 backdrop-blur-md bg-white/90">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="btn-icon"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-xl font-bold text-warm-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-500" />
                  {currentTrip.destination}
                </h1>
                <p className="text-sm text-warm-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(currentTrip.startDate)} - {formatDate(currentTrip.endDate)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/trip/${tripId}/export`)}
                className="btn-secondary hidden sm:inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                导出
              </button>
              <button
                onClick={() => navigate(`/trip/${tripId}/map`)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Map className="w-4 h-4" />
                地图
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container py-6">
        <div className="relative rounded-3xl overflow-hidden mb-8 h-48 md:h-64">
          <img
            src={currentTrip.coverImage}
            alt={currentTrip.destination}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-4 text-white">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary-400 rounded-full" />
                <span className="font-medium">{currentTrip.activities.length} 个活动</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent-400 rounded-full" />
                <span className="font-medium">{currentTrip.locations.length} 个地点</span>
              </div>
            </div>
          </div>
        </div>
        
        <DayPlan />
      </main>
      
      <MiniTimeline />
    </div>
  );
};
