import { useState, useRef, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Type,
  Image as ImageIcon,
  Video as VideoIcon,
  Bold,
  List,
  ListOrdered,
  Save,
  X,
  FileText,
  Eye,
} from 'lucide-react';
import type { Course, Chapter, Lesson, CourseProgress } from './types';

interface Props {
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  progress: CourseProgress[];
  setProgress: React.Dispatch<React.SetStateAction<CourseProgress[]>>;
  onRefresh: () => void;
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

function reorder<T>(list: T[], startIdx: number, endIdx: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIdx, 1);
  result.splice(endIdx, 0, removed);
  return result;
}

export default function CourseEditor({ courses, setCourses, onRefresh }: Props) {
  const [activeCourseId, setActiveCourseId] = useState<string | null>(
    courses[0]?.id || null
  );
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const activeCourse = courses.find(c => c.id === activeCourseId) || null;

  const activeLesson: Lesson | null = (() => {
    if (!activeCourse || !activeLessonId) return null;
    for (const ch of activeCourse.chapters) {
      const found = ch.lessons.find(l => l.id === activeLessonId);
      if (found) return found;
    }
    return null;
  })();

  useEffect(() => {
    if (!activeCourseId && courses.length > 0) {
      setActiveCourseId(courses[0].id);
    }
    if (!activeLessonId && activeCourse && activeCourse.chapters[0]?.lessons[0]) {
      setActiveLessonId(activeCourse.chapters[0].lessons[0].id);
    }
  }, [courses, activeCourseId, activeLessonId, activeCourse]);

  const updateCourse = (courseId: string, updater: (c: Course) => Course) => {
    setCourses(prev => prev.map(c => (c.id === courseId ? updater(c) : c)));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !activeCourse) return;
    const { source, destination, type } = result;

    if (type === 'chapter') {
      if (source.index === destination.index) return;
      updateCourse(activeCourse.id, c => ({
        ...c,
        chapters: reorder(c.chapters, source.index, destination.index),
      }));
      return;
    }

    if (type.startsWith('lesson-')) {
      const chapterId = type.replace('lesson-', '');
      if (source.index === destination.index) return;
      updateCourse(activeCourse.id, c => ({
        ...c,
        chapters: c.chapters.map(ch =>
          ch.id === chapterId
            ? { ...ch, lessons: reorder(ch.lessons, source.index, destination.index) }
            : ch
        ),
      }));
    }
  };

  const createCourse = async () => {
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '新课程 ' + (courses.length + 1),
          description: '请填写课程描述...',
          chapters: [
            {
              id: uuidv4(),
              title: '第一章',
              expanded: true,
              lessons: [
                {
                  id: uuidv4(),
                  title: '新课时',
                  content: { text: '<p>请输入内容...</p>' },
                },
              ],
            },
          ],
        }),
      });
      const created = await res.json();
      await onRefresh();
      setActiveCourseId(created.id);
      setActiveLessonId(created.chapters[0].lessons[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm('确定删除此课程吗？')) return;
    try {
      await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
      await onRefresh();
      if (activeCourseId === courseId) {
        setActiveCourseId(null);
        setActiveLessonId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addChapter = () => {
    if (!activeCourse) return;
    if (activeCourse.chapters.length >= 8) {
      alert('最多只能添加8个章节');
      return;
    }
    const newChapter: Chapter = {
      id: uuidv4(),
      title: `第${activeCourse.chapters.length + 1}章 新章节`,
      expanded: true,
      lessons: [
        {
          id: uuidv4(),
          title: '新课时 1',
          content: { text: '<p>请输入课时内容...</p>' },
        },
      ],
    };
    updateCourse(activeCourse.id, c => ({
      ...c,
      chapters: [...c.chapters, newChapter],
    }));
  };

  const deleteChapter = (chapterId: string) => {
    if (!confirm('确定删除此章节及其所有课时吗？')) return;
    if (!activeCourse) return;
    updateCourse(activeCourse.id, c => ({
      ...c,
      chapters: c.chapters.filter(ch => ch.id !== chapterId),
    }));
  };

  const toggleChapter = (chapterId: string) => {
    if (!activeCourse) return;
    updateCourse(activeCourse.id, c => ({
      ...c,
      chapters: c.chapters.map(ch =>
        ch.id === chapterId ? { ...ch, expanded: !ch.expanded } : ch
      ),
    }));
  };

  const addLesson = (chapterId: string) => {
    if (!activeCourse) return;
    const chapter = activeCourse.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return;
    if (chapter.lessons.length >= 15) {
      alert('每个章节最多15个课时');
      return;
    }
    const newLesson: Lesson = {
      id: uuidv4(),
      title: `新课时 ${chapter.lessons.length + 1}`,
      content: { text: '<p>请输入课时内容...</p>' },
    };
    updateCourse(activeCourse.id, c => ({
      ...c,
      chapters: c.chapters.map(ch =>
        ch.id === chapterId
          ? { ...ch, lessons: [...ch.lessons, newLesson], expanded: true }
          : ch
      ),
    }));
    setActiveLessonId(newLesson.id);
  };

  const deleteLesson = (chapterId: string, lessonId: string) => {
    if (!confirm('确定删除此课时吗？')) return;
    if (!activeCourse) return;
    updateCourse(activeCourse.id, c => ({
      ...c,
      chapters: c.chapters.map(ch =>
        ch.id === chapterId
          ? { ...ch, lessons: ch.lessons.filter(l => l.id !== lessonId) }
          : ch
      ),
    }));
    if (activeLessonId === lessonId) setActiveLessonId(null);
  };

  const updateLessonContent = (
    chapterId: string,
    lessonId: string,
    patch: Partial<Lesson>
  ) => {
    if (!activeCourse) return;
    updateCourse(activeCourse.id, c => ({
      ...c,
      chapters: c.chapters.map(ch =>
        ch.id === chapterId
          ? {
              ...ch,
              lessons: ch.lessons.map(l =>
                l.id === lessonId ? { ...l, ...patch } : l
              ),
            }
          : ch
      ),
    }));
  };

  const findChapterOfLesson = (lessonId: string): Chapter | null => {
    if (!activeCourse) return null;
    for (const ch of activeCourse.chapters) {
      if (ch.lessons.some(l => l.id === lessonId)) return ch;
    }
    return null;
  };

  const saveCourse = async () => {
    if (!activeCourse) return;
    setSaving(true);
    try {
      await fetch(`/api/courses/${activeCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeCourse),
      });
      setSavedMsg('已保存 ✓');
      setTimeout(() => setSavedMsg(''), 2000);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const editorRef = useRef<HTMLDivElement>(null);
  const execCmd = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    if (editorRef.current) {
      syncEditorContent();
    }
  };

  const syncEditorContent = () => {
    if (!editorRef.current || !activeLesson || !activeCourse) return;
    const chapter = findChapterOfLesson(activeLesson.id);
    if (!chapter) return;
    updateLessonContent(chapter.id, activeLesson.id, {
      content: {
        ...activeLesson.content,
        text: editorRef.current.innerHTML,
      },
    });
  };

  useEffect(() => {
    if (editorRef.current && activeLesson) {
      if (editorRef.current.innerHTML !== (activeLesson.content.text || '')) {
        editorRef.current.innerHTML = activeLesson.content.text || '<p><br></p>';
      }
    }
  }, [activeLessonId]);

  const progressClass = (pct: number) =>
    pct < 40 ? 'progress-low' : pct < 80 ? 'progress-mid' : 'progress-high';

  const totalLessons =
    activeCourse?.chapters.reduce((s, ch) => s + ch.lessons.length, 0) || 0;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          gap: '12px',
          minHeight: 'calc(100vh - 56px - 40px)',
        }}
        className="flex-col lg:flex-row"
      >
        <div
          className="glass-panel p-3 overflow-auto"
          style={{
            width: '260px',
            flexShrink: 0,
            maxHeight: 'calc(100vh - 56px - 40px)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold" style={{ color: '#fff', fontSize: 15 }}>
              课程列表
            </h3>
            <button className="icon-btn" title="新建课程" onClick={createCourse}>
              <Plus size={18} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {courses.map(c => (
              <div
                key={c.id}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                  c.id === activeCourseId ? 'bg-[#00d2ff33] border border-[#00d2ff]' : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
                onClick={() => {
                  setActiveCourseId(c.id);
                  if (c.chapters[0]?.lessons[0]) {
                    setActiveLessonId(c.chapters[0].lessons[0].id);
                  }
                }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText size={16} style={{ color: '#00d2ff' }} />
                  <span
                    className="truncate text-sm"
                    style={{ color: '#e0e0e0' }}
                    title={c.title}
                  >
                    {c.title}
                  </span>
                </div>
                <button
                  className="icon-btn"
                  style={{ padding: 2 }}
                  onClick={e => {
                    e.stopPropagation();
                    deleteCourse(c.id);
                  }}
                  title="删除课程"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div
          className="glass-panel p-4 overflow-auto flex-1"
          style={{ maxHeight: 'calc(100vh - 56px - 40px)' }}
        >
          {activeCourse ? (
            <>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input
                  style={{
                    flex: 1,
                    minWidth: 200,
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                  value={activeCourse.title}
                  onChange={e =>
                    updateCourse(activeCourse.id, c => ({
                      ...c,
                      title: e.target.value,
                    }))
                  }
                />
                <div className="flex items-center gap-2">
                  {savedMsg && (
                    <span style={{ color: '#50ff7a', fontSize: 13 }}>{savedMsg}</span>
                  )}
                  <button
                    className="primary-btn flex items-center gap-2"
                    onClick={saveCourse}
                    disabled={saving}
                  >
                    <Save size={16} />
                    {saving ? '保存中...' : '保存课程'}
                  </button>
                </div>
              </div>
              <textarea
                style={{ width: '100%', minHeight: 60, resize: 'vertical' }}
                placeholder="课程描述..."
                value={activeCourse.description}
                onChange={e =>
                  updateCourse(activeCourse.id, c => ({
                    ...c,
                    description: e.target.value,
                  }))
                }
              />
              <div className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                总课时数: <strong style={{ color: '#00d2ff' }}>{totalLessons}</strong> | 章节数:{' '}
                <strong style={{ color: '#00d2ff' }}>{activeCourse.chapters.length}/8</strong>
              </div>

              <div className="flex items-center justify-between mt-4 mb-2">
                <h4 className="font-bold" style={{ color: '#fff' }}>
                  课程结构
                </h4>
                <button
                  className="secondary-btn flex items-center gap-2"
                  onClick={addChapter}
                  disabled={activeCourse.chapters.length >= 8}
                >
                  <Plus size={16} /> 添加章节
                </button>
              </div>

              <Droppable droppableId="chapters" type="chapter">
                {provided => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex flex-col gap-2"
                  >
                    {activeCourse.chapters.map((ch, chIdx) => (
                      <Draggable
                        key={ch.id}
                        draggableId={`chapter-${ch.id}`}
                        index={chIdx}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`chapter-item ${
                              snapshot.isDragging ? 'dragging-item' : ''
                            }`}
                          >
                            <div
                              className="flex items-center p-3"
                              style={{
                                gap: 8,
                                background: 'rgba(255,255,255,0.03)',
                                borderBottom: ch.expanded ? '1px solid rgba(255,255,255,0.08)' : 'none',
                              }}
                            >
                              <span
                                className="drag-handle"
                                {...provided.dragHandleProps}
                              >
                                <GripVertical size={18} />
                              </span>
                              <button
                                className="icon-btn"
                                onClick={() => toggleChapter(ch.id)}
                              >
                                {ch.expanded ? (
                                  <ChevronDown size={16} />
                                ) : (
                                  <ChevronRight size={16} />
                                )}
                              </button>
                              <input
                                style={{
                                  flex: 1,
                                  fontWeight: 700,
                                  fontSize: 16,
                                  background: 'transparent',
                                  border: 'none',
                                  padding: '4px 6px',
                                }}
                                value={ch.title}
                                onChange={e =>
                                  updateCourse(activeCourse.id, c => ({
                                    ...c,
                                    chapters: c.chapters.map(x =>
                                      x.id === ch.id
                                        ? { ...x, title: e.target.value }
                                        : x
                                    ),
                                  }))
                                }
                              />
                              <span
                                className="text-xs px-2 py-1 rounded"
                                style={{
                                  background: 'rgba(0,210,255,0.15)',
                                  color: '#00d2ff',
                                }}
                              >
                                {ch.lessons.length}/15 课时
                              </span>
                              <button
                                className="icon-btn"
                                onClick={() => addLesson(ch.id)}
                                title="添加课时"
                                disabled={ch.lessons.length >= 15}
                              >
                                <Plus size={16} />
                              </button>
                              <button
                                className="icon-btn"
                                onClick={() => deleteChapter(ch.id)}
                                title="删除章节"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            {ch.expanded && (
                              <Droppable
                                droppableId={`lessons-${ch.id}`}
                                type={`lesson-${ch.id}`}
                              >
                                {provided => (
                                  <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="p-2"
                                  >
                                    {ch.lessons.map((lesson, lIdx) => (
                                      <Draggable
                                        key={lesson.id}
                                        draggableId={`lesson-${lesson.id}`}
                                        index={lIdx}
                                      >
                                        {(provided, snap) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`lesson-item flex items-center gap-2 ${
                                              activeLessonId === lesson.id
                                                ? 'selected'
                                                : ''
                                            } ${snap.isDragging ? 'dragging-item' : ''}`}
                                            onClick={() => setActiveLessonId(lesson.id)}
                                          >
                                            <span
                                              className="drag-handle"
                                              {...provided.dragHandleProps}
                                            >
                                              <GripVertical size={16} />
                                            </span>
                                            <Eye
                                              size={14}
                                              style={{
                                                color: lesson.content.text ? '#00d2ff' : 'rgba(255,255,255,0.3)',
                                              }}
                                            />
                                            {lesson.content.imageUrl && (
                                              <ImageIcon
                                                size={14}
                                                style={{ color: '#ffa94d' }}
                                              />
                                            )}
                                            {lesson.content.videoUrl && (
                                              <VideoIcon
                                                size={14}
                                                style={{ color: '#ff6b9d' }}
                                              />
                                            )}
                                            <input
                                              style={{
                                                flex: 1,
                                                fontSize: 14,
                                                background: 'transparent',
                                                border: 'none',
                                                padding: '2px 4px',
                                                fontWeight: activeLessonId === lesson.id ? 600 : 400,
                                              }}
                                              value={lesson.title}
                                              onClick={e => e.stopPropagation()}
                                              onChange={e =>
                                                updateLessonContent(ch.id, lesson.id, {
                                                  title: e.target.value,
                                                })
                                              }
                                            />
                                            <button
                                              className="icon-btn"
                                              onClick={e => {
                                                e.stopPropagation();
                                                deleteLesson(ch.id, lesson.id);
                                              }}
                                              title="删除课时"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </>
          ) : (
            <div className="h-full flex items-center justify-center flex-col gap-3">
              <FileText size={48} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>
                请选择或创建课程开始编辑
              </p>
              <button className="primary-btn" onClick={createCourse}>
                创建新课程
              </button>
            </div>
          )}
        </div>

        <div
          className="glass-panel p-4 overflow-auto"
          style={{
            width: '420px',
            flexShrink: 0,
            maxHeight: 'calc(100vh - 56px - 40px)',
          }}
        >
          <h3 className="font-bold mb-3" style={{ color: '#fff', fontSize: 15 }}>
            课时内容编辑器
          </h3>

          {activeLesson ? (
            <div className="fade-transition-enter" key={activeLesson.id}>
              <div className="mb-3">
                <label className="block text-xs mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  课时标题
                </label>
                <input
                  style={{ width: '100%' }}
                  value={activeLesson.title}
                  onChange={e => {
                    const ch = findChapterOfLesson(activeLesson.id);
                    if (ch)
                      updateLessonContent(ch.id, activeLesson.id, {
                        title: e.target.value,
                      });
                  }}
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs mb-1 flex items-center gap-2">
                  <Type size={13} style={{ color: '#00d2ff' }} />
                  富文本内容
                </label>
                <div
                  className="flex items-center gap-1 mb-2 flex-wrap"
                  style={{ gap: 4 }}
                >
                  <button
                    className="toolbar-btn font-bold"
                    onMouseDown={e => {
                      e.preventDefault();
                      execCmd('bold');
                    }}
                  >
                    B
                  </button>
                  <button
                    className="toolbar-btn"
                    onMouseDown={e => {
                      e.preventDefault();
                      execCmd('insertUnorderedList');
                    }}
                  >
                    <List size={14} />
                  </button>
                  <button
                    className="toolbar-btn"
                    onMouseDown={e => {
                      e.preventDefault();
                      execCmd('insertOrderedList');
                    }}
                  >
                    <ListOrdered size={14} />
                  </button>
                </div>
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="text-editor"
                  onInput={syncEditorContent}
                  style={{ minHeight: 120, maxHeight: 200, overflow: 'auto' }}
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs mb-1 flex items-center gap-2">
                  <ImageIcon size={13} style={{ color: '#ffa94d' }} />
                  图片 URL
                </label>
                <input
                  style={{ width: '100%' }}
                  placeholder="输入图片URL..."
                  value={activeLesson.content.imageUrl || ''}
                  onChange={e => {
                    const ch = findChapterOfLesson(activeLesson.id);
                    if (ch)
                      updateLessonContent(ch.id, activeLesson.id, {
                        content: {
                          ...activeLesson.content,
                          imageUrl: e.target.value,
                        },
                      });
                  }}
                />
                {activeLesson.content.imageUrl && (
                  <div className="mt-2 relative">
                    <img
                      src={activeLesson.content.imageUrl}
                      alt="预览"
                      className="thumbnail-img"
                      onClick={() => setZoomImg(activeLesson.content.imageUrl!)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <button
                      className="icon-btn"
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: 'rgba(0,0,0,0.6)',
                      }}
                      onClick={() => {
                        const ch = findChapterOfLesson(activeLesson.id);
                        if (ch)
                          updateLessonContent(ch.id, activeLesson.id, {
                            content: { ...activeLesson.content, imageUrl: '' },
                          });
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="block text-xs mb-1 flex items-center gap-2">
                  <VideoIcon size={13} style={{ color: '#ff6b9d' }} />
                  视频链接 (YouTube / Vimeo)
                </label>
                <input
                  style={{ width: '100%' }}
                  placeholder="粘贴YouTube或Vimeo链接..."
                  value={activeLesson.content.videoUrl || ''}
                  onChange={e => {
                    const ch = findChapterOfLesson(activeLesson.id);
                    if (ch)
                      updateLessonContent(ch.id, activeLesson.id, {
                        content: {
                          ...activeLesson.content,
                          videoUrl: e.target.value,
                        },
                      });
                  }}
                />
                {parseVideoUrl(activeLesson.content.videoUrl || '') && (
                  <div className="mt-2 video-embed">
                    <iframe
                      src={parseVideoUrl(activeLesson.content.videoUrl || '')}
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/10">
                <h4 className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  实时预览
                </h4>
                <div
                  className="glass-panel p-3 content-render"
                  style={{ minHeight: 80 }}
                  dangerouslySetInnerHTML={{
                    __html: activeLesson.content.text || '<p style="color:rgba(255,255,255,0.4)">暂无文字内容</p>',
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center flex-col gap-3">
              <Type size={40} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <p style={{ color: 'rgba(255,255,255,0.6)' }} className="text-sm text-center">
                请选择左侧课时开始编辑内容
              </p>
            </div>
          )}
        </div>
      </div>

      {zoomImg && (
        <div className="modal-overlay" onClick={() => setZoomImg(null)}>
          <img
            src={zoomImg}
            alt="放大预览"
            style={{
              maxWidth: '90%',
              maxHeight: '85%',
              borderRadius: 12,
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </DragDropContext>
  );
}
