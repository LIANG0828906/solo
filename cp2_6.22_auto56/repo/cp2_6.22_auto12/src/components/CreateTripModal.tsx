import { useState } from 'react';
import { X, Upload, MapPin, Calendar, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '../store/useTripStore';
import { useUiStore } from '../store/useUiStore';
import { tripApi } from '../dataStore';
import { isValidDateRange } from '../utils/dateUtils';

export const CreateTripModal = () => {
  const navigate = useNavigate();
  const { createTrip } = useTripStore();
  const { showCreateTripModal, setShowCreateTripModal } = useUiStore();
  
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    coverImage: '',
  });
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  if (!showCreateTripModal) return null;
  
  const handleClose = () => {
    setShowCreateTripModal(false);
    setFormData({ destination: '', startDate: '', endDate: '', coverImage: '' });
    setPreviewImage(null);
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setPreviewImage(URL.createObjectURL(file));
    setUploading(true);
    
    try {
      const url = await tripApi.uploadCoverImage(file);
      setFormData({ ...formData, coverImage: url });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.destination.trim()) {
      alert('请输入目的地');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      alert('请选择日期范围');
      return;
    }
    if (!isValidDateRange(formData.startDate, formData.endDate)) {
      alert('结束日期不能早于开始日期');
      return;
    }
    
    const newTrip = await createTrip({
      destination: formData.destination.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      coverImage: formData.coverImage || undefined,
    });
    
    handleClose();
    navigate(`/trip/${newTrip.id}`);
  };
  
  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-warm-800">创建新旅行</h3>
          <button onClick={handleClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="input-label">
              <MapPin className="w-4 h-4 inline mr-1" />
              目的地
            </label>
            <input
              type="text"
              placeholder="例如：东京、京都、巴黎..."
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="input-field text-lg"
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">
                <Calendar className="w-4 h-4 inline mr-1" />
                开始日期
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">
                <Calendar className="w-4 h-4 inline mr-1" />
                结束日期
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          
          <div>
            <label className="input-label">
              <Upload className="w-4 h-4 inline mr-1" />
              封面图片（可选）
            </label>
            <div className="relative">
              {previewImage ? (
                <div className="relative rounded-2xl overflow-hidden h-40">
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage(null);
                      setFormData({ ...formData, coverImage: '' });
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-warm-600 hover:bg-red-50 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-warm-200 rounded-2xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all">
                  <Upload className="w-8 h-8 text-warm-400 mb-2" />
                  <span className="text-warm-500 text-sm">点击或拖拽上传图片</span>
                  <span className="text-warm-400 text-xs mt-1">JPG, PNG, WebP (最大 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                  <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={handleClose} className="btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              创建旅行
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
