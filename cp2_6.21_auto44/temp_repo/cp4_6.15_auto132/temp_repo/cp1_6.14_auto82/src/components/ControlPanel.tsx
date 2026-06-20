import { Download, BookmarkPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCoverStore } from '@/store/useCoverStore';
import { TemplateId } from '@/types';
import TemplateSelector from './TemplateSelector';

interface ControlPanelProps {
  onExport?: () => void;
  onSave?: () => void;
}

const TITLE_MAX_LENGTH = 60;
const SUMMARY_MAX_LENGTH = 120;
const AUTHOR_MAX_LENGTH = 30;

export default function ControlPanel({ onExport, onSave }: ControlPanelProps) {
  const currentCover = useCoverStore((state) => state.currentCover);
  const setCoverField = useCoverStore((state) => state.setCoverField);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCoverField('title', e.target.value.slice(0, TITLE_MAX_LENGTH));
  };

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCoverField('summary', e.target.value.slice(0, SUMMARY_MAX_LENGTH));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCoverField('date', e.target.value);
  };

  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCoverField('author', e.target.value.slice(0, AUTHOR_MAX_LENGTH));
  };

  const handleTemplateChange = (template: TemplateId) => {
    setCoverField('template', template);
  };

  const titleRemaining = TITLE_MAX_LENGTH - currentCover.title.length;
  const summaryRemaining = SUMMARY_MAX_LENGTH - currentCover.summary.length;
  const isSummaryOverLimit = currentCover.summary.length > SUMMARY_MAX_LENGTH;
  const authorRemaining = AUTHOR_MAX_LENGTH - currentCover.author.length;

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-paper-shadow-lg">
      <div className="mb-6">
        <h2 className="section-title text-xl">参数设置</h2>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="title"
              className="font-sans text-sm font-semibold text-ink/90"
            >
              新闻标题
            </label>
            <span
              className={cn(
                'font-sans text-xs font-medium transition-colors duration-200',
                titleRemaining <= 10 ? 'text-vintage-red' : 'text-ink/50'
              )}
            >
              {currentCover.title.length}/{TITLE_MAX_LENGTH}
            </span>
          </div>
          <input
            id="title"
            type="text"
            value={currentCover.title}
            onChange={handleTitleChange}
            maxLength={TITLE_MAX_LENGTH}
            placeholder="请输入新闻标题..."
            className={cn(
              'input-vintage text-lg font-bold',
              titleRemaining <= 10 && 'ring-1 ring-vintage-red/30'
            )}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="summary"
              className="font-sans text-sm font-semibold text-ink/90"
            >
              内容摘要
            </label>
            <span
              className={cn(
                'font-sans text-xs font-medium transition-colors duration-200',
                isSummaryOverLimit ? 'text-red-500' : summaryRemaining <= 20 ? 'text-vintage-red' : 'text-ink/50'
              )}
            >
              {currentCover.summary.length}/{SUMMARY_MAX_LENGTH}
            </span>
          </div>
          <textarea
            id="summary"
            rows={4}
            value={currentCover.summary}
            onChange={handleSummaryChange}
            maxLength={SUMMARY_MAX_LENGTH}
            placeholder="请输入内容摘要..."
            className={cn(
              'input-vintage resize-none',
              isSummaryOverLimit && 'border-red-500 focus:border-red-500 focus:ring-red-200'
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="date"
              className="font-sans text-sm font-semibold text-ink/90"
            >
              出版日期
            </label>
            <input
              id="date"
              type="date"
              value={currentCover.date}
              onChange={handleDateChange}
              className="input-vintage"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="author"
                className="font-sans text-sm font-semibold text-ink/90"
              >
                作者署名
              </label>
              <span
                className={cn(
                  'font-sans text-xs font-medium transition-colors duration-200',
                  authorRemaining <= 5 ? 'text-vintage-red' : 'text-ink/50'
                )}
              >
                {currentCover.author.length}/{AUTHOR_MAX_LENGTH}
              </span>
            </div>
            <input
              id="author"
              type="text"
              value={currentCover.author}
              onChange={handleAuthorChange}
              maxLength={AUTHOR_MAX_LENGTH}
              placeholder="请输入作者..."
              className={cn(
                'input-vintage',
                authorRemaining <= 5 && 'ring-1 ring-vintage-red/30'
              )}
            />
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <label className="font-sans text-sm font-semibold text-ink/90">
            报纸风格
          </label>
          <TemplateSelector
            selected={currentCover.template}
            onSelect={handleTemplateChange}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-7">
        <button
          type="button"
          onClick={onExport}
          className="btn-gold flex-1"
        >
          <Download className="w-5 h-5" />
          下载封面
        </button>
        <button
          type="button"
          onClick={onSave}
          className="btn-secondary flex-1"
        >
          <BookmarkPlus className="w-5 h-5" />
          保存记录
        </button>
      </div>
    </div>
  );
}
