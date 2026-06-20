import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar,
  FileText,
  Sparkles,
  Edit3,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PhotoGrid from './PhotoGrid';
import MapPin from './MapPin';
import { useTripStore, MOOD_TAGS } from '@/shared/data/TripStore';
import type { TripPage, Photo, MapMarker, MoodTagDef, Trip } from '@/shared/types';

type DiaryMode = 'edit' | 'preview';

export default function TripEditor({ tripId }: { tripId: string }) {
  const location = useLocation();
  const state = location.state as { highlightPageId?: string } | null;
  const highlightPageId = state?.highlightPageId;

  const {
    getTrip,
    updateTrip,
    addPage,
    deletePage,
    updatePage,
    toggleMoodTag,
  } = useTripStore();

  const trip = getTrip(tripId);
  const [currentPageId, setCurrentPageId] = useState<string>('');

  useEffect(() => {
    if (trip && trip.pages.length > 0 && !currentPageId) {
      setCurrentPageId(trip.pages[0].id);
    }
  }, [trip, currentPageId]);

  const [highlightedPageId, setHighlightedPageId] = useState<string | null>(null);
  const [diaryModeByPage, setDiaryModeByPage] = useState<Record<string, DiaryMode>>({});
  const pageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (highlightPageId && trip) {
      const page = trip.pages.find((p) => p.id === highlightPageId);
      if (page) {
        setCurrentPageId(highlightPageId);
        setHighlightedPageId(highlightPageId);

        requestAnimationFrame(() => {
          const element = pageRefs.current[highlightPageId];
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });

        setTimeout(() => {
          setHighlightedPageId(null);
        }, 2000);
      }
    }
  }, [highlightPageId, trip]);

  const currentPageIndex = trip ? trip.pages.findIndex((p) => p.id === currentPageId) : -1;

  const handlePrevPage = () => {
    if (trip && currentPageIndex > 0) {
      setCurrentPageId(trip.pages[currentPageIndex - 1].id);
    }
  };

  const handleNextPage = () => {
    if (trip && currentPageIndex < trip.pages.length - 1) {
      setCurrentPageId(trip.pages[currentPageIndex + 1].id);
    }
  };

  const getDiaryMode = useCallback((pageId: string): DiaryMode => {
    return diaryModeByPage[pageId] || 'edit';
  }, [diaryModeByPage]);

  const toggleDiaryMode = useCallback((pageId: string) => {
    setDiaryModeByPage((prev) => ({
      ...prev,
      [pageId]: prev[pageId] === 'edit' ? 'preview' : 'edit',
    }));
  }, []);

  const setPageRef = useCallback((pageId: string) => (el: HTMLDivElement | null) => {
    pageRefs.current[pageId] = el;
  }, []);

  const handleAddPage = () => {
    if (!trip) return;
    const newPage = addPage(tripId, {
      title: `第 ${trip.pages.length + 1} 天`,
      date: new Date().toISOString().split('T')[0],
      diaryContent: `## 第 ${trip.pages.length + 1} 天\n\n记录今天的美好时光...\n\n### 行程\n- \n\n### 感受\n- `,
      moodTags: [],
    });
    setCurrentPageId(newPage.id);
  };

  const handleDeletePage = (pageId: string) => {
    if (!trip) return;
    deletePage(tripId, pageId);
    if (currentPageId === pageId) {
      const remainingPages = trip.pages.filter((p) => p.id !== pageId);
      if (remainingPages.length > 0) {
        setCurrentPageId(remainingPages[0].id);
      } else {
        const newPage = addPage(tripId, {
          title: '第 1 天',
          date: new Date().toISOString().split('T')[0],
          diaryContent: '## 第 1 天\n\n记录今天的美好时光...\n',
          moodTags: [],
        });
        setCurrentPageId(newPage.id);
      }
    }
  };

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-playfair mb-4">旅程不存在</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <TripInfoEditor trip={trip} tripId={tripId} />

        <div className="mb-6 mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              旅程页面
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentPageIndex + 1} / {trip.pages.length}
              </span>
              <button
                onClick={handleAddPage}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2',
                  'bg-indigo-500 text-white text-sm font-medium',
                  'hover:bg-indigo-600 transition-colors',
                  'shadow-sm hover:shadow'
                )}
              >
                <Plus className="h-4 w-4" />
                添加页面
              </button>
            </div>
          </div>

          <PageTabs
            pages={trip.pages}
            currentPageId={currentPageId}
            highlightedPageId={highlightedPageId}
            onSelectPage={setCurrentPageId}
            onDeletePage={handleDeletePage}
          />
        </div>

        <div className="relative">
          <div className="mx-auto max-w-3xl">
            <button
              onClick={handlePrevPage}
              disabled={currentPageIndex === 0}
              className={cn(
                'absolute -left-4 top-1/2 z-10 -translate-y-1/2',
                'flex h-12 w-12 items-center justify-center rounded-full',
                'bg-white shadow-lg border border-gray-200',
                'dark:bg-gray-800 dark:border-gray-700',
                'disabled:opacity-30 disabled:cursor-not-allowed',
                'hover:bg-gray-50 dark:hover:bg-gray-700 transition-all',
                'hover:scale-105 active:scale-95'
              )}
            >
              <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>

            <button
              onClick={handleNextPage}
              disabled={currentPageIndex === trip.pages.length - 1}
              className={cn(
                'absolute -right-4 top-1/2 z-10 -translate-y-1/2',
                'flex h-12 w-12 items-center justify-center rounded-full',
                'bg-white shadow-lg border border-gray-200',
                'dark:bg-gray-800 dark:border-gray-700',
                'disabled:opacity-30 disabled:cursor-not-allowed',
                'hover:bg-gray-50 dark:hover:bg-gray-700 transition-all',
                'hover:scale-105 active:scale-95'
              )}
            >
              <ChevronRight className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>

            <div
              ref={setPageRef(currentPageId)}
              className={cn(
                'relative rounded-lg p-6 sm:p-10',
                'bg-gradient-to-br from-white to-amber-50/30',
                'dark:from-gray-800 dark:to-gray-800/80',
                'shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)]',
                'border border-gray-200/60 dark:border-gray-700/60',
                'transition-all duration-500',
                highlightedPageId === currentPageId && [
                  'ring-4 ring-yellow-400/60',
                  'shadow-[0_0_40px_rgba(250,204,21,0.4)]',
                  'animate-pulse-slow',
                ]
              )}
              style={{
                backgroundImage:
                  'repeating-linear-gradient(transparent, transparent 31px, rgba(99,102,241,0.06) 31px, rgba(99,102,241,0.06) 32px)',
              }}
            >
              <div className="absolute left-0 top-0 h-full w-1 rounded-l-lg bg-gradient-to-b from-red-400 via-rose-400 to-red-500" />

              {trip.pages.map((page, idx) =>
                page.id === currentPageId ? (
                  <TripPageContent
                    key={page.id}
                    page={page}
                    pageNumber={idx + 1}
                    totalPages={trip.pages.length}
                    tripId={tripId}
                    diaryMode={getDiaryMode(page.id)}
                    onToggleDiaryMode={() => toggleDiaryMode(page.id)}
                    onUpdatePage={(updates) => updatePage(tripId, page.id, updates)}
                    onToggleMoodTag={(tag) => toggleMoodTag(tripId, page.id, tag)}
                  />
                ) : null
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TripInfoEditor({ trip, tripId }: { trip: Trip; tripId: string }) {
  const { updateTrip } = useTripStore();

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800/80">
      <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <Edit3 className="h-5 w-5 text-indigo-500" />
        旅程基本信息
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            旅程名称
          </label>
          <input
            type="text"
            value={trip.name}
            onChange={(e) => updateTrip(tripId, { name: e.target.value })}
            className={cn(
              'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5',
              'text-gray-900 placeholder:text-gray-400',
              'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
              'dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500'
            )}
            placeholder="给旅程起个名字..."
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            开始日期
          </label>
          <input
            type="date"
            value={trip.startDate}
            onChange={(e) => updateTrip(tripId, { startDate: e.target.value })}
            className={cn(
              'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5',
              'text-gray-900',
              'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
              'dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100'
            )}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            结束日期
          </label>
          <input
            type="date"
            value={trip.endDate || ''}
            onChange={(e) => updateTrip(tripId, { endDate: e.target.value || undefined })}
            className={cn(
              'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5',
              'text-gray-900',
              'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
              'dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100'
            )}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            旅程描述
          </label>
          <textarea
            value={trip.description}
            onChange={(e) => updateTrip(tripId, { description: e.target.value })}
            rows={3}
            className={cn(
              'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5',
              'text-gray-900 placeholder:text-gray-400 resize-none',
              'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
              'dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500'
            )}
            placeholder="简单描述一下这次旅行..."
          />
        </div>
      </div>
    </div>
  );
}

interface PageTabsProps {
  pages: TripPage[];
  currentPageId: string;
  highlightedPageId: string | null;
  onSelectPage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
}

function PageTabs({
  pages,
  currentPageId,
  highlightedPageId,
  onSelectPage,
  onDeletePage,
}: PageTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {pages.map((page, index) => (
        <div
          key={page.id}
          className={cn(
            'group relative flex flex-shrink-0 items-center gap-2',
            'rounded-lg border px-4 py-2.5 cursor-pointer',
            'transition-all duration-300',
            currentPageId === page.id
              ? [
                  'bg-indigo-500 border-indigo-500',
                  'text-white shadow-md shadow-indigo-500/20',
                ]
              : [
                  'bg-white border-gray-200',
                  'text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50',
                  'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300',
                  'dark:hover:border-indigo-500 dark:hover:bg-indigo-900/20',
                ],
            highlightedPageId === page.id && [
              'ring-2 ring-yellow-400 ring-offset-2',
              currentPageId !== page.id && 'animate-pulse',
            ]
          )}
          onClick={() => onSelectPage(page.id)}
        >
          <span
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
              currentPageId === page.id
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            )}
          >
            {index + 1}
          </span>
          <span className="text-sm font-medium max-w-[120px] truncate">
            {page.title || `第${index + 1}天`}
          </span>
          {pages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeletePage(page.id);
              }}
              className={cn(
                'ml-1 flex h-5 w-5 items-center justify-center rounded transition-all',
                'opacity-0 group-hover:opacity-100',
                currentPageId === page.id
                  ? 'text-white/80 hover:bg-white/20'
                  : 'text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400'
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

interface TripPageContentProps {
  page: TripPage;
  pageNumber: number;
  totalPages: number;
  tripId: string;
  diaryMode: DiaryMode;
  onToggleDiaryMode: () => void;
  onUpdatePage: (updates: Partial<Omit<TripPage, 'id' | 'tripId'>>) => void;
  onToggleMoodTag: (tag: MoodTagDef) => void;
}

function TripPageContent({
  page,
  pageNumber,
  totalPages,
  tripId,
  diaryMode,
  onToggleDiaryMode,
  onUpdatePage,
  onToggleMoodTag,
}: TripPageContentProps) {
  return (
    <div className="pl-4">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={page.title}
            onChange={(e) => onUpdatePage({ title: e.target.value })}
            className={cn(
              'w-full border-none bg-transparent p-0 text-2xl font-bold',
              'text-gray-900 placeholder:text-gray-400',
              'focus:outline-none focus:ring-0',
              'dark:text-gray-100 dark:placeholder:text-gray-500'
            )}
            placeholder="页面标题..."
          />
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={page.date}
                onChange={(e) => onUpdatePage({ date: e.target.value })}
                className={cn(
                  'border-none bg-transparent p-0 text-sm text-gray-600',
                  'focus:outline-none focus:ring-0',
                  'dark:text-gray-400'
                )}
              />
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-sm text-gray-400 dark:text-gray-500">
            - {pageNumber} / {totalPages} -
          </div>
        </div>
      </div>

      <div className="mb-6">
        <PhotoGrid
          photos={page.photos}
          pageId={page.id}
          tripId={tripId}
        />
      </div>

      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-500" />
            文字日记
          </h3>
          <button
            onClick={onToggleDiaryMode}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium',
              'transition-colors',
              diaryMode === 'edit'
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50'
            )}
          >
            {diaryMode === 'edit' ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                预览
              </>
            ) : (
              <>
                <Edit3 className="h-3.5 w-3.5" />
                编辑
              </>
            )}
          </button>
        </div>

        {diaryMode === 'edit' ? (
          <textarea
            value={page.diaryContent}
            onChange={(e) => onUpdatePage({ diaryContent: e.target.value })}
            rows={10}
            className={cn(
              'w-full rounded-lg border border-gray-200 bg-white/70 p-4',
              'font-mono text-sm leading-[32px] text-gray-800',
              'placeholder:text-gray-400 resize-none',
              'focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
              'dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-200 dark:placeholder:text-gray-600'
            )}
            placeholder="用 Markdown 记录今天的故事..."
          />
        ) : (
          <div
            className={cn(
              'prose prose-sm max-w-none rounded-lg border border-gray-200 bg-white/70 p-4',
              'prose-headings:text-gray-800 prose-p:text-gray-700 prose-li:text-gray-700',
              'prose-strong:text-gray-900 prose-em:text-gray-700',
              'dark:prose-invert dark:border-gray-700 dark:bg-gray-900/50',
              'leading-[2]'
            )}
          >
            <ReactMarkdown>{page.diaryContent || '*暂无内容*'}</ReactMarkdown>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          心情标签
        </h3>
        <div className="flex flex-wrap gap-2">
          {MOOD_TAGS.map((tag) => {
            const isSelected = page.moodTags.some((t) => t.id === tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => onToggleMoodTag(tag)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm',
                  'border transition-all duration-200',
                  isSelected
                    ? [
                        'bg-indigo-500 border-indigo-500 text-white',
                        'shadow-md shadow-indigo-500/25',
                        'scale-[1.02]',
                      ]
                    : [
                        'bg-white border-gray-200 text-gray-700',
                        'hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700',
                        'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300',
                        'dark:hover:border-indigo-500 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300',
                      ]
                )}
              >
                <span className="text-base">{tag.emoji}</span>
                <span className="font-medium">{tag.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <MapPin
          markers={page.markers}
          photos={page.photos}
          pageId={page.id}
          tripId={tripId}
        />
      </div>
    </div>
  );
}
