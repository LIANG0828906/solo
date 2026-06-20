import {
  BookPlus,
  Undo2,
  Redo2,
  FilePlus,
  FileOutput,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolbarProps {
  onNewJournal?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onNewPage?: () => void;
  onExportPdf?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  className?: string;
}

export default function Toolbar({
  onNewJournal,
  onUndo,
  onRedo,
  onNewPage,
  onExportPdf,
  canUndo = true,
  canRedo = true,
  className,
}: ToolbarProps) {
  const baseButton =
    'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-80 active:opacity-100 disabled:opacity-40 disabled:cursor-not-allowed';

  const retroGreenButton = cn(baseButton, 'bg-[#5a7d5a]');

  const gradientButton = cn(
    baseButton,
    'bg-gradient-to-r from-[#6b8e6b] via-[#8fbc8f] to-[#5a7d5a] shadow-md'
  );

  return (
    <header
      className={cn(
        'sticky top-4 z-20 mx-auto flex w-full max-w-5xl items-center justify-between gap-3 rounded-2xl bg-[#fdf8f0] px-4 py-3 shadow-lg sm:px-6',
        className
      )}
    >
      <button
        type="button"
        onClick={onNewJournal}
        className={retroGreenButton}
        title="新建手账本"
      >
        <BookPlus className="h-4 w-4" />
        <span className="hidden sm:inline">新建手账本</span>
      </button>

      <nav className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={retroGreenButton}
          title="撤销 (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
          <span className="hidden md:inline">撤销</span>
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={retroGreenButton}
          title="重做 (Ctrl+Y)"
        >
          <Redo2 className="h-4 w-4" />
          <span className="hidden md:inline">重做</span>
        </button>

        <button
          type="button"
          onClick={onNewPage}
          className={retroGreenButton}
          title="新建页面"
        >
          <FilePlus className="h-4 w-4" />
          <span className="hidden sm:inline">新建页面</span>
        </button>
      </nav>

      <button
        type="button"
        onClick={onExportPdf}
        className={gradientButton}
        title="导出PDF"
      >
        <FileOutput className="h-4 w-4" />
        <span className="hidden sm:inline">导出PDF</span>
      </button>
    </header>
  );
}
