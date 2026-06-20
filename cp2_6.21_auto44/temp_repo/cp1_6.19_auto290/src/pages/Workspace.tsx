import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Check,
  CheckCheck,
  Package,
  Image as ImageIcon,
  MessageSquare,
  GitCompare,
  X,
  AlertCircle,
} from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';
import SketchCard from '@/components/SketchCard';
import { AnnotationLayer } from '@/components/AnnotationBubble';
import VersionSlider from '@/components/VersionSlider';
import { getBlob, blobToObjectUrl, createZip, formatFileSize } from '@/utils/fileHelpers';
import type { Sketch, TabType, Annotation } from '@/types';

interface WorkspaceProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function Workspace({ activeTab, onTabChange }: WorkspaceProps) {
  const { id: projectId } = useParams<{ id: string }>();
  const {
    projects,
    currentProjectId,
    sketches,
    setCurrentProject,
    getProjectSketches,
    getSketchAnnotations,
    getSketchVersions,
    uploadSketches,
    addAnnotation,
    deleteAnnotation,
    uploadNewVersion,
    confirmSketch,
    unconfirmSketch,
    toggleDeliverySelect,
    selectAllDelivery,
    clearDeliverySelection,
    selectedDeliveryIds,
    isLoading,
  } = useProjectStore();

