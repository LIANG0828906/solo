import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Check, CheckCheck, Share2, Copy } from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';
import { AnnotationLayer } from '@/components/AnnotationBubble';
import { getBlob, blobToObjectUrl } from '@/utils/fileHelpers';
import type { Sketch } from '@/types';

export default function SharePage() {
  const { id: projectId, token } = useParams<{ id: string; token: string }>();
  const projects = useProjectStore((s) => s.projects);
  const getProjectSketches = useProjectStore((s) => s.getProjectSketches);
  const getSketchAnnotations = useProjectStore((s) => s.getSketchAnnotations);
  const addAnnotation = useProjectStore((s) => s.addAnnotation);
  const deleteAnnotation = useProjectStore((s) => s.deleteAnnotation);
  const confirmSketch = useProjectStore((s) => s.confirmSketch);
  const markAnnotationsRead = useProjectStore((s) => s.markAnnotationsRead);

  const project = projects.find((p) => p.id === projectId && p.shareToken === token);
  const sketches = projectId ? getProjectSketches(projectId) : [];
  const [selectedSketch, setSelectedSketch] = useState<Sketch | null>(null);
  const [watermarkUrl, setWatermarkUrl] = useState('');
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const urls: Record<string, string> = {};
    const loadThumbnails = async () => {
      for (const s of sketches) {
        const blob = await getBlob(s.thumbnailBlobKey);
        if (blob) {
          urls[s.id] = blobToObjectUrl(blob);
        }
      }
      setThumbnailUrls(urls);
    };
    loadThumbnails();
    return () => {
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [sketches.map((s) => s.id).join(',')]);

  useEffect(() => {
    let url = '';
    if (selectedSketch) {
      getBlob(selectedSketch.watermarkedBlobKey).then((blob) => {
        if (blob) {
          url = blobToObjectUrl(blob);
          setWatermarkUrl(url);
        }
      });
      markAnnotationsRead(selectedSketch.id);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
      setWatermarkUrl('');
    };
  }, [selectedSketch?.id, selectedSketch?.watermarkedBlobKey, markAnnotationsRead]);

  const handleAddAnnotation = useCallback(
    (sketchId: string, x: number, y: number, text: string) => {
      addAnnotation(sketchId, x, y, text, 'client');
    },
    [addAnnotation]
  );

  const handleDeleteAnnotation = useCallback(
    (annotationId: string) => {
      deleteAnnotation(annotationId);
    },
    [deleteAnnotation]
  );

  const handleConfirm = useCallback(
    (sketchId: string) => {
      confirmSketch(sketchId);
    },
    [confirmSketch]
  );

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  if (!project) {
    return (
      <div className="min-h-screen bg-[#ECF0F1] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#95A5A6] text-lg">链接无效或已过期</p>
        </div>
      </div>
    );
  }

  const selectedAnnotations = selectedSketch
    ? getSketchAnnotations(selectedSketch.id)
    : [];

  return (
    <div className="min-h-screen bg-[#ECF0F1]">
      <header className="bg-white border-b border-[#BDC3C7] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#2C3E50]">{project.name}</h1>
            <p className="text-xs text-[#95A5A6]">客户预览 · 点击草图添加批注</p>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#3498DB] rounded-lg hover:bg-[#3498DB]/10 transition-colors duration-200"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? '已复制' : '复制链接'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {!selectedSketch ? (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sketches.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSketch(s)}
                  className="relative bg-white rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="aspect-[4/3] bg-[#BDC3C7] overflow-hidden">
                    {thumbnailUrls[s.id] ? (
                      <img
                        src={thumbnailUrls[s.id]}
                        alt={s.fileName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#95A5A6] text-xs">
                        加载中...
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between">
                    <span className="text-xs text-[#2C3E50] truncate">
                      {s.fileName}
                    </span>
                    {s.isConfirmed && (
                      <CheckCheck size={14} className="text-[#27AE60] shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setSelectedSketch(null)}
                className="text-sm text-[#3498DB] hover:underline"
              >
                ← 返回列表
              </button>
              <button
                onClick={() => handleConfirm(selectedSketch.id)}
                disabled={selectedSketch.isConfirmed}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  selectedSketch.isConfirmed
                    ? 'bg-[#27AE60] text-white'
                    : 'bg-[#3498DB] text-white hover:bg-[#2980B9]'
                }`}
              >
                {selectedSketch.isConfirmed ? (
                  <>
                    <CheckCheck size={14} />
                    已确认通过
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    确认通过
                  </>
                )}
              </button>
            </div>

            <div className="bg-white rounded-lg border border-[#BDC3C7] overflow-hidden">
              <div className="relative inline-block w-full">
                {watermarkUrl ? (
                  <img
                    src={watermarkUrl}
                    alt={selectedSketch.fileName}
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="w-full h-64 bg-[#ECF0F1] flex items-center justify-center">
                    <p className="text-[#95A5A6] text-sm">加载中...</p>
                  </div>
                )}
                <AnnotationLayer
                  sketchId={selectedSketch.id}
                  annotations={selectedAnnotations}
                  onAdd={handleAddAnnotation}
                  onDelete={handleDeleteAnnotation}
                  onUpdate={() => {}}
                  authorType="client"
                />
              </div>
            </div>

            {selectedAnnotations.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-[#2C3E50]">批注记录</h4>
                {selectedAnnotations.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 bg-white rounded-lg border border-[#BDC3C7]"
                  >
                    <span className="text-xs text-[#95A5A6]">
                      {a.authorType === 'client' ? '客户' : '设计师'} ·{' '}
                      {new Date(a.createdAt).toLocaleString('zh-CN')}
                    </span>
                    <p className="text-sm text-[#2C3E50] mt-1 break-words">{a.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
