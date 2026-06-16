import { useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Video, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store';
import { extractFrames } from '@/utils/frameExtractor';

export function VideoUploader() {
  const {
    appStatus,
    setVideoFile,
    setFrames,
    setAppStatus,
    setCurrentFrameIndex,
    setExportProgress,
  } = useAppStore();

  const processingRef = useRef(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (processingRef.current || acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (!file.type.startsWith('video/')) {
      alert('请上传视频文件');
      return;
    }

    processingRef.current = true;
    const url = URL.createObjectURL(file);

    setVideoFile(file, url);
    setAppStatus('processing');
    setExportProgress(0);

    try {
      const frames = await extractFrames(file, {
        onProgress: (current, total) => {
          setExportProgress(Math.round((current / total) * 100));
        },
      });

      setFrames(frames);
      setCurrentFrameIndex(0);
      setAppStatus('ready');
    } catch (err) {
      console.error('提取帧失败:', err);
      setAppStatus('idle');
      setVideoFile(null, null);
      alert('视频处理失败，请重试');
    } finally {
      processingRef.current = false;
    }
  }, [setVideoFile, setFrames, setAppStatus, setCurrentFrameIndex, setExportProgress]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': [] },
    maxFiles: 1,
    disabled: appStatus === 'processing',
  });

  return (
    <div
      {...getRootProps()}
      className={`relative rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer select-none btn-transition
        ${isDragActive ? 'upload-zone' : 'glass'}
        ${appStatus === 'processing' ? 'cursor-not-allowed opacity-70' : ''}
      `}
      style={{
        minHeight: 140,
        border: isDragActive ? 'none' : '2px dashed #333',
        borderColor: isDragActive ? 'transparent' : undefined,
      }}
    >
      <input {...getInputProps()} />

      {appStatus === 'processing' ? (
        <>
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--accent)' }} />
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            正在解析视频帧 {useAppStore.getState().exportProgress}%
          </div>
          <div className="w-full max-w-[200px] h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${useAppStore.getState().exportProgress}%`,
                background: 'var(--accent)',
              }}
            />
          </div>
        </>
      ) : isDragActive ? (
        <>
          <Video className="w-10 h-10" style={{ color: 'var(--accent)' }} />
          <div className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
            释放以上传视频
          </div>
        </>
      ) : (
        <>
          <Upload className="w-9 h-9" style={{ color: 'var(--text-muted)' }} />
          <div className="text-center">
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              拖拽视频到此处
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              或点击选择文件 · MP4 / WebM / MOV
            </div>
          </div>
        </>
      )}
    </div>
  );
}
