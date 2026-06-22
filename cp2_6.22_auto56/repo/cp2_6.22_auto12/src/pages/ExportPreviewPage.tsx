import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Download, Calendar, MapPin, Eye, FileText } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTripStore } from '../store/useTripStore';
import { formatDate, getDayLabel, getDayCount } from '../utils/dateUtils';
import { downloadPDF, previewPDF } from '../utils/pdfExport';

export const ExportPreviewPage = () => {
  const { tripId = '' } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { currentTrip, fetchTripById, loading } = useTripStore();
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const mapPreviewRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    fetchTripById(tripId);
  }, [tripId, fetchTripById]);
  
  useEffect(() => {
    if (currentTrip && !previewUrl) {
      generatePreview();
    }
  }, [currentTrip]);
  
  const generatePreview = async () => {
    if (!currentTrip) return;
    
    setGenerating(true);
    try {
      const url = await previewPDF(currentTrip);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Preview generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };
  
  const handleDownload = async () => {
    if (!currentTrip) return;
    
    try {
      await downloadPDF(currentTrip);
    } catch (err) {
      console.error('Download failed:', err);
      alert('下载失败，请重试');
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
  
  const dayCount = getDayCount(currentTrip.startDate, currentTrip.endDate);
  
  return (
    <div className="min-h-screen bg-warm-100 pb-8">
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
                  <FileText className="w-5 h-5 text-primary-500" />
                  PDF导出预览
                </h1>
                <p className="text-sm text-warm-500 flex items-center gap-2">
                  {currentTrip.destination} · {formatDate(currentTrip.startDate)} - {formatDate(currentTrip.endDate)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={generatePreview}
                className="btn-secondary inline-flex items-center gap-2"
                disabled={generating}
              >
                <Eye className="w-4 h-4" />
                刷新预览
              </button>
              <button
                onClick={handleDownload}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                下载PDF
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h3 className="text-lg font-bold text-warm-800 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary-500" />
              文档预览
            </h3>
            
            {generating ? (
              <div className="flex flex-col items-center justify-center h-96 bg-warm-50 rounded-2xl">
                <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mb-4" />
                <p className="text-warm-500">正在生成预览...</p>
              </div>
            ) : previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-[800px] rounded-xl border border-warm-200"
                title="PDF Preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-96 bg-warm-50 rounded-2xl">
                <div className="text-5