import { useState, useEffect, useCallback, memo } from 'react';
import useEditorStore from '@/stores/editorStore';
import { cn } from '@/lib/utils';
import type { TextBlock, ImageBlock, QuizBlock, QuizOption } from '@/types';

type QuizState = {
  selected: string[];
  submitted: boolean;
  score: number;
};

function ReadOnlyTextBlock({ block }: { block: TextBlock }) {
  return (
    <div
      className="text-sm leading-relaxed prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: block.content }}
    />
  );
}

function ReadOnlyImageBlock({ block }: { block: ImageBlock }) {
  return (
    <img
      src={block.url}
      alt={block.alt}
      className="w-full h-full object-contain rounded"
    />
  );
}

const ReadOnlyQuizBlock = memo(function ReadOnlyQuizBlock({ block }: { block: QuizBlock }) {
  const [state, setState] = useState<QuizState>({
    selected: [],
    submitted: false,
    score: 0,
  });

  const toggleOption = useCallback(
    (optionId: string) => {
      if (state.submitted) return;
      setState((prev) => {
        if (block.mode === 'single') {
          return { ...prev, selected: [optionId] };
        }
        return {
          ...prev,
          selected: prev.selected.includes(optionId)
            ? prev.selected.filter((id) => id !== optionId)
            : [...prev.selected, optionId],
        };
      });
    },
    [block.mode, state.submitted]
  );

  const handleSubmit = useCallback(() => {
    const correctOptions = block.options.filter((o: QuizOption) => o.isCorrect);
    const correctIds = correctOptions.map((o: QuizOption) => o.id);
    const isCorrect =
      state.selected.length === correctIds.length &&
      state.selected.every((id) => correctIds.includes(id));
    setState((prev) => ({
      ...prev,
      submitted: true,
      score: isCorrect ? block.score : 0,
    }));
  }, [block.options, block.score, state.selected]);

  return (
    <div className="flex flex-col gap-2">
      <div className="font-medium text-sm">{block.question}</div>
      <div className="flex flex-col gap-1.5">
        {block.options.map((option: QuizOption) => {
          const isSelected = state.selected.includes(option.id);
          const showCorrect = state.submitted && option.isCorrect;
          const showWrong = state.submitted && isSelected && !option.isCorrect;
          return (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              className={cn(
                'text-left px-3 py-2 rounded-lg text-sm transition-colors border',
                showCorrect && 'bg-green-50 border-green-400 text-green-800',
                showWrong && 'bg-red-50 border-red-400 text-red-800',
                !showCorrect && !showWrong && isSelected && 'bg-accent/10 border-accent/40 text-accent-800',
                !showCorrect && !showWrong && !isSelected && 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              )}
            >
              {option.text}
            </button>
          );
        })}
      </div>
      {!state.submitted && state.selected.length > 0 && (
        <button
          onClick={handleSubmit}
          className="self-end px-4 py-1.5 rounded-lg bg-accent text-primary-900 text-xs font-medium hover:bg-accent-600 transition-colors"
        >
          Submit
        </button>
      )}
      {state.submitted && (
        <div className={cn(
          'text-xs font-medium',
          state.score > 0 ? 'text-green-600' : 'text-red-500'
        )}>
          {state.score > 0 ? `Correct! +${state.score} points` : 'Incorrect'}
        </div>
      )}
    </div>
  );
});

const PreviewMode = memo(function PreviewMode() {
  const pages = useEditorStore((s) => s.pages);
  const blocks = useEditorStore((s) => s.blocks);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const togglePreview = useEditorStore((s) => s.togglePreview);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');

  const sortedPages = [...pages].sort((a, b) => a.order - b.order);
  const totalPages = sortedPages.length;
  const currentPage = sortedPages[currentPageIndex];
  const pageBlocks = currentPage
    ? blocks.filter((b) => b.pageId === currentPage.id)
    : [];

  const goToPage = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalPages || index === currentPageIndex) return;
      setFadeState('out');
      setTimeout(() => {
        setCurrentPageIndex(index);
        setFadeState('in');
      }, 300);
    },
    [totalPages, currentPageIndex]
  );

  const goNext = useCallback(() => goToPage(currentPageIndex + 1), [goToPage, currentPageIndex]);
  const goPrev = useCallback(() => goToPage(currentPageIndex - 1), [goToPage, currentPageIndex]);

  useEffect(() => {
    if (!isPreviewMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        togglePreview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewMode, goNext, goPrev, togglePreview]);

  useEffect(() => {
    setCurrentPageIndex(0);
  }, [isPreviewMode]);

  if (!isPreviewMode) return null;

  return (
    <div className="fixed inset-0 z-50 bg-preview flex flex-col items-center justify-center">
      <div
        className={cn(
          'w-[800px] max-w-[90vw] min-h-[500px] max-h-[75vh] rounded-xl shadow-2xl overflow-auto p-8 relative transition-opacity duration-300',
          fadeState === 'in' ? 'opacity-100' : 'opacity-0'
        )}
        style={{ backgroundColor: currentPage?.backgroundColor || '#ffffff' }}
      >
        {currentPage && (
          <div className="flex flex-col gap-4">
            {pageBlocks.map((block) => {
              if (block.type === 'text') {
                return <ReadOnlyTextBlock key={block.id} block={block as TextBlock} />;
              }
              if (block.type === 'image') {
                return <ReadOnlyImageBlock key={block.id} block={block as ImageBlock} />;
              }
              if (block.type === 'quiz') {
                return <ReadOnlyQuizBlock key={block.id} block={block as QuizBlock} />;
              }
              return null;
            })}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={goPrev}
          disabled={currentPageIndex <= 0}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            currentPageIndex > 0
              ? 'bg-white/10 text-white hover:bg-white/20'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          )}
        >
          Previous
        </button>
        <span className="text-white/60 text-sm min-w-[80px] text-center">
          {totalPages > 0 ? `${currentPageIndex + 1} / ${totalPages}` : '0 / 0'}
        </span>
        <button
          onClick={goNext}
          disabled={currentPageIndex >= totalPages - 1}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            currentPageIndex < totalPages - 1
              ? 'bg-white/10 text-white hover:bg-white/20'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          )}
        >
          Next
        </button>
      </div>

      <button
        onClick={togglePreview}
        className="absolute top-4 right-4 text-white/50 hover:text-white text-lg transition-colors"
      >
        &times;
      </button>
    </div>
  );
});

export default PreviewMode;
