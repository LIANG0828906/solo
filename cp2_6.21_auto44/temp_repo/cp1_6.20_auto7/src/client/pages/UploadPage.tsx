import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Image, Link2, Check, Copy, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';

interface UploadForm {
  title: string;
  description: string;
  coverImage: string;
  videoUrl: string;
}

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<UploadForm>({
    title: '',
    description: '',
    coverImage: '',
    videoUrl: ''
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdDemoId, setCreatedDemoId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        processImage(file);
      }
    }
  }, []);

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setForm((prev) => ({ ...prev, coverImage: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title || !form.description || !form.coverImage || !form.videoUrl) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();
      setCreatedDemoId(data.demoId);
      setShowSuccess(true);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e94560', '#ff6b8a', '#ff8fa3']
      });
    } catch (error) {
      console.error('Failed to upload demo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyDemoUrl = async () => {
    if (createdDemoId) {
      const url = `${window.location.origin}/demo/${createdDemoId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (showSuccess && createdDemoId) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
        <div className="bg-[#16213e] rounded-2xl p-8 max-w-md w-full text-center border border-white/10">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Demo上传成功！</h2>
          <p className="text-gray-400 mb-6">您的游戏Demo已发布，现在可以分享给玩家了</p>
          
          <div className="bg-[#1a1a2e] rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">分享链接</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[#e94560] text-sm truncate">
                {`${window.location.origin}/demo/${createdDemoId}`}
              </code>
              <button
                onClick={copyDemoUrl}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(`/detail/${createdDemoId}`)}
              className="flex-1 bg-[#e94560] hover:bg-[#e94560]/90 text-white py-3 rounded-xl font-medium transition-all"
            >
              查看详情
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-[#1a1a2e] border border-white/10 text-white py-3 rounded-xl font-medium hover:bg-white/5 transition-all"
            >
              返回仪表盘
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <header className="bg-[#16213e] border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回
            </button>
            <h1 className="text-xl font-bold text-white">上传新Demo</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-[#16213e] rounded-2xl p-6 border border-white/10">
            <label className="block text-white font-semibold mb-3">
              标题 <span className="text-[#e94560]">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="输入您的游戏Demo名称"
              className="w-full px-4 py-3 bg-[#1a1a2e] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#e94560] focus:ring-1 focus:ring-[#e94560] transition-all"
              required
            />
          </div>

          <div className="bg-[#16213e] rounded-2xl p-6 border border-white/10">
            <label className="block text-white font-semibold mb-3">
              描述 <span className="text-[#e94560]">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="介绍一下您的游戏Demo..."
              rows={4}
              className="w-full px-4 py-3 bg-[#1a1a2e] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#e94560] focus:ring-1 focus:ring-[#e94560] resize-none transition-all"
              required
            />
          </div>

          <div className="bg-[#16213e] rounded-2xl p-6 border border-white/10">
            <label className="block text-white font-semibold mb-3">
              封面图 <span className="text-[#e94560]">*</span>
            </label>
            
            {form.coverImage ? (
              <div className="relative">
                <img
                  src={form.coverImage}
                  alt="Preview"
                  className="w-full aspect-video object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, coverImage: '' }))}
                  className="absolute top-3 right-3 bg-black/60 text-white px-4 py-2 rounded-lg hover:bg-black/80 transition-colors"
                >
                  重新上传
                </button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300',
                  isDragging
                    ? 'border-[#e94560] bg-[#e94560]/10'
                    : 'border-white/20 hover:border-[#e94560]/50 hover:bg-white/5'
                )}
              >
                <Upload className={cn('w-12 h-12 mx-auto mb-4 transition-colors', isDragging ? 'text-[#e94560]' : 'text-gray-500')} />
                <p className="text-white font-medium mb-2">拖拽图片到此处上传</p>
                <p className="text-gray-500 text-sm mb-4">或点击选择文件</p>
                <p className="text-gray-600 text-xs">支持 JPG、PNG、WebP 格式</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="bg-[#16213e] rounded-2xl p-6 border border-white/10">
            <label className="block text-white font-semibold mb-3">
              视频链接 <span className="text-[#e94560]">*</span>
            </label>
            <div className="relative">
              <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="url"
                value={form.videoUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="https://example.com/video.mp4"
                className="w-full pl-12 pr-4 py-3 bg-[#1a1a2e] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#e94560] focus:ring-1 focus:ring-[#e94560] transition-all"
                required
              />
            </div>
            <p className="text-gray-500 text-sm mt-2">输入视频文件URL，支持mp4格式</p>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-[#16213e] border border-white/10 text-white rounded-xl font-medium hover:bg-white/5 transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !form.title || !form.description || !form.coverImage || !form.videoUrl}
              className={cn(
                'px-8 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2',
                form.title && form.description && form.coverImage && form.videoUrl && !isSubmitting
                  ? 'bg-[#e94560] text-white hover:bg-[#e94560]/90 hover:shadow-lg hover:shadow-[#e94560]/30'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Image className="w-5 h-5" />
                  发布Demo
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
