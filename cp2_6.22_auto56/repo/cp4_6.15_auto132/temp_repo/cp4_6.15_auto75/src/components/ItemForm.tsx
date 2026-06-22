import { useState, useRef } from 'react';
import { X, MapPin, Upload, Clock, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { postItem } from '@/utils/api';
import { toast } from '@/hooks/useToast';
import type { LostItem } from '@/types';

interface ItemFormProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: (item: LostItem) => void;
}

const PRESET_LOCATIONS = [
  '图书馆', '教学楼', '食堂', '操场', '宿舍楼', '办公楼',
  '咖啡厅', '公园', '地铁站', '公交站', '商场', '其他',
];

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export default function ItemForm({ open, onClose, onSubmitted }: ItemFormProps) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [lostTime, setLostTime] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [imageName, setImageName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle('');
    setLocation('');
    setCustomLocation('');
    setLostTime('');
    setDescription('');
    setImage('');
    setImageName('');
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast('只支持 JPG 和 PNG 格式的图片', 'error');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast('图片大小不能超过 2MB', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setImageName(file.name);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 90) {
        progress = 90;
        clearInterval(interval);
      }
      setUploadProgress(Math.round(progress));
    }, 80);

    const reader = new FileReader();
    reader.onload = (e) => {
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setImage(e.target?.result as string);
        setIsUploading(false);
      }, 200);
    };
    reader.onerror = () => {
      clearInterval(interval);
      setIsUploading(false);
      setUploadProgress(0);
      toast('图片读取失败', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalLocation = location === '其他' ? customLocation : location;
    if (!title.trim()) {
      toast('请输入物品名称', 'error');
      return;
    }
    if (!finalLocation.trim()) {
      toast('请选择或输入丢失地点', 'error');
      return;
    }
    if (!description.trim()) {
      toast('请输入物品描述', 'error');
      return;
    }
    if (!image) {
      toast('请上传一张物品图片', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await postItem({
        title: title.trim(),
        location: finalLocation.trim(),
        description: description.trim() + (lostTime ? `（丢失时间：${lostTime}）` : ''),
        image,
      });
      toast('发布成功！物品已加入列表', 'success');
      onSubmitted(result);
      resetForm();
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : '发布失败，请重试', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-opacity duration-300',
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div
        className={cn(
          'relative w-full sm:max-w-lg bg-[#FFF8F0] sm:rounded-2xl rounded-t-3xl shadow-2xl',
          'max-h-[90vh] overflow-hidden flex flex-col',
          'transition-transform duration-300 ease-out',
          open
            ? 'translate-y-0 sm:scale-100'
            : 'translate-y-full sm:translate-y-0 sm:scale-95'
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-white/60">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#FFA726] rounded-full" />
            发布失物
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-full hover:bg-orange-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              物品名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：棕色钱包、黑色雨伞"
              maxLength={50}
              className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 focus:border-[#FFA726] outline-none transition-colors bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-[#FFA726]" />
              丢失地点 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocation(location === loc ? '' : loc)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm transition-all duration-200',
                    location === loc
                      ? 'bg-[#FFA726] text-white shadow-md scale-105'
                      : 'bg-white border border-orange-200 text-gray-600 hover:border-[#FFA726] hover:bg-orange-50'
                  )}
                >
                  {loc}
                </button>
              ))}
            </div>
            {location === '其他' && (
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="请输入具体地点"
                className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 focus:border-[#FFA726] outline-none transition-colors bg-white"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Clock className="w-4 h-4 text-[#FFA726]" />
              丢失时间 <span className="text-gray-400 text-xs font-normal">（可选）</span>
            </label>
            <input
              type="datetime-local"
              value={lostTime}
              onChange={(e) => setLostTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 focus:border-[#FFA726] outline-none transition-colors bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              详细描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请详细描述物品的颜色、特征、品牌等信息，便于失主辨认"
              rows={4}
              maxLength={300}
              className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 focus:border-[#FFA726] outline-none transition-colors bg-white resize-none"
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {description.length}/300
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Upload className="w-4 h-4 text-[#FFA726]" />
              物品图片 <span className="text-red-500">*</span>
              <span className="text-gray-400 text-xs font-normal">（JPG/PNG，≤2MB）</span>
            </label>
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={cn(
                'relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200',
                image
                  ? 'border-[#FFA726] bg-orange-50/50'
                  : 'border-orange-200 bg-white hover:border-[#FFA726] hover:bg-orange-50'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />

              {image ? (
                <div className="space-y-3">
                  <img
                    src={image}
                    alt="预览"
                    className="max-h-48 mx-auto rounded-xl object-contain"
                  />
                  <p className="text-sm text-gray-600">{imageName}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImage('');
                      setImageName('');
                    }}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    重新选择
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {isUploading ? (
                    <div className="space-y-3 py-4">
                      <div className="relative w-20 h-20 mx-auto">
                        <svg className="w-20 h-20 -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r="34"
                            stroke="#FED7AA"
                            strokeWidth="5"
                            fill="none"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="34"
                            stroke="#FFA726"
                            strokeWidth="5"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 34}`}
                            strokeDashoffset={`${2 * Math.PI * 34 * (1 - uploadProgress / 100)}`}
                            strokeLinecap="round"
                            className="transition-all duration-100"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-[#FFA726]">
                          {uploadProgress}%
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">正在上传图片...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 mx-auto rounded-full bg-orange-100 flex items-center justify-center">
                        <Upload className="w-7 h-7 text-[#FFA726]" />
                      </div>
                      <p className="text-sm text-gray-600">点击或拖拽图片到此处上传</p>
                      <p className="text-xs text-gray-400">JPG 或 PNG 格式，最大 2MB</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-orange-100 bg-white/60 space-y-2">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            className={cn(
              'w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200',
              'bg-[#FFA726] hover:bg-orange-500 shadow-lg hover:shadow-xl',
              'active:scale-[0.98]',
              'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100'
            )}
          >
            <Send className="w-5 h-5" />
            {isSubmitting ? '发布中...' : '立即发布'}
          </button>
          <p className="text-center text-xs text-gray-400">
            发布信息将公开显示，请确保内容真实有效
          </p>
        </div>
      </div>
    </div>
  );
}
