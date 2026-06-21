import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useUploadStore } from '@/stores/uploadStore';
import { useVirtualList } from '@/hooks/useVirtualList';
import { useSearch } from '@/hooks/useSearch';
import { formatTime, formatSRTTime } from '@/utils/mockApi';
import type { TranscriptSentence, ExportFormat } from '@/types';
import styles from './TranscriptPanel.module.css';

const ESTIMATED_SENTENCE_HEIGHT = 80;
const VIRTUAL_THRESHOLD = 100;
const SEARCH_DELAY_MS = 100;

export const TranscriptPanel: React.FC = () => {
  const { transcript, getSpeakerById, status } = useUploadStore();

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('txt');
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [activeSentenceId, setActiveSentenceId] = useState<string | null>(null);
  const [blinkingMarkerIndex, setBlinkingMarkerIndex] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const sentenceRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const itemHeightCache = useRef<Map<number, number>>(new Map());

  const sentences = transcript?.sentences || [];
  const duration = transcript?.duration || 0;
  const enableVirtualList = sentences.length > VIRTUAL_THRESHOLD;

  const searchFn = useCallback((sentence: TranscriptSentence, keyword: string) => {
    return sentence.text.toLowerCase().includes(keyword);
  }, []);

  const {
    keyword,
    setKeyword,
    matchedIndices,
    isSearching,
  } = useSearch({
    items: sentences,
    searchFn,
    delay: SEARCH_DELAY_MS,
  });

  const matchedSentenceIds = useMemo(() => {
    return matchedIndices.map((i) => sentences[i]?.id).filter(Boolean) as string[];
  }, [matchedIndices, sentences]);

  const timelineMarkers = useMemo(() => {
    return matchedIndices.map((i) => sentences[i]?.startTime).filter((t): t is number => t !== undefined);
  }, [matchedIndices, sentences]);

  const virtualList = useVirtualList<TranscriptSentence>({
    items: sentences,
    estimatedItemHeight: ESTIMATED_SENTENCE_HEIGHT,
    overscan: 8,
  });

  const {
    visibleItems,
    totalHeight,
    onScroll,
    containerRef,
    scrollToIndex,
    setItemHeight,
  } = virtualList;

  useEffect(() => {
    if (keyword) {
      setKeyword(searchInput);
    }
  }, [searchInput, keyword, setKeyword]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setKeyword(e.target.value);
  };

  const highlightText = useCallback((text: string, highlightKeyword: string) => {
    if (!highlightKeyword.trim()) return text;

    const escapedKeyword = highlightKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
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

  const triggerMarkerBlink = useCallback((markerIndex: number) => {
    setBlinkingMarkerIndex(markerIndex);
    setTimeout(() => {
      setBlinkingMarkerIndex(null);
    }, 1200);
  }, []);

  const scrollToSentence = useCallback(
    (sentenceId: string, markerIndex?: number) => {
      const sentenceIndex = sentences.findIndex((s) => s.id === sentenceId);
      if (sentenceIndex === -1) return;

      if (enableVirtualList) {
        scrollToIndex(sentenceIndex, 'center');
      } else {
        const element = sentenceRefs.current.get(sentenceId);
        const container = containerRef.current;
        if (element && container) {
          const targetTop = element.offsetTop - container.offsetTop - 100;
          container.scrollTo({
            top: Math.max(0, targetTop),
            behavior: 'smooth',
          });
        }
      }

      setActiveSentenceId(sentenceId);
      setTimeout(() => setActiveSentenceId(null), 1000);

      if (markerIndex !== undefined) {
        triggerMarkerBlink(markerIndex);
      } else {
        const idx = matchedSentenceIds.indexOf(sentenceId);
        if (idx !== -1) {
          triggerMarkerBlink(idx);
        }
      }
    },
    [sentences, enableVirtualList, scrollToIndex, containerRef, matchedSentenceIds, triggerMarkerBlink]
  );

  const handleTimelineClick = useCallback(
    (markerTime: number, markerIndex: number) => {
      const sentenceIndex = matchedIndices[markerIndex];
      if (sentenceIndex !== undefined) {
        const sentence = sentences[sentenceIndex];
        if (sentence) {
          scrollToSentence(sentence.id, markerIndex);
        }
      }
    },
    [matchedIndices, sentences, scrollToSentence]
  );

  const handleSentenceRef = useCallback(
    (sentenceId: string, index: number) => (el: HTMLDivElement | null) => {
      if (el) {
        sentenceRefs.current.set(sentenceId, el);
        if (enableVirtualList && itemHeightCache.current.get(index) !== el.offsetHeight) {
          itemHeightCache.current.set(index, el.offsetHeight);
          setItemHeight(index, el.offsetHeight);
        }
      } else {
        sentenceRefs.current.delete(sentenceId);
      }
    },
    [enableVirtualList, setItemHeight]
  );

  const handleExport = async () => {
    if (!transcript) return;

    setIsExporting(true);
    setExportProgress(0);

    const steps = [
      { progress: 20, delay: 200, label: '准备数据...' },
      { progress: 50, delay: 300, label: '生成文件...' },
      { progress: 80, delay: 200, label: '处理中...' },
      { progress: 100, delay: 100, label: '完成' },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, step.delay));
      setExportProgress(step.progress);
    }

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

    await new Promise((resolve) => setTimeout(resolve, 300));
    downloadFile(content, fileName, mimeType);

    setTimeout(() => {
      setIsExporting(false);
      setShowExportModal(false);
      setExportProgress(0);
    }, 500);
  };

  const generateTXT = (sentenceList: TranscriptSentence[]): string => {
    return sentenceList
      .map((s) => {
        const speaker = getSpeakerById(s.speakerId);
        const time = formatTime(s.startTime);
        return `[${time}] ${speaker?.name || '未知'}: ${s.text}`;
      })
      .join('\n\n');
  };

  const generateSRT = (sentenceList: TranscriptSentence[]): string => {
    return sentenceList
      .map((s, index) => {
        const startTime = formatSRTTime(s.startTime);
        const endTime = formatSRTTime(s.endTime);
        const speaker = getSpeakerById(s.speakerId);
        return `${index + 1}\n${startTime} --> ${endTime}\n${speaker?.name || ''}: ${s.text}\n`;
      })
      .join('\n');
  };

  const generateJSON = (
    transcriptData: NonNullable<typeof transcript>
  ): string => {
    const data = {
      duration: transcriptData.duration,
      speakers: transcriptData.speakers,
      sentences: transcriptData.sentences.map((s) => ({
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

  const renderSentence = (
    sentence: TranscriptSentence,
    index: number,
    offset?: number
  ) => {
    const speaker = getSpeakerById(sentence.speakerId);
    const isActive = activeSentenceId === sentence.id;
    const isMatch = keyword && sentence.text.toLowerCase().includes(keyword.toLowerCase());

    const style: React.CSSProperties = {
      backgroundColor: speaker?.color || '#f5f5f5',
    };

    if (offset !== undefined) {
      style.position = 'absolute';
      style.top = 0;
      style.left = 0;
      style.right = 0;
      style.transform = `translateY(${offset}px)`;
    }

    return (
      <div
        key={sentence.id}
        ref={handleSentenceRef(sentence.id, index)}
        className={`${styles.sentenceItem} ${isActive ? styles.sentenceActive : ''}`}
        style={style}
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
        {visibleItems.map(({ item, index, offset }) =>
          renderSentence(item, index, offset)
        )}
      </div>
    );
  };

  const renderFullList = () => {
    return sentences.map((sentence, index) => renderSentence(sentence, index));
  };

  const timelineHeight = Math.max(400, sentences.length * 12);

  const isLoading = status === 'uploading' || status === 'transcribing';
  const hasData = status === 'completed' && sentences.length > 0;
  const noResults = hasData && keyword && matchedIndices.length === 0;

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
            {isSearching ? '搜索中...' : `找到 ${matchedIndices.length} 处匹配结果`}
          </div>
        )}
      </div>

      <div className={styles.contentWrapper}>
        <div
          className={styles.transcriptContainer}
          ref={containerRef as React.RefObject<HTMLDivElement>}
          onScroll={onScroll}
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

          {hasData && !noResults && (
            <>{enableVirtualList ? renderVirtualList() : renderFullList()}</>
          )}

          {noResults && (
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
              const isBlinking = blinkingMarkerIndex === index;
              return (
                <div
                  key={index}
                  className={`${styles.timelineMarker} ${isBlinking ? styles.timelineMarkerBlink : ''}`}
                  style={{ top: `${topPercent}%` }}
                  onClick={() => handleTimelineClick(marker, index)}
                  title={`${formatTime(marker)} - 第${matchedIndices[index] + 1}句`}
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
        <div className={styles.modalOverlay} onClick={(e) => {
          if (!isExporting && e.target === e.currentTarget) {
            setShowExportModal(false);
          }
        }}>
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
                  {exportProgress < 100
                    ? `导出中... ${Math.floor(exportProgress)}%`
                    : '导出完成！'}
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
                {isExporting ? '导出中...' : '导出'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
