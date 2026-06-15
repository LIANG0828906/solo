import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Image, Calendar, Hash, AtSign, Send, X, CheckCircle, Loader2 } from 'lucide-react';
import { useContentStore } from './store';
import { Platform, PLATFORM_CONFIG } from './types';
import { compressImage, CompressedImage, formatFileSize } from './utils/imageCompressor';

interface UploadingImage {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  compressed?: CompressedImage;
}

const platformIcons: Record<Platform, string> = {
  weibo: '微',
  zhihu: '知',
  bilibili: 'B',
};

export const Editor: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['weibo']);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [compressedImages, setCompressedImages] = useState<CompressedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const addContent = useContentStore((state) => state.addContent);

  const charLimits = selectedPlatforms.map((p) => PLATFORM_CONFIG[p].limit);
  const minLimit = charLimits.length > 0 ? Math.min(...charLimits) : Infinity;
  const currentLength = body.length;
  const isOverLimit = minLimit !== Infinity && currentLength > minLimit;
  
  const getCharPercentage = () => {
    if (minLimit === Infinity) return 10;
    return Math.min((currentLength / minLimit) * 100, 100);
  };

  const handlePlatformToggle = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const simulateWaveProgress = (imageId: string, duration: number = 1500) => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 95);
      
      setUploadingImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? { ...img, progress: progress + Math.sin(elapsed / 100) * 3 }
            : img
        )
      );
      
      if (progress < 95) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: UploadingImage[] = Array.from(files).map((file, index) => ({
      id: `img-${Date.now()}-${index}`,
      file,
      progress: 0,
      status: 'uploading',
    }));

    setUploadingImages((prev) => [...prev, ...newImages]);

    for (const img of newImages) {
      simulateWaveProgress(img.id);
      
      try {
        const compressed = await compressImage(img.file);
        
        setUploadingImages((prev) =>
          prev.map((i) =>
            i.id === img.id
              ? { ...i, progress: 100, status: 'done', compressed }
              : i
          )
        );
        
        setCompressedImages((prev) => [...prev, compressed]);
        
        setTimeout(() => {
          setUploadingImages((prev) => prev.filter((i) => i.id !== img.id));
        }, 500);
      } catch (error) {
        setUploadingImages((prev) =>
          prev.map((i) =>
            i.id === img.id ? { ...i, status: 'error' } : i
          )
        );
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setCompressedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const insertTag = (tag: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newBody = body.substring(0, start) + tag + body.substring(end);
      setBody(newBody);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + tag.length;
        }
      }, 0);
    } else {
      setBody(body + tag);
    }
  };

  const handleSubmit = () => {
    if (!body.trim() || selectedPlatforms.length === 0) return;
    if (isOverLimit) return;

    setIsSubmitting(true);

    let scheduleTimeStr = '';
    if (scheduleDate) {
      const date = scheduleDate;
      const time = scheduleTime || '09:00';
      scheduleTimeStr = new Date(`${date}T${time}:00`).toISOString();
    }

    setTimeout(() => {
      addContent({
        title: title || body.substring(0, 30) + (body.length > 30 ? '...' : ''),
        body,
        images: compressedImages.map((img) => img.compressed),
        platforms: selectedPlatforms,
        scheduleTime: scheduleTimeStr || new Date().toISOString(),
        likes: 0,
        reposts: 0,
        comments: 0,
      });

      setIsSubmitting(false);
      setShowSuccess(true);
      setTitle('');
      setBody('');
      setCompressedImages([]);
      setScheduleDate('');
      setScheduleTime('');

      setTimeout(() => setShowSuccess(false), 2000);
    }, 500);
  };

  return (
    <div className="editor-container glass-panel rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 opacity-60"></div>
      
      {showSuccess && (
        <div className="success-toast">
          <CheckCircle size={20} className="text-emerald-400" />
          <span className="text-emerald-300">发布计划已保存</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          内容编辑器
        </h2>
      </div>

      <div className="char-count-bar-container mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">
            字数统计
            {selectedPlatforms.length > 0 && minLimit !== Infinity && (
              <span className="ml-1">
                (受限平台: {PLATFORM_CONFIG[selectedPlatforms.find(p => PLATFORM_CONFIG[p].limit === minLimit)!].name} - {minLimit}字)
              </span>
            )}
          </span>
          <span className={`text-xs font-mono ${isOverLimit ? 'text-red-400' : 'text-gray-300'}`}>
            {currentLength}
            {minLimit !== Infinity && ` / ${minLimit}`}
          </span>
        </div>
        <div className="char-count-bar-bg">
          <div
            className={`char-count-bar-fill ${isOverLimit ? 'over-limit' : ''}`}
            style={{ width: `${getCharPercentage()}%` }}
          ></div>
        </div>
      </div>

      <input
        type="text"
        placeholder="标题（可选）"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-transparent border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 transition-colors mb-3 text-sm"
      />

      <textarea
        ref={textareaRef}
        placeholder="在这里撰写你的内容...\n\n支持 #话题标签# 和 @用户 提及"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full h-40 bg-transparent border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 transition-colors resize-none text-sm leading-relaxed"
      />

      <div className="flex items-center gap-2 mt-3 mb-4">
        <button
          onClick={() => insertTag('#话题标签#')}
          className="toolbar-btn"
          title="插入话题标签"
        >
          <Hash size={16} />
          <span className="text-xs">话题</span>
        </button>
        <button
          onClick={() => insertTag('@用户 ')}
          className="toolbar-btn"
          title="@提醒"
        >
          <AtSign size={16} />
          <span className="text-xs">@提醒</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="toolbar-btn"
          title="上传图片"
        >
          <Image size={16} />
          <span className="text-xs">图片</span>
        </button>
        <div className="flex-1"></div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="schedule-input pl-8 pr-2 py-1 text-xs"
            />
          </div>
          <input
            type="time"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            className="schedule-input px-2 py-1 text-xs"
          />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />

      {(uploadingImages.length > 0 || compressedImages.length > 0) && (
        <div className="image-preview-grid mb-4">
          {uploadingImages.map((img) => (
            <div key={img.id} className="image-thumb uploading">
              <div className="wave-progress-container">
                <div className="wave-progress-fill" style={{ height: `${img.progress}%` }}>
                  <div className="wave"></div>
                  <div className="wave wave-delay"></div>
                </div>
                <span className="progress-text">{Math.round(img.progress)}%</span>
              </div>
            </div>
          ))}
          {compressedImages.map((img, index) => (
            <div key={index} className="image-thumb">
              <img src={img.thumbnail} alt={`预览 ${index + 1}`} />
              <button
                onClick={() => removeImage(index)}
                className="remove-btn"
                title="移除图片"
              >
                <X size={12} />
              </button>
              <div className="image-info">
                {formatFileSize(img.size)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="platform-toggles">
          {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((platform) => {
            const config = PLATFORM_CONFIG[platform];
            const isSelected = selectedPlatforms.includes(platform);
            return (
              <button
                key={platform}
                onClick={() => handlePlatformToggle(platform)}
                className={`platform-toggle ${isSelected ? 'active' : ''}`}
                style={{
                  '--platform-color': config.color,
                  '--platform-bg': config.bgColor,
                } as React.CSSProperties}
              >
                <span className="platform-icon">{platformIcons[platform]}</span>
                <span className="platform-name">{config.name}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!body.trim() || selectedPlatforms.length === 0 || isSubmitting || isOverLimit}
          className="submit-btn"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>保存中...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>保存排期</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