  const [selectedSketch, setSelectedSketch] = useState<Sketch | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [annotationUrl, setAnnotationUrl] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPackModal, setShowPackModal] = useState(false);
  const [packSizes, setPackSizes] = useState<{ name: string; size: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const versionInputRef = useRef<HTMLInputElement>(null);

  const project = projects.find((p) => p.id === projectId);
  const projectSketches = projectId ? getProjectSketches(projectId) : [];
  const confirmedSketches = projectSketches.filter((s) => s.isConfirmed);
  const projectAnnotations = selectedSketch
    ? getSketchAnnotations(selectedSketch.id)
    : [];

  useEffect(() => {
    if (projectId && currentProjectId !== projectId) {
      setCurrentProject(projectId);
    }
  }, [projectId, currentProjectId, setCurrentProject]);

  useEffect(() => {
    let url = '';
    if (selectedSketch) {
      getBlob(selectedSketch.watermarkedBlobKey).then((blob) => {
        if (blob) {
          url = blobToObjectUrl(blob);
          setPreviewUrl(url);
        }
      });
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
      setPreviewUrl('');
    };
  }, [selectedSketch?.watermarkedBlobKey]);

  useEffect(() => {
    let url = '';
    if (selectedSketch) {
      getBlob(selectedSketch.originalBlobKey).then((blob) => {
        if (blob) {
          url = blobToObjectUrl(blob);
          setAnnotationUrl(url);
        }
      });
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
      setAnnotationUrl('');
    };
  }, [selectedSketch?.originalBlobKey]);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !projectId) return;
      await uploadSketches(projectId, Array.from(files));
      setShowUploadModal(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [projectId, uploadSketches]
  );

  const handleSketchClick = useCallback((sketch: Sketch) => {
    setSelectedSketch(sketch);
    onTabChange('annotations');
  }, []);

  const handleAnnotationClick = useCallback((sketch: Sketch) => {
    setSelectedSketch(sketch);
    onTabChange('annotations');
  }, []);

  const handleAddAnnotation = useCallback(
    (sketchId: string, x: number, y: number, text: string) => {
      addAnnotation(sketchId, x, y, text, 'designer');
    },
    [addAnnotation]
  );

  const handleDeleteAnnotation = useCallback(
    (annotationId: string) => {
      deleteAnnotation(annotationId);
    },
    [deleteAnnotation]
  );

  const handleUpdateAnnotation = useCallback(
    (_annotationId: string, _text: string) => {
      // annotation text update handled inline
    },
    []
  );

  const handleVersionUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && selectedSketch) {
        await uploadNewVersion(selectedSketch.id, file);
      }
      if (versionInputRef.current) versionInputRef.current.value = '';
    },
    [selectedSketch, uploadNewVersion]
  );

  const handleConfirmSketch = useCallback(
    (sketchId: string) => {
      const sketch = projectSketches.find((s) => s.id === sketchId);
      if (sketch?.isConfirmed) {
        unconfirmSketch(sketchId);
      } else {
        confirmSketch(sketchId);
      }
    },
    [projectSketches, confirmSketch, unconfirmSketch]
  );

  const handlePack = useCallback(async () => {
    const sizes: { name: string; size: number }[] = [];
    for (const sid of selectedDeliveryIds) {
      const sketch = projectSketches.find((s) => s.id === sid);
      if (sketch) {
        const blob = await getBlob(sketch.originalBlobKey);
        sizes.push({ name: sketch.fileName, size: blob?.size ?? 0 });
      }
    }
    setPackSizes(sizes);
    setShowPackModal(true);
  }, [selectedDeliveryIds, projectSketches]);

  const handleConfirmPack = useCallback(async () => {
    const files: { blob: Blob; name: string }[] = [];
    for (const sid of selectedDeliveryIds) {
      const sketch = projectSketches.find((s) => s.id === sid);
      if (sketch) {
        const blob = await getBlob(sketch.originalBlobKey);
        if (blob) files.push({ blob, name: sketch.fileName });
      }
    }
    if (files.length > 0) {
      const zip = await createZip(files);
      const { saveAs } = await import('file-saver');
      saveAs(zip, `${project?.name ?? 'delivery'}_交付包.zip`);
    }
    setShowPackModal(false);
    clearDeliverySelection();
  }, [selectedDeliveryIds, projectSketches, project, clearDeliverySelection]);

  const selectedSketchVersions = selectedSketch
    ? getSketchVersions(selectedSketch.id)
    : [];
  const previousVersion =
    selectedSketchVersions.length > 1
      ? selectedSketchVersions[selectedSketchVersions.length - 2]
      : null;

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle size={48} className="text-[#BDC3C7] mx-auto mb-3" />
          <p className="text-[#95A5A6]">项目不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        onChange={handleUpload}
        className="hidden"
      />
      <input
        ref={versionInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleVersionUpload}
        className="hidden"
      />

      <div className="p-6 flex-1 overflow-y-auto">
        {activeTab === 'sketches' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#2C3E50]">{project.name}</h2>
                <p className="text-xs text-[#95A5A6] mt-0.5">
                  客户：{project.clientName || '未指定'} · 共 {projectSketches.length} 张草图
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-[#3498DB] text-white rounded-lg hover:bg-[#2980B9] transition-colors duration-200 text-sm font-medium disabled:opacity-50"
              >
                <Upload size={14} />
                {isLoading ? '上传中...' : '批量上传'}
              </button>
            </div>

            {projectSketches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ImageIcon size={48} className="text-[#BDC3C7] mb-3" />
                <p className="text-[#95A5A6] text-sm mb-3">还没有草图，点击上方按钮上传</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {projectSketches.map((s) => (
                  <SketchCard
                    key={s.id}
                    sketch={s}
                    onClick={handleSketchClick}
                    onAnnotationClick={handleAnnotationClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'annotations' && (
          <div>
            {selectedSketch ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-[#2C3E50]">
                      {selectedSketch.fileName}
                    </h3>
                    <p className="text-xs text-[#95A5A6]">
                      {projectAnnotations.length} 条批注 · 点击图片添加批注
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConfirmSketch(selectedSketch.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        selectedSketch.isConfirmed
                          ? 'bg-[#27AE60] text-white'
                          : 'bg-white border border-[#BDC3C7] text-[#2C3E50] hover:bg-[#ECF0F1]'
                      }`}
                    >
                      {selectedSketch.isConfirmed ? (
                        <>
                          <CheckCheck size={14} />
                          已确认
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          确认通过
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        onTabChange('sketches');
                        setSelectedSketch(null);
                      }}
                      className="p-1.5 rounded hover:bg-[#ECF0F1] transition-colors duration-200 text-[#95A5A6]"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-[#BDC3C7] overflow-hidden">
                  <div className="relative inline-block w-full">
                    {annotationUrl ? (
                      <img
                        src={annotationUrl}
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
                      annotations={projectAnnotations}
                      onAdd={handleAddAnnotation}
                      onDelete={handleDeleteAnnotation}
                      onUpdate={handleUpdateAnnotation}
                      authorType="designer"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-[#2C3E50]">批注列表</h4>
                  {projectAnnotations.length === 0 ? (
                    <p className="text-xs text-[#95A5A6] py-4 text-center">
                      暂无批注，点击图片上方添加
                    </p>
                  ) : (
                    projectAnnotations.map((a: Annotation) => (
                      <div
                        key={a.id}
                        className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[#BDC3C7]"
                      >
                        <div className="w-6 h-6 rounded-full bg-[#3498DB]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <MessageSquare size={12} className="text-[#3498DB]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-[#2C3E50]">
                              {a.authorType === 'client' ? '客户' : '设计师'}
                            </span>
                            <span className="text-[10px] text-[#BDC3C7]">
                              {new Date(a.createdAt).toLocaleString('zh-CN')}
                            </span>
                          </div>
                          <p className="text-sm text-[#2C3E50] break-words">
                            {a.text}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteAnnotation(a.id)}
                          className="p-1 rounded hover:bg-[#FDEDEC] transition-colors duration-200 text-[#E74C3C]/50 hover:text-[#E74C3C] shrink-0"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <MessageSquare size={48} className="text-[#BDC3C7] mb-3" />
                <p className="text-[#95A5A6] text-sm">请先在草图浏览中选择一张草图</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'versions' && (
          <div>
            {selectedSketch ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-[#2C3E50]">
                      {selectedSketch.fileName} - 版本对比
                    </h3>
                    <p className="text-xs text-[#95A5A6]">
                      共 {selectedSketchVersions.length} 个版本
                    </p>
                  </div>
                  <button
                    onClick={() => versionInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3498DB] text-white rounded-lg hover:bg-[#2980B9] transition-colors duration-200 text-sm font-medium"
                  >
                    <Upload size={14} />
                    上传新版
                  </button>
                </div>

                {selectedSketchVersions.length > 1 && (
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {selectedSketchVersions.map((v) => (
                      <span
                        key={v.id}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          v.id === selectedSketch.currentVersionId
                            ? 'bg-[#3498DB] text-white'
                            : 'bg-white text-[#95A5A6] border border-[#BDC3C7]'
                        }`}
                      >
                        V{v.versionNumber}
                      </span>
                    ))}
                  </div>
                )}

                <VersionSlider
                  sketch={selectedSketch}
                  previousVersionKey={previousVersion?.watermarkedBlobKey ?? null}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <GitCompare size={48} className="text-[#BDC3C7] mb-3" />
                <p className="text-[#95A5A6] text-sm">请先选择一张草图查看版本对比</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'delivery' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#2C3E50]">交付清单</h2>
                <p className="text-xs text-[#95A5A6] mt-0.5">
                  已确认 {confirmedSketches.length} / {projectSketches.length} 张草图
                </p>
              </div>
              <div className="flex items-center gap-2">
                {confirmedSketches.length > 0 && (
                  <>
                    <button
                      onClick={selectAllDelivery}
                      className="px-3 py-1.5 text-sm text-[#3498DB] rounded-lg hover:bg-[#3498DB]/10 transition-colors duration-200"
                    >
                      全选
                    </button>
                    <button
                      onClick={handlePack}
                      disabled={selectedDeliveryIds.length === 0}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#27AE60] text-white rounded-lg hover:bg-[#219A52] transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Package size={14} />
                      一键打包
                    </button>
                  </>
                )}
              </div>
            </div>

            {confirmedSketches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package size={48} className="text-[#BDC3C7] mb-3" />
                <p className="text-[#95A5A6] text-sm">暂无已确认的草图</p>
                <p className="text-[10px] text-[#BDC3C7] mt-1">
                  客户确认通过后草图会出现在这里
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {confirmedSketches.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[#BDC3C7] hover:border-[#3498DB]/30 transition-colors duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDeliveryIds.includes(s.id)}
                      onChange={() => toggleDeliverySelect(s.id)}
                      className="w-4 h-4 rounded border-[#BDC3C7] text-[#3498DB] focus:ring-[#3498DB]"
                    />
                    <ImageIcon size={16} className="text-[#95A5A6] shrink-0" />
                    <span className="flex-1 text-sm text-[#2C3E50] truncate">
                      {s.fileName}
                    </span>
                    <button
                      onClick={() => unconfirmSketch(s.id)}
                      className="text-xs text-[#E74C3C] hover:underline"
                    >
                      撤回确认
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setShowPackModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#2C3E50]">确认打包</h3>
                <button
                  onClick={() => setShowPackModal(false)}
                  className="p-1 rounded hover:bg-[#ECF0F1] transition-colors duration-200 text-[#95A5A6]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 mb-4">
                {packSizes.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 bg-[#ECF0F1] rounded text-sm"
                  >
                    <span className="text-[#2C3E50] truncate mr-4">{f.name}</span>
                    <span className="text-[#95A5A6] shrink-0">
                      {formatFileSize(f.size)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between py-2 border-t border-[#BDC3C7] mb-4">
                <span className="text-sm font-medium text-[#2C3E50]">总大小</span>
                <span className="text-sm font-bold text-[#3498DB]">
                  {formatFileSize(packSizes.reduce((sum, f) => sum + f.size, 0))}
                </span>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowPackModal(false)}
                  className="px-4 py-2 text-sm text-[#95A5A6] rounded-lg hover:bg-[#ECF0F1] transition-colors duration-200"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmPack}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#27AE60] text-white rounded-lg hover:bg-[#219A52] transition-colors duration-200"
                >
                  <Package size={14} />
                  确认打包下载
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
