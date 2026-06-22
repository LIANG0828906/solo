import React, { useState, useEffect, useRef, useCallback } from 'react';
import VideoEditor from './components/VideoEditor';
import ChapterTimeline from './components/ChapterTimeline';
import { api } from './api';
import { generateMockChapters } from './utils/helpers';
import type { ProjectState, VideoMetadata, CropRange, Transition, Chapter, ExportData } from '../types';
import './styles/App.css';

const AUTO_SAVE_INTERVAL = 30000;

const App: React.FC = () => {
  const [project, setProject] = useState<ProjectState | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [cropRange, setCropRange] = useState<CropRange>({ start: 0, end: 0 });
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoEditorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const latest = await api.getLatestProject();
        setProject(latest);
        if (latest.videoMetadata) {
          setVideoUrl(latest.videoMetadata.url);
          setCropRange(latest.cropRange);
          setTransitions(latest.transitions);
          setChapters(latest.chapters);
        }
      } catch (e) {
        const newProject = await api.createProject();
        setProject(newProject);
      }
    };
    load();
  }, []);

  const saveProject = useCallback(async () => {
    if (!project) return;
    setIsSaving(true);
    try {
      await api.saveChapters(project.id, { chapters, transitions, cropRange });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      console.error('保存失败', e);
    } finally {
      setIsSaving(false);
    }
  }, [project, chapters, transitions, cropRange]);

  useEffect(() => {
    if (!project || !project.videoMetadata) return;
    const interval = setInterval(saveProject, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [project, saveProject]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;

    setIsUploading(true);
    setUploadProgress(0);

    const tempUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = tempUrl;

    tempVideo.onloadedmetadata = async () => {
      const duration = tempVideo.duration;
      URL.revokeObjectURL(tempUrl);

      try {
        const metadata = await api.uploadVideo(file, duration, (p) => {
          setUploadProgress(p);
        });

        await api.setProjectVideo(project.id, metadata.id);

        setChaptersLoading(true);
        const autoChapters = generateMockChapters(duration);

        setVideoUrl(metadata.url);
        setCropRange({ start: 0, end: duration });
        setTransitions([]);
        setChapters(autoChapters);
        setProject({
          ...project,
          videoMetadata: metadata,
          videoId: metadata.id,
          cropRange: { start: 0, end: duration },
          chapters: autoChapters,
          transitions: [],
        });

        setTimeout(() => setChaptersLoading(false), 500);
      } catch (err) {
        console.error('上传失败', err);
        alert('上传失败，请重试');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    };

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleJumpToTime = (time: number) => {
    const video = videoEditorRef.current?.querySelector('video');
    if (video) {
      const start = video.currentTime;
      const end = time;
      const duration = 500;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        video.currentTime = start + (end - start) * eased;
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
      video.play().catch(() => {});
    }
  };

  const handleExport = () => {
    if (!project || !project.videoMetadata) return;
    const exportData: ExportData = {
      videoMetadata: project.videoMetadata,
      cropRange,
      transitions,
      chapters,
      exportedAt: Date.now(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.videoMetadata.fileName.replace(/\.[^.]+$/, '')}_edit.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmCrop = () => {
    saveProject();
  };

  return (
    <div className={`app ${previewMode ? 'preview-mode' : ''}`}>
      {!previewMode && (
        <header className="app-header">
          <div className="header-left">
            <div className="logo">
              <span className="logo-icon">🎬</span>
              <span className="logo-text">智能视频编辑器</span>
            </div>
          </div>

          <div className="header-center">
            <div className="project-name">
              {project?.videoMetadata?.fileName || '未命名项目'}
            </div>
          </div>

          <div className="header-right">
            {isUploading && (
              <div className="upload-progress-mini">
                <div
                  className="progress-bar-mini"
                  style={{
                    width: `${uploadProgress}%`,
                    background: `linear-gradient(90deg, #0f3460 ${100 - uploadProgress}%, #4ade80)`,
                  }}
                />
                <span className="progress-text-mini">{uploadProgress}%</span>
              </div>
            )}

            {!project?.videoMetadata && !isUploading && (
              <button className="header-btn primary" onClick={handleUploadClick}>
                <span className="btn-icon">📤</span>
                <span>上传视频</span>
              </button>
            )}

            {project?.videoMetadata && !isUploading && (
              <button className="header-btn" onClick={handleConfirmCrop}>
                <span className="btn-icon">✂️</span>
                <span>确认裁剪</span>
              </button>
            )}

            <button
              className={`header-btn save-btn ${isSaving ? 'saving' : ''} ${saveSuccess ? 'success' : ''}`}
              onClick={saveProject}
              disabled={isSaving || !project?.videoMetadata}
            >
              <span className={`btn-icon ${isSaving ? 'spin' : ''}`}>
                {saveSuccess ? '✓' : isSaving ? '⟳' : '💾'}
              </span>
              <span>{saveSuccess ? '已保存' : '保存'}</span>
            </button>

            {project?.videoMetadata && (
              <button className="header-btn" onClick={handleExport}>
                <span className="btn-icon">⬇️</span>
                <span>导出</span>
              </button>
            )}

            {project?.videoMetadata && (
              <button className="header-btn accent" onClick={() => setPreviewMode(true)}>
                <span className="btn-icon">▶️</span>
                <span>预览</span>
              </button>
            )}
          </div>
        </header>
      )}

      <main className="app-main">
        <div className="editor-area" ref={videoEditorRef}>
          <VideoEditor
            videoUrl={videoUrl}
            metadata={project?.videoMetadata || null}
            cropRange={cropRange}
            transitions={transitions}
            onCropChange={setCropRange}
            onTransitionsChange={setTransitions}
            previewMode={previewMode}
            onJumpTo={handleJumpToTime}
          />
        </div>

        {!previewMode && !isMobile && (
          <ChapterTimeline
            chapters={chapters}
            onChaptersChange={setChapters}
            previewMode={previewMode}
            onJumpToTime={handleJumpToTime}
            isLoading={chaptersLoading}
          />
        )}

        {previewMode && (
          <div className="preview-chapter-panel">
            <ChapterTimeline
              chapters={chapters}
              onChaptersChange={setChapters}
              previewMode={previewMode}
              onJumpToTime={handleJumpToTime}
            />
            <button className="exit-preview-btn" onClick={() => setPreviewMode(false)}>
              ✕ 退出预览
            </button>
          </div>
        )}
      </main>

      {!previewMode && isMobile && (
        <>
          <button
            className="mobile-drawer-toggle"
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            {drawerOpen ? '▼ 收起章节' : '▲ 展开章节'}
          </button>
          <div className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>
            <ChapterTimeline
              chapters={chapters}
              onChaptersChange={setChapters}
              previewMode={previewMode}
              onJumpToTime={handleJumpToTime}
              isLoading={chaptersLoading}
            />
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {!project?.videoMetadata && (
        <div className="upload-fullscreen-overlay" onClick={handleUploadClick}>
          <div className="upload-card">
            <div className="upload-big-icon">🎬</div>
            <h2 className="upload-title">上传视频开始编辑</h2>
            <p className="upload-desc">支持 MP4 / WebM 格式，最大 500MB</p>
            <div className="upload-features">
              <div className="feature-item">
                <span className="feature-icon">✂️</span>
                <span>精准裁剪</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✨</span>
                <span>转场效果</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📋</span>
                <span>自动章节</span>
              </div>
            </div>
            {isUploading && (
              <div className="upload-progress-wrapper">
                <div className="upload-progress-track">
                  <div
                    className="upload-progress-fill"
                    style={{
                      width: `${uploadProgress}%`,
                      background: `linear-gradient(90deg, #0f3460 ${100 - uploadProgress}%, #4ade80)`,
                    }}
                  />
                </div>
                <span className="upload-progress-label">上传中 {uploadProgress}%</span>
              </div>
            )}
            {!isUploading && (
              <button className="upload-cta-btn" onClick={handleUploadClick}>
                选择视频文件
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
