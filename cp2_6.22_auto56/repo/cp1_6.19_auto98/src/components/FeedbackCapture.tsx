import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaImage,
  FaFileAudio,
  FaVideo,
  FaFileAlt,
  FaUpload,
  FaTimes,
  FaPlus,
  FaTrash,
} from 'react-icons/fa';
import {
  useFeedback,
  FeedbackType,
  Tag,
  generateId,
  getRandomTagColor,
  detectFileType,
  formatFileSize,
  FILE_LIMITS,
  PROGRESS_GRADIENT,
  Feedback,
} from '../store/feedbackReducer';

interface PendingItem {
  id: string;
  type: FeedbackType;
  fileName: string;
  content: string;
  fileSize: number;
  tags: Tag[];
  progress: number;
  completeFlash: boolean;
  tagInput: string;
  previewUrl?: string;
}

const FeedbackCapture: React.FC = () => {
  const { dispatch } = useFeedback();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [textContent, setTextContent] = useState('');
  const [textTags, setTextTags] = useState<Tag[]>([]);
  const [textTagInput, setTextTagInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [items]);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  };

  const simulateUpload = useCallback((itemId: string, fileSize: number) => {
    const baseDuration = Math.max(600, Math.min(4000, fileSize / 1024));
    const steps = 40;
    const stepDuration = baseDuration / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const progress = Math.min(1, step / steps);
      const flash = progress >= 1;

      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? {
                ...it,
                progress,
                completeFlash: flash ? true : it.completeFlash,
              }
            : it
        )
      );

      if (flash) {
        setTimeout(() => {
          setItems((prev) =>
            prev.map((it) =>
              it.id === itemId ? { ...it, completeFlash: false } : it
            )
          );
        }, 300);
      }

      if (step >= steps) clearInterval(interval);
    }, stepDuration);
  }, []);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArr = Array.from(files);

      fileArr.forEach((file) => {
        const type = detectFileType(file);
        if (!type) {
          showError(`不支持的文件类型: ${file.name}`);
          return;
        }

        const limit = FILE_LIMITS[type];
        if (file.size > limit) {
          const typeName =
            type === 'image' ? '图片' : type === 'audio' ? '音频' : '视频';
          showError(
            `${typeName}文件 "${file.name}" 超过大小限制 (${formatFileSize(
              limit
            )})`
          );
          return;
        }

        const previewUrl = URL.createObjectURL(file);
        const content = previewUrl;

        const newItem: PendingItem = {
          id: generateId(),
          type,
          fileName: file.name,
          content,
          fileSize: file.size,
          tags: [],
          progress: 0,
          completeFlash: false,
          tagInput: '',
          previewUrl,
        };

        setItems((prev) => [...prev, newItem]);
        simulateUpload(newItem.id, file.size);
      });
    },
    [simulateUpload]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleTagKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentTags: Tag[],
    setter: (tags: Tag[]) => void,
    inputSetter: (v: string) => void
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = (e.target as HTMLInputElement).value.trim();
      if (!val) return;
      if (currentTags.length >= 5) {
        showError('最多只能添加5个标签');
        return;
      }
      if (currentTags.some((t) => t.name === val)) {
        inputSetter('');
        return;
      }
      setter([
        ...currentTags,
        { name: val, color: getRandomTagColor() },
      ]);
      inputSetter('');
    }
  };

  const removeTag = (
    tagName: string,
    currentTags: Tag[],
    setter: (tags: Tag[]) => void
  ) => {
    setter(currentTags.filter((t) => t.name !== tagName));
  };

  const submitItem = (item: PendingItem) => {
    if (item.progress < 1) {
      showError('请等待上传完成');
      return;
    }
    const feedback: Feedback = {
      id: generateId(),
      type: item.type,
      fileName: item.fileName,
      content: item.content,
      tags: item.tags,
      status: 'pending',
      fileSize: item.fileSize,
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_FEEDBACK', payload: feedback });
    setItems((prev) => prev.filter((it) => it.id !== item.id));
  };

  const removeItem = (id: string, previewUrl?: string) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const submitText = () => {
    const trimmed = textContent.trim();
    if (!trimmed) {
      showError('请输入文字内容');
      return;
    }
    if (trimmed.length > FILE_LIMITS.text) {
      showError(`文字内容不能超过${FILE_LIMITS.text}字`);
      return;
    }
    const feedback: Feedback = {
      id: generateId(),
      type: 'text',
      fileName: trimmed.slice(0, 30) + (trimmed.length > 30 ? '...' : ''),
      content: trimmed,
      tags: textTags,
      status: 'pending',
      fileSize: trimmed.length,
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_FEEDBACK', payload: feedback });
    setTextContent('');
    setTextTags([]);
  };

  const getTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case 'image':
        return FaImage;
      case 'audio':
        return FaFileAudio;
      case 'video':
        return FaVideo;
      case 'text':
        return FaFileAlt;
    }
  };

  const getTypeName = (type: FeedbackType) => {
    switch (type) {
      case 'image':
        return '图片';
      case 'audio':
        return '音频';
      case 'video':
        return '视频';
      case 'text':
        return '文字';
    }
  };

  return (
    <div className="capture-container">
      <style>{captureStyles}</style>

      <h2 className="page-title">反馈收录</h2>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="error-toast"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <FaUpload className="upload-icon" />
        <p className="drop-text">
          拖拽文件到此处，或 <span>点击选择文件</span>
        </p>
        <p className="drop-hint">
          支持 图片（&lt;5MB）· 音频（&lt;10MB）· 视频（&lt;30MB）
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,audio/*,video/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) =>
            e.target.files && handleFiles(e.target.files)
          }
        />
      </div>

      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="items-section"
          >
            <div className="section-label">待提交的文件</div>
            <div className="items-grid">
              {items.map((item) => {
                const Icon = getTypeIcon(item.type);
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`item-card ${
                      item.completeFlash ? 'flash' : ''
                    }`}
                  >
                    <button
                      className="item-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id, item.previewUrl);
                      }}
                    >
                      <FaTimes />
                    </button>

                    <div className="item-body">
                      <div className="item-preview">
                        {item.type === 'image' && item.previewUrl ? (
                          <img src={item.previewUrl} alt="" />
                        ) : (
                          <Icon className="type-icon" />
                        )}
                        <div className="progress-ring-wrap">
                          <svg
                            viewBox="0 0 44 44"
                            className={`progress-ring ${
                              item.progress >= 1 ? 'done' : ''
                            }`}
                          >
                            <defs>
                              <linearGradient
                                id={`grad-${item.id}`}
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                              >
                                <stop
                                  offset="0%"
                                  stopColor={PROGRESS_GRADIENT.start}
                                />
                                <stop
                                  offset="100%"
                                  stopColor={PROGRESS_GRADIENT.end}
                                />
                              </linearGradient>
                            </defs>
                            <circle
                              cx="22"
                              cy="22"
                              r="18"
                              fill="none"
                              stroke="#ECF0F1"
                              strokeWidth="4"
                            />
                            <circle
                              cx="22"
                              cy="22"
                              r="18"
                              fill="none"
                              stroke={`url(#grad-${item.id})`}
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeDasharray={
                                2 * Math.PI * 18 * item.progress
                              }
                              strokeDashoffset={0}
                              transform="rotate(-90 22 22)"
                              style={{
                                transition:
                                  'stroke-dasharray 0.1s linear',
                              }}
                            />
                          </svg>
                          <span className="progress-text">
                            {Math.round(item.progress * 100)}%
                          </span>
                        </div>
                      </div>

                      <div className="item-info">
                        <div className="item-filename" title={item.fileName}>
                          {item.fileName}
                        </div>
                        <div className="item-meta">
                          <span
                            className="type-tag"
                            style={{
                              background: PROGRESS_GRADIENT.start,
                            }}
                          >
                            {getTypeName(item.type)}
                          </span>
                          <span>
                            {formatFileSize(item.fileSize)}
                          </span>
                        </div>

                        <div className="tags-row">
                          {item.tags.map((tag) => (
                            <span
                              key={tag.name}
                              className="tag-chip"
                              style={{ background: tag.color }}
                            >
                              {tag.name}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeTag(
                                    tag.name,
                                    item.tags,
                                    (newTags) =>
                                      setItems((prev) =>
                                        prev.map((it) =>
                                          it.id === item.id
                                            ? { ...it, tags: newTags }
                                            : it
                                        )
                                      )
                                  );
                                }}
                              >
                                <FaTimes />
                              </button>
                            </span>
                          ))}
                          {item.tags.length < 5 && (
                            <input
                              className="tag-input"
                              placeholder={
                                item.tags.length === 0
                                  ? '添加标签（回车）'
                                  : '+标签'
                              }
                              value={item.tagInput}
                              onChange={(e) =>
                                setItems((prev) =>
                                  prev.map((it) =>
                                    it.id === item.id
                                      ? {
                                          ...it,
                                          tagInput: e.target.value,
                                        }
                                      : it
                                  )
                                )
                              }
                              onKeyDown={(e) =>
                                handleTagKeyDown(
                                  e,
                                  item.tags,
                                  (newTags) =>
                                    setItems((prev) =>
                                      prev.map((it) =>
                                        it.id === item.id
                                          ? { ...it, tags: newTags }
                                          : it
                                      )
                                    ),
                                  (v) =>
                                    setItems((prev) =>
                                      prev.map((it) =>
                                        it.id === item.id
                                          ? { ...it, tagInput: v }
                                          : it
                                      )
                                    )
                                )
                              }
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      className="submit-btn"
                      disabled={item.progress < 1}
                      onClick={() => submitItem(item)}
                    >
                      <FaPlus /> 提交
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-section">
        <div className="section-label">或直接粘贴文字</div>
        <div className="text-card">
          <textarea
            ref={textAreaRef}
            className="text-input"
            placeholder="将用户的文字反馈粘贴到此处（最多 2000 字）..."
            value={textContent}
            onChange={(e) => {
              if (e.target.value.length <= FILE_LIMITS.text) {
                setTextContent(e.target.value);
              }
            }}
            maxLength={FILE_LIMITS.text}
          />
          <div className="text-footer">
            <div className="tags-row">
              {textTags.map((tag) => (
                <span
                  key={tag.name}
                  className="tag-chip"
                  style={{ background: tag.color }}
                >
                  {tag.name}
                  <button
                    onClick={() => removeTag(tag.name, textTags, setTextTags)}
                  >
                    <FaTimes />
                  </button>
                </span>
              ))}
              {textTags.length < 5 && (
                <input
                  className="tag-input"
                  placeholder={
                    textTags.length === 0 ? '添加标签（回车）' : '+标签'
                  }
                  value={textTagInput}
                  onChange={(e) => setTextTagInput(e.target.value)}
                  onKeyDown={(e) =>
                    handleTagKeyDown(
                      e,
                      textTags,
                      setTextTags,
                      setTextTagInput
                    )
                  }
                />
              )}
            </div>
            <div className="text-actions">
              <span className="char-count">
                {textContent.length} / {FILE_LIMITS.text}
              </span>
              <button
                className="submit-btn"
                disabled={!textContent.trim()}
                onClick={submitText}
              >
                <FaPlus /> 提交文字反馈
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackCapture;

const captureStyles = `
.capture-container {
  padding: 24px 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #2C3E50;
  margin: 0 0 24px 0;
}

.error-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  background: #E74C3C;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(231,76,60,0.3);
  font-size: 14px;
}

.drop-zone {
  border: 2px dashed #BDC3C7;
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease-out;
  background: #FAFBFC;
}

.drop-zone:hover,
.drop-zone.dragging {
  border-color: #2C3E50;
  background: #F7F9FC;
  transform: scale(1.005);
}

.drop-zone.dragging {
  border-color: #1ABC9C;
  background: #EBFBF8;
}

.upload-icon {
  font-size: 48px;
  color: #2C3E50;
  margin-bottom: 16px;
  opacity: 0.6;
}

.drop-text {
  font-size: 16px;
  color: #2C3E50;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.drop-text span {
  color: #1ABC9C;
  text-decoration: underline;
}

.drop-hint {
  font-size: 13px;
  color: #7F8C8D;
  margin: 0;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: #2C3E50;
  margin: 32px 0 12px 0;
}

.items-section {
  overflow: hidden;
}

.items-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-card {
  position: relative;
  background: #F7F9FC;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease-out;
}

.item-card:hover {
  border-color: #D5DBDF;
}

.item-card.flash {
  animation: flashRing 0.3s ease-out;
}

@keyframes flashRing {
  0% { box-shadow: 0 0 0 0 rgba(26,188,156,0.7); }
  50% { box-shadow: 0 0 0 8px rgba(26,188,156,0); }
  100% { box-shadow: 0 0 0 0 rgba(26,188,156,0); }
}

.item-delete {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(231,76,60,0.1);
  color: #E74C3C;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-out;
}

.item-delete:hover {
  background: #E74C3C;
  color: white;
}

.item-body {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.item-preview {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  background: #ECF0F1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.item-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.type-icon {
  font-size: 28px;
  color: #7F8C8D;
}

.progress-ring-wrap {
  position: absolute;
  bottom: -8px;
  right: -8px;
  width: 36px;
  height: 36px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  position: absolute;
  width: 100%;
  height: 100%;
}

.progress-text {
  font-size: 9px;
  font-weight: 600;
  color: #2C3E50;
  z-index: 1;
}

.progress-ring.done + .progress-text {
  color: #1ABC9C;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-filename {
  font-size: 14px;
  font-weight: 600;
  color: #2C3E50;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #7F8C8D;
  margin-bottom: 10px;
}

.type-tag {
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: white;
}

.tag-chip button {
  background: rgba(255,255,255,0.3);
  border: none;
  color: white;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  padding: 0;
  transition: background 0.2s ease-out;
}

.tag-chip button:hover {
  background: rgba(255,255,255,0.5);
}

.tag-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 12px;
  padding: 4px 8px;
  border-bottom: 1px dashed #BDC3C7;
  min-width: 100px;
  color: #2C3E50;
}

.tag-input::placeholder {
  color: #BDC3C7;
}

.submit-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #2C3E50, #1ABC9C);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease-out;
  margin-top: 12px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(44,62,80,0.3);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.text-section {
  margin-top: 16px;
}

.text-card {
  background: #F7F9FC;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #ECF0F1;
}

.text-input {
  width: 100%;
  min-height: 120px;
  border: 1px solid #ECF0F1;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #2C3E50;
  background: white;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.3s ease-out;
  font-family: inherit;
}

.text-input:focus {
  border-color: #2C3E50;
}

.text-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  gap: 16px;
  flex-wrap: wrap;
}

.text-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.char-count {
  font-size: 12px;
  color: #7F8C8D;
}

@media (max-width: 768px) {
  .capture-container {
    padding: 16px;
  }

  .item-body {
    flex-direction: column;
  }

  .text-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .text-actions {
    width: 100%;
    justify-content: space-between;
  }
}
`;
