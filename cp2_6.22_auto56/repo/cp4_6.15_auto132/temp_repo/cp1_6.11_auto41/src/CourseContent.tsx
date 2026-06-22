import { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Image as ImageIcon,
  Video,
  FileText,
  Award,
  ZoomIn,
} from 'lucide-react';
import type { Course, CourseProgress, Lesson, Chapter } from './types';

interface Props {
  course: Course;
  progress: CourseProgress | undefined;
  onProgressChange: () => void;
}

interface FlatLesson {
  lesson: Lesson;
  chapter: Chapter;
  globalIndex: number;
}

function parseVideoUrl(url: string): string {
  if (!url) return '';
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  if (url.includes('embed') || url.includes('player.vimeo')) return url;
  return '';
}

function formatFullTime(ts: number): string {
  if (!ts) return '-';
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function triggerConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;
  const colors = ['#00d2ff', '#ff6b9d', '#ffa94d', '#50ff7a', '#c0ff5c', '#ff3c3c', '#b24dff'];

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 80,
      origin: { x: 1, y: 0.7 },
      colors,
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  confetti({
    particleCount: 120,
    spread: 100,
    origin: { y: 0.5 },
    colors,
  });

  frame();
}

export default function CourseContent({
  course,
  progress,
  onProgressChange,
}: Props) {
  const flatLessons: FlatLesson[] = useMemo(() => {
    const list: FlatLesson[] = [];
    let idx = 0;
    for (const ch of course.chapters) {
      for (const lesson of ch.lessons) {
        list.push({ lesson, chapter: ch, globalIndex: idx++ });
      }
    }
    return list;
  }, [course]);

  const firstIncomplete = flatLessons.findIndex(
    fl => !progress?.lessons.find(p => p.lessonId === fl.lesson.id)?.completed
  );
  const startIdx = firstIncomplete >= 0 ? firstIncomplete : 0;

  const [currentIndex, setCurrentIndex] = useState(startIdx);
  const [animKey, setAnimKey] = useState(0);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [celebrated, setCelebrated] = useState(false);
  const [completing, setCompleting] = useState(false);

  const total = flatLessons.length;
  const current = flatLessons[currentIndex];

  const markComplete = useCallback(async (lessonId: string) => {
    try {
      await fetch(`/api/progress/${course.id}/lesson/${lessonId}`, {
        method: 'POST',
      });
      onProgressChange();
    } catch (e) {
      console.error(e);
    }
  }, [course.id, onProgressChange]);

  const isLessonComplete = (lessonId: string) =>
    !!progress?.lessons.find(l => l.lessonId === lessonId)?.completed;

  const getLessonTimestamp = (lessonId: string) =>
    progress?.lessons.find(l => l.lessonId === lessonId)?.timestamp || 0;

  const completedCount = progress?.lessons.filter(l => l.completed).length || 0;
  const isAllComplete = total > 0 && completedCount >= total;

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setAnimKey(k => k + 1);
    }
  };

  const handleNext = () => {
    if (current && current.lesson) {
      const wasCompleted = isLessonComplete(current.lesson.id);
      if (!wasCompleted) {
        markComplete(current.lesson.id);
      }
    }
    if (currentIndex < total - 1) {
      setCurrentIndex(i => i + 1);
      setAnimKey(k => k + 1);
    } else {
      if (!celebrated && !isAllComplete) {
        setCompleting(true);
        triggerConfetti();
        setCelebrated(true);
        setTimeout(async () => {
          try {
            await fetch(`/api/progress/${course.id}/complete`, { method: 'POST' });
            onProgressChange();
          } catch (e) {
            console.error(e);
          }
          setCompleting(false);
        }, 1500);
      } else if (!celebrated) {
        triggerConfetti();
        setCelebrated(true);
      }
    }
  };

  const handleJumpTo = (idx: number) => {
    if (idx !== currentIndex) {
      setCurrentIndex(idx);
      setAnimKey(k => k + 1);
    }
  };

  const handleMarkCurrent = async () => {
    if (!current || isLessonComplete(current.lesson.id)) return;
    await markComplete(current.lesson.id);
    if (currentIndex === total - 1 && !celebrated) {
      triggerConfetti();
      setCelebrated(true);
    }
  };

  useEffect(() => {
    setCurrentIndex(startIdx);
  }, [course.id, startIdx]);

  useEffect(() => {
    setCelebrated(false);
  }, [course.id]);

  const progressClass = (pct: number) =>
    pct < 40 ? 'progress-low' : pct < 80 ? 'progress-mid' : 'progress-high';

  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const progressPct = progressClass(percent);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 16,
        minHeight: 'calc(100vh - 56px - 120px)',
      }}
      className="flex-col lg:flex-row"
    >
      <div
        className="glass-panel p-4 overflow-auto"
        style={{
          width: '300px',
          flexShrink: 0,
          maxHeight: 'calc(100vh - 56px - 120px)',
        }}
      >
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold" style={{ color: '#fff' }}>
              学习进度
            </h4>
            <span
              style={{
                color: '#00d2ff',
                fontWeight: 700,
              }}
            >
              {completedCount}/{total}
            </span>
          </div>
          <div className="progress-bar-wrap mb-1">
            <div
              className={`progress-bar-fill ${progressPct}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div
            className="text-xs"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            {percent}% {isAllComplete && '✓ 已完成全部课程'}
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 12,
          }}
        >
          <h5
            className="text-xs font-bold mb-2"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            课时目录
          </h5>
          <div className="flex flex-col gap-1">
            {course.chapters.map(ch => (
              <div key={ch.id} className="mb-2">
                <div
                  className="px-2 py-1 text-xs font-bold"
                  style={{ color: '#00d2ff' }}
                >
                  {ch.title}
                </div>
                <div className="flex flex-col gap-1 pl-2">
                  {ch.lessons.map(l => {
                    const fl = flatLessons.find(f => f.lesson.id === l.id);
                    const idx = fl?.globalIndex ?? 0;
                    const done = isLessonComplete(l.id);
                    const ts = getLessonTimestamp(l.id);
                    const selected = currentIndex === idx;
                    return (
                      <div
                        key={l.id}
                        onClick={() => handleJumpTo(idx)}
                        className={`lesson-item flex items-start gap-2 cursor-pointer ${
                          selected ? 'selected' : ''
                        }`}
                        style={{ padding: '8px 10px' }}
                      >
                        {done ? (
                          <CheckCircle2
                            size={15}
                            style={{
                              color: '#50ff7a',
                              marginTop: 2,
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <Circle
                            size={15}
                            style={{
                              color: 'rgba(255,255,255,0.3)',
                              marginTop: 2,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-sm truncate"
                            style={{
                              color: selected ? '#fff' : '#e0e0e0',
                              fontWeight: selected ? 600 : 400,
                            }}
                          >
                            {l.title}
                          </div>
                          {ts > 0 && (
                            <div
                              className="text-xs mt-1"
                              style={{ color: 'rgba(255,255,255,0.4)' }}
                            >
                              {formatFullTime(ts)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="glass-panel p-6 flex-1 overflow-auto relative"
        style={{
          maxHeight: 'calc(100vh - 56px - 120px)',
          paddingBottom: 100,
        }}
      >
        {current ? (
          <div key={animKey} className="fade-transition-enter">
            <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
              <div>
                <div
                  className="text-xs mb-1"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  {current.chapter.title} · 第 {currentIndex + 1} / {total} 课时
                </div>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: '#fff' }}
                >
                  {current.lesson.title}
                </h2>
              </div>
              {isLessonComplete(current.lesson.id) ? (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: 'rgba(80, 255, 122, 0.1)',
                    color: '#50ff7a',
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span className="text-sm font-bold">已学完</span>
                  {getLessonTimestamp(current.lesson.id) > 0 && (
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                      {formatFullTime(getLessonTimestamp(current.lesson.id))}
                    </span>
                  )}
                </div>
              ) : (
                <button
                  className="primary-btn flex items-center gap-2"
                  onClick={handleMarkCurrent}
                >
                  <CheckCircle2 size={16} />
                  标记为已学
                </button>
              )}
            </div>

            {current.lesson.content.text && (
              <div className="mb-5">
                <div
                  className="flex items-center gap-2 mb-2 text-xs"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  <FileText size={14} style={{ color: '#00d2ff' }} />
                  文字内容
                </div>
                <div
                  className="glass-panel p-5 content-render"
                  style={{ fontSize: 15, lineHeight: 1.8 }}
                  dangerouslySetInnerHTML={{
                    __html: current.lesson.content.text,
                  }}
                />
              </div>
            )}

            {current.lesson.content.imageUrl && (
              <div className="mb-5">
                <div
                  className="flex items-center gap-2 mb-2 text-xs"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  <ImageIcon size={14} style={{ color: '#ffa94d' }} />
                  图片资料
                </div>
                <div className="relative inline-block">
                  <img
                    src={current.lesson.content.imageUrl}
                    alt="课程图片"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 400,
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.2)',
                      cursor: 'zoom-in',
                    }}
                    onClick={() => setZoomImg(current.lesson.content.imageUrl!)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    className="icon-btn"
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      background: 'rgba(0,0,0,0.6)',
                    }}
                    onClick={() => setZoomImg(current.lesson.content.imageUrl!)}
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
              </div>
            )}

            {parseVideoUrl(current.lesson.content.videoUrl || '') && (
              <div className="mb-5">
                <div
                  className="flex items-center gap-2 mb-2 text-xs"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  <Video size={14} style={{ color: '#ff6b9d' }} />
                  视频资料
                </div>
                <div className="video-embed">
                  <iframe
                    src={parseVideoUrl(current.lesson.content.videoUrl || '')}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {!current.lesson.content.text &&
              !current.lesson.content.imageUrl &&
              !current.lesson.content.videoUrl && (
                <div className="glass-panel p-10 text-center">
                  <FileText
                    size={40}
                    style={{
                      color: 'rgba(255,255,255,0.3)',
                      margin: '0 auto 12px',
                    }}
                  />
                  <p style={{ color: 'rgba(255,255,255,0.6)' }}>
                    本课时暂无内容
                  </p>
                </div>
              )}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>暂无课时</p>
          </div>
        )}

        {total > 0 && (
          <div
            className="flex items-center justify-center gap-4"
            style={{
              position: 'sticky',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px 0 0',
              marginTop: 24,
              background: 'linear-gradient(to top, rgba(26, 26, 46, 0.95) 0%, rgba(26, 26, 46, 0.6) 60%, transparent 100%)',
            }}
          >
            <button
              className="secondary-btn flex items-center gap-2"
              disabled={currentIndex === 0}
              onClick={handlePrev}
              style={{ minWidth: 130, justifyContent: 'center' }}
            >
              <ChevronLeft size={18} />
              上一课时
            </button>

            {isAllComplete && (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{
                  background: 'rgba(80, 255, 122, 0.12)',
                  color: '#50ff7a',
                  border: '1px solid rgba(80, 255, 122, 0.3)',
                }}
              >
                <Award size={18} />
                <span className="font-bold">全部完成!</span>
              </div>
            )}

            <button
              className="primary-btn flex items-center gap-2"
              onClick={handleNext}
              disabled={completing || (currentIndex === total - 1 && isAllComplete)}
              style={{ minWidth: 130, justifyContent: 'center' }}
            >
              {currentIndex === total - 1 ? (
                <>
                  {completing ? '恭喜完成!' : (isAllComplete ? '已完成' : '完成全部课程')}
                </>
              ) : (
                <>
                  下一课时
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {zoomImg && (
        <div className="modal-overlay" onClick={() => setZoomImg(null)}>
          <img
            src={zoomImg}
            alt="放大预览"
            style={{
              maxWidth: '92%',
              maxHeight: '88%',
              borderRadius: 12,
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
