import { useCallback, useRef, useState, DragEvent, ChangeEvent } from 'react';
import { useMixStore } from '../store';

const MAX_FILES = 6;

export function FileUploader() {
  const [dragActive, setDragActive] = useState(false);
  const { tracks, addTrack } = useMixStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = MAX_FILES - tracks.length;
  const disabled = remaining <= 0;

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    const allowed = files.slice(0, Math.max(0, remaining));
    for (const f of allowed) {
      await addTrack(f);
    }
    if (inputRef.current) inputRef.current.value = '';
  }, [addTrack, remaining]);

  const onDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragActive(true);
  }, [disabled]);

  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }, [disabled, handleFiles]);

  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  return (
    <div
      className={`uploader ${dragActive ? 'drag-active' : ''}`}
      onDragOver={onDrag}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="uploader-icon">🎵</div>
      <p className="uploader-text">
        {disabled ? '已达到最大数量 (6/6)' : '拖拽音频文件到此处，或点击选择'}
      </p>
      <p className="uploader-sub">
        支持 MP3 / WAV 格式，单文件不超过 10MB
        {!disabled && `，还可添加 ${remaining} 个`}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav,audio/mpeg,audio/wav,audio/wave"
        multiple
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
}

export default FileUploader;
