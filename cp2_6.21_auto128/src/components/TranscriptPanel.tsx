import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useUploadStore } from '@/stores/uploadStore';
import { useSearchStore } from '@/stores/searchStore';
import { formatTime, formatSRTTime } from '@/utils/mockApi';
import type { TranscriptSentence, ExportFormat } from '@/types';
import styles from './TranscriptPanel.module.css';

const SENTENCE_HEIGHT = 80;
const VIRTUAL_THRESHOLD = 100;

export const TranscriptPanel: React.FC = () => {
  const { transcript, getSpeakerById, status } = useUploadStore();
  const {
    keyword,
    matchedSentenceIds,
    activeSentenceId,
    timelineMarkers,
    setKeyword,
    setActiveSentence,
    clearSearch,
  } = useSearchStore();

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('txt');
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [activeMarkerIndex, setActiveMarkerIndex] = useState<number | null>(null);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const sentenceRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const sentences = transcript?.sentences || [];
  const duration = transcript?.duration || 0;

  const useVirtualList = sentences.length > VIRTUAL_THRESHOLD;

  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    if (transcriptRef.current) {
      setContainerHeight(transcriptRef.current.clientHeight);
    }
  }, [status]);

  const visibleRange = useMemo(() => {
    if (!useVirtualList) {
      return { start: 0, end: sentences.length };
    }
    const overscan = 10;
    const start = Math.max(0, Math.floor(scrollTop / SENTENCE_HEIGHT) - overscan);
    const end = Math.min(
      sentences.length,
      Math.ceil((scrollTop + containerHeight) / SENTENCE_HEIGHT) + overscan
    );
    return { start, end };
  }, [scrollTop, containerHeight, sentences.length, useVirtualList]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeyword(value, sentences);
  };

  const highlightText = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;

    const parts = text.split(new RegExp(`(${keyword})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === keyword.toLowerCase() ? (
        <span key={index} className={styles.highlight}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const scrollToSentence = (sentenceId: string) => {
    const element = sentenceRefs.current[sentenceId];
    if (element && transcriptRef.current) {
      transcriptRef.current.scrollTo({
        top: element.offsetTop - transcriptRef.current.offsetTop - 100,
        behavior: 'smooth',
      });
      setActiveSentence(sentenceId);
      setTimeout(() => setActiveSentence(null), 1000);

      const index = matchedSentenceIds.indexOf(sentenceId);
      if (index !== -1) {
        setActiveMarkerIndex(index);
        setTimeout(() => setActiveMarkerIndex(null), 1000);
      }
    }
  };

  const handleTimelineClick = (markerTime: number) => {
    const sentence = sentences.find((s) => Math.abs(s.startTime - markerTime) < 1);
    if (sentence) {
      scrollToSentence(sentence.id);
    }
  };

  const handleExport = async () => {
    if (!transcript) return;

    setIsExporting(true);
    setExportProgress(0);

    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, 800));

    let content = '';
    let fileName = '';
    let mimeType = '';

    switch (exportFormat) {
      case 'txt':
        content = generateTXT(transcript.sentences);
        fileName = 'transcript.txt';
        mimeType = 'text/plain';
        break;
      case 'srt':
        content = generateSRT(transcript.sentences);
        fileName = 'transcript.srt';
        mimeType = 'text/plain';
        break;
      case 'json':
        content = generateJSON(transcript);
        fileName = 'transcript.json';
        mimeType = 'application/json';
        break;
    }

    clearInterval(interval);
    setExportProgress(100);

    setTimeout(() => {
      downloadFile(content, fileName, mimeType);
      setIsExporting(false);
      setShowExportModal(false);
      setExportProgress(0);
    }, 300);
  };

  const generateTXT = (sentences: TranscriptSentence[]): string => {
    return sentences
      .map((s) => {
        const speaker = getSpeakerById(s.speakerId);
        const time = formatTime(s.startTime);
        return `[${time}] ${speaker?.name || '未知'}: ${s.text}`;
      })
      .join('\n\n');
  };

  const generateSRT = (sentences: TranscriptSentence[]): string => {
    return sentences
      .map((s, index) => {
        const startTime = formatSRTTime(s.startTime);
        const endTime = formatSRTTime(s.endTime);
        const speaker = getSpeakerById(s.speakerId);
        return `${index + 1}\n${startTime} --> ${endTime}\n${speaker?.name || ''}: ${s.text}\n`;
      })
      .join('\n');
  };

  const generateJSON = (transcriptData: typeof transcript): string => {
    const data = {
      duration: transcriptData?.duration,
      speakers: transcriptData?.speakers,
      sentences: transcriptData?.sentences.map((s) => ({
        id: s.id,
        speakerId: s.speakerId,
        speakerName: getSpeakerById(s.speakerId)?.name,
        text: s.text,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    };
    return JSON.stringify(data, null, 2);
  };

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderSentence = (sentence: TranscriptSentence, index: number) => {
    const speaker = getSpeakerById(sentence.speakerId);
    const isActive = activeSentenceId === sentence.id;
    const isMatch = matchedSentenceIds.includes(sentence.id);

    return (
      <div
        key={sentence.id}
        ref={(el) => {
          sentenceRefs.current[sentence.id] = el;
        }}
        className={`${styles.sentenceItem} ${isActive ? styles.sentenceActive : ''}`}
        style={{
          backgroundColor: speaker?.color || '#f5f5f5',
          height: useVirtualList ? SENTENCE_HEIGHT : 'auto',
        }}
        onClick={() => scrollToSentence(sentence.id)}
      >
        <div className={styles.sentenceHeader}>
          <span className={styles.speakerTag}>{speaker?.name || '未知'}</span>
          <span className={styles.timestamp}>{formatTime(sentence.startTime)}</span>
          {isMatch && <span className={styles.timestamp}>✓ 匹配</span>}
        </div>
        <p className={styles.sentenceText}>
          {highlightText(sentence.text, keyword)}
        </p>
      </div>
    );
  };

  const renderVirtualList = () => {
    const { start, end } = visibleRange;
    const visibleSentences = sentences.slice(start, end);
    const totalHeight = sentences.length * SENTENCE_HEIGHT;
    const offsetY = start * SENTENCE_HEIGHT;

    return (
      <div className={styles.virtualList} style={{ height: totalHeight }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleSentences.map((sentence, index) =>
            renderSentence(sentence, start + index)
          )}
        </div>
      </div>
    );
  };

  const renderFullList = () => {
    return sentences.map((sentence, index) => renderSentence(sentence, index));
  };

  const timelineHeight = Math.max(600, sentences.length * 15);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>转写结果</h2>
        <button
          className={styles.exportButton}
          onClick={() => setShowExportModal(true)}
          disabled={!transcript}
        >
          导出
        </button>
      </div>

      <div className={styles.searchSection}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索关键词..."
          value={keyword}
          onChange={handleSearchChange}
          disabled={!transcript}
        />
        {keyword && (
          <div className={styles.searchHint}>
            找到 {matchedSentenceIds.length} 处匹配结果
          </div>
        )}
      </div>

      <div className={styles.contentWrapper}>
        <div
          className={styles.transcriptContainer}
          ref={transcriptRef}
          onScroll={handleScroll}
        >
          {!transcript && status !== 'transcribing' && status !== 'uploading' ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📝</div>
              <p className={styles.emptyText}>
                上传音频文件后，转写结果将显示在这里
              </p>
            </div>
          ) : status === 'transcribing' || status === 'uploading' ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⏳</div>
              <p className={styles.emptyText}>正在处理中，请稍候...</p>
            </div>
          ) : sentences.length === 0 ? (
            <div className={styles.noResults}>暂无转写结果</div>
          ) : (
            <>{useVirtualList ? renderVirtualList() : renderFullList()}</>
          )}
        </div>

        <div className={styles.timelinePanel}>
          <div className={styles.timelineTitle}>时间轴</div>
          <div
            className={styles.timelineMarkers}
            style={{ height: timelineHeight }}
          >
            {timelineMarkers.map((marker, index) => {
              const topPercent = (marker / (duration || 1)) * 100;
              const isActive = activeMarkerIndex === index;
              return (
                <div
                  key={index}
                  className={`${styles.timelineMarker} ${isActive ? styles.timelineMarkerActive : ''}`}
                  style={{ top: `${topPercent}%` }}
                  onClick={() => handleTimelineClick(marker)}
                  title={formatTime(marker)}
                />
              );
            })}
            {duration > 0 && (
              <div className={styles.timelineTimeLabels}>
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                  <div
                    key={index}
                    className={styles.timelineTimeLabel}
                    style={{ top: `${ratio * 100}%` }}
                  >
                    {formatTime(duration * ratio)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showExportModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>导出转写结果</h3>

            {isExporting ? (
              <div className={styles.exportProgress}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <div className={styles.progressText}>
                  导出中... {Math.floor(exportProgress)}%
                </div>
              </div>
            ) : (
              <div className={styles.exportOptions}>
                {[
                  {
                    format: 'txt' as ExportFormat,
                    label: '纯文本 (TXT)',
                    desc: '包含说话人标签和时间戳',
                  },
                  {
                    format: 'srt' as ExportFormat,
                    label: 'SRT 字幕',
                    desc: '标准字幕格式',
                  },
                  {
                    format: 'json' as ExportFormat,
                    label: 'JSON 数据',
                    desc: '包含完整时间线和说话人信息',
                  },
                ].map((option) => (
                  <label
                    key={option.format}
                    className={styles.exportOption}
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      value={option.format}
                      checked={exportFormat === option.format}
                      onChange={() => setExportFormat(option.format)}
                    />
                    <div>
                      <div className={styles.exportOptionLabel}>
                        {option.label}
                      </div>
                      <div className={styles.exportOptionDesc}>
                        {option.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowExportModal(false);
                  setExportProgress(0);
                  setIsExporting(false);
                }}
                disabled={isExporting}
              >
                取消
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleExport}
                disabled={isExporting}
              >
                导出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
