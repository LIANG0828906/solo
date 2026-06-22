import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosProgressEvent } from 'axios';
import { useRipple } from '@/hooks/useRipple';
import { validateFileSize, validateSDFContent, MAX_FILE_SIZE } from '@/utils/parseMolecule';
import type { MoleculeData } from '@/types';

type UploadStatus = 'idle' | 'uploading' | 'parsing' | 'success' | 'error';

export default function UploadPage() {
  const navigate = useNavigate();
  const createRipple = useRipple();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return `正在上传文件... ${progress}%`;
      case 'parsing':
        return '正在解析分子数据...';
      case 'success':
        return '上传成功！正在跳转...';
      case 'error':
        return statusMessage || '上传失败';
      default:
        return '';
    }
  };

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      const sizeValidation = validateFileSize(file.size);
      if (!sizeValidation.valid) {
        setError(sizeValidation.error || '文件大小超出限制');
        setStatus('error');
        return;
      }

      if (!file.name.toLowerCase().endsWith('.sdf') && !file.name.toLowerCase().endsWith('.mol')) {
        setError('文件格式不支持，请上传SDF或MOL格式文件');
        setStatus('error');
        return;
      }

      try {
        const textContent = await file.text();
        const contentValidation = validateSDFContent(textContent);
        if (!contentValidation.valid) {
          setError(contentValidation.error || '文件内容校验失败');
          setStatus('error');
          return;
        }
      } catch {
        setError('文件读取失败');
        setStatus('error');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      uploadAbortRef.current = new AbortController();

      try {
        setStatus('uploading');
        setProgress(0);

        const response = await axios.post<{ success: boolean; data?: MoleculeData; error?: string }>(
          '/api/molecule/upload',
          formData,
          {
            signal: uploadAbortRef.current.signal,
            onUploadProgress: (progressEvent: AxiosProgressEvent) => {
              if (progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setProgress(percent);
              }
            },
          }
        );

        if (response.data.success && response.data.data) {
          setStatus('parsing');
          setProgress(100);

          setTimeout(() => {
            setStatus('success');
            sessionStorage.setItem('moleculeData', JSON.stringify(response.data.data));
            setTimeout(() => {
              navigate('/viewer');
            }, 800);
          }, 300);
        } else {
          throw new Error(response.data.error || '服务器解析失败');
        }
      } catch (err: unknown) {
        if ((err as { code?: string }).code === 'ERR_CANCELED') {
          return;
        }
        const errorMessage = err instanceof Error ? err.message : '网络错误，请重试';
        setError(errorMessage);
        setStatusMessage(errorMessage);
        setStatus('error');
      }
    },
    [navigate]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    createRipple(e);
    if (status === 'uploading' || status === 'parsing') return;
    fileInputRef.current?.click();
  }, [createRipple, status]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
      e.target.value = '';
    },
    [processFile]
  );

  return (
    <div className="upload-page">
      <div className="upload-container">
        <h1 className="upload-title">分子结构可视化器</h1>
        <p className="upload-subtitle">上传 SDF 格式分子文件，探索三维结构</p>

        <div
          className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".sdf,.mol"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div className="upload-icon">⚛️</div>
          <div className="upload-text">
            {isDragging ? '释放文件以上传' : '拖拽文件到此处或点击选择'}
          </div>
          <div className="upload-hint">
            支持 .sdf / .mol 格式，最大 {MAX_FILE_SIZE / (1024 * 1024)}MB
          </div>
        </div>

        {(status === 'uploading' || status === 'parsing' || status === 'success' || status === 'error') && (
          <div className="upload-progress-container">
            <div className="upload-progress-bar">
              <div
                className="upload-progress-fill"
                style={{ width: `${status === 'parsing' || status === 'success' ? 100 : progress}%` }}
              />
            </div>
            <div className={`upload-status ${status === 'success' ? 'success' : status === 'error' ? 'error' : ''}`}>
              {getStatusText()}
            </div>
          </div>
        )}

        {error && status !== 'uploading' && status !== 'parsing' && (
          <div className="error-message">{error}</div>
        )}
      </div>
    </div>
  );
}
