import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useUploadStore } from '@/stores/uploadStore';
import { useSearchStore } from '@/stores/searchStore';
import { formatTime, formatSRTTime } from '@/utils/mockApi';
import { useDebounce } from '@/hooks/useDebounce';
import type { TranscriptSentence, ExportFormat } from '@/types';
import styles from './TranscriptPanel.module.css';

const ESTIMATED_SENTENCE_HEIGHT = 80;
const VIRTUAL_THRESHOLD = 100;
const OVERSCAN_COUNT = 5;
const SEARCH_DEBOUNCE_MS = 100;

export const TranscriptPanel: React.FC = () => {
  const { transcript, getSpeakerById, status } = useUploadStore();
  const {
    keyword,
    matchedSentenceIds,
    activeSentenceId,
    timelineMarkers,
    setKeyword,
    setActiveSentence,
  } = useSearchStore();

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('txt');
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [activeMarkerIndex, setActiveMarkerIndex] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const sentenceRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

  const sentences = transcript?.sentences || [];
  const duration = transcript?.duration || 0;
  const useVirtualList = sentences.length > VIRTUAL_THRESHOLD;

  useEffect(() => {
    setKeyword(debouncedSearch, sentences);
  }, [debouncedSearch, sentences, setKeyword]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [status]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const { startIndex, endIndex, totalHeight, offsetY } = useMemo(() => {
    if (!useVirtualList) {
      return {
        startIndex: 0,
        endIndex: sentences.length,
        totalHeight: sentences.length * ESTIMATED_SENTENCE_HEIGHT,
        offsetY: 0,
      };
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / ESTIMATED_SENTENCE_HEIGHT) - OVERSCAN_COUNT);
    const endIndex = Math.min(
      sentences.length,
      Math.ceil((scrollTop + containerHeight) / ESTIMATED_SENTENCE_HEIGHT) + OVERSCAN_COUNT
    );
    const totalHeight = sentences.length * ESTIMATED_SENTENCE_HEIGHT;
    const offsetY = startIndex * ESTIMATED_SENTENCE_HEIGHT;

    return { startIndex, endIndex, totalHeight, offsetY };
  }, [scrollTop, containerHeight, sentences.length, useVirtualList]);

  const visibleSentences = useMemo(() => {
    return sentences.slice(startIndex, endIndex);
  }, [sentences, startIndex, endIndex]);

  const highlightText = useCallback((text: string, keyword: string) => {
    if (!keyword.trim()) return text;

    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className={styles.highlight}>
          {part}
        </span>
      ) : (
        part
      )
    );
  }, []);

  const scrollToSentence = useCallback((sentenceId: string) => {
    const container = containerRef.current;
    if (!container) return;

    if (useVirtualList) {
      const sentenceIndex = sentences.findIndex((s) => s.id === sentenceId);
      if (sentenceIndex === -1) return;

      const targetScrollTop = sentenceIndex * ESTIMATED_SENTENCE_HEIGHT - containerHeight / 3;
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
    } else {
      const element = sentenceRefs.current.get(sentenceId);
      if (element) {
        container.scrollTo({
          top: element.offsetTop - container.offsetTop - 100,
          behavior: 'smooth',
        });
      }
    }

    setActiveSentence(sentenceId);
    setTimeout(() => setActiveSentence(null), 1000);

    const index = matchedSentenceIds.indexOf(sentenceId);
    if (index !== -1) {
      setActiveMarkerIndex(index);
      setTimeout(() => setActiveMarkerIndex(null), 1000);
    }
  }, [sentences, useVirtualList, containerHeight, matchedSentenceIds, setActiveSentence]);

  const handleTimelineClick = useCallback((markerTime: number, index: number) => {
    const sentence = sentences.find((s) => Math.abs(s.startTime - markerTime) < 1);
    if (sentence) {
      scrollToSentence(sentence.id);
      setActiveMarkerIndex(index);
      setTimeout(() => setActiveMarkerIndex(null), 1000);
    }
  }, [sentences, scrollToSentence]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleExport = async () => {
    if (!transcript) return;

    setIsExporting(true);
    setExportProgress(0);

    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return 85;
        }
        return prev + Math.random() * 12;
      });
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, 600));

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
    }, 400);
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

  const setSentenceRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) {
      sentenceRefs.current.set(id, el);
    } else {
      sentenceRefs.current.delete(id);
    }
  }, []);

  const renderSentence = (sentence: TranscriptSentence) => {
    const speaker = getSpeakerById(sentence.speakerId);
    const isActive = activeSentenceId === sentence.id;
    const isMatch = keyword && sentence.text.toLowerCase().includes(keyword.toLowerCase());

    return (
      <div
        key={sentence.id}
        ref={setSentenceRef(sentence.id)}
        className={`${styles.sentenceItem} ${isActive ? styles.sentenceActive : ''}`}
        style={{
          backgroundColor: speaker?.color || '#f5f5f5',
          minHeight: useVirtualList ? ESTIMATED_SENTENCE_HEIGHT : 'auto',
        }}
        onClick={() => scrollToSentence(sentence.id)}
      >
        <div className={styles.sentenceHeader}>
          <span className={styles.speakerTag}>{speaker?.name || '未知'}</span>
          <span className={styles.timestamp}>{formatTime(sentence.startTime)}</span>
          {isMatch && <span className={styles.matchBadge}>✓ 匹配</span>}
        </div>
        <p className={styles.sentenceText}>
          {highlightText(sentence.text, keyword)}
        </p>
      </div>
    );
  };

  const renderVirtualList = () => {
    return (
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleSentences.map((sentence) => renderSentence(sentence))}
        </div>
      </div>
    );
  };

  const renderFullList = () => {
    return sentences.map((sentence) => renderSentence(sentence));
  };

  const timelineHeight = Math.max(400, sentences.length * 12);

  const isLoading = status === 'uploading' || status === 'transcribing';
  const hasData = status === 'completed' && sentences.length > 0;

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
          value={searchInput}
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
          ref={containerRef}
          onScroll={handleScroll}
        >
          {!hasData && !isLoading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📝</div>
              <p className={styles.emptyText}>
                上传音频文件后，转写结果将显示在这里
              </p>
            </div>
          )}

          {isLoading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⏳</div>
              <p className={styles.emptyText}>正在处理中，请稍候...</p>
            </div>
          )}

          {hasData && (
            <>{useVirtualList ? renderVirtualList() : renderFullList()}</>
          )}

          {hasData && matchedSentenceIds.length === 0 && keyword && (
            <div className={styles.noResults}>没有找到匹配的内容</div>
          )}
        </div>

        <div className={styles.timelinePanel}>
          <div className={styles.timelineTitle}>时间轴</div>
          <div
            className={styles.timelineMarkers}
            style={{ height: timelineHeight }}
          >
            {timelineMarkers.map((marker, index) => {
              const topPercent = duration > 0 ? (marker / duration) * 100 : 0;
              const isActive = activeMarkerIndex === index;
              return (
                <div
                  key={index}
                  className={`${styles.timelineMarker} ${isActive ? styles.timelineMarkerActive : ''}`}
                  style={{ top: `${topPercent}%` }}
                  onClick={() => handleTimelineClick(marker, index)}
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
