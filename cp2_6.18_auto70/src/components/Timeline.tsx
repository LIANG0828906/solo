import { format } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Version } from '@/types';

interface TimelineProps {
  versions: Version[];
  selectedIds: [string | null, string | null];
  onSelect: (id: string, slot: 0 | 1) => void;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
}

export default function Timeline({
  versions,
  selectedIds,
  onSelect,
  expandedId,
  onToggleExpand,
}: TimelineProps) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-timeline" />
      <div className="space-y-4">
        {versions.map((version) => {
          const isExpanded = expandedId === version.id;
          const isSelectedSlot0 = selectedIds[0] === version.id;
          const isSelectedSlot1 = selectedIds[1] === version.id;
          const isSelected = isSelectedSlot0 || isSelectedSlot1;

          return (
            <div key={version.id} className="relative">
              <div className="flex items-start gap-3">
                <div className="relative z-10">
                  <button
                    onClick={() => onToggleExpand(version.id)}
                    className={cn(
                      'w-3 h-3 rounded-full border-2 border-accent transition-all duration-300 ease',
                      isExpanded ? 'bg-accent scale-125' : 'bg-bg-main hover:bg-accent/50'
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onToggleExpand(version.id)}
                      className="flex items-center gap-1 text-sm font-medium text-text-primary hover:text-accent transition-colors duration-300 ease"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span>{version.version}</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs text-text-secondary">
                        <span className="text-[10px]">对比1</span>
                        <input
                          type="checkbox"
                          checked={isSelectedSlot0}
                          onChange={() => onSelect(version.id, 0)}
                          className="w-3.5 h-3.5 accent-old-version"
                        />
                      </label>
                      <label className="flex items-center gap-1 text-xs text-text-secondary">
                        <span className="text-[10px]">对比2</span>
                        <input
                          type="checkbox"
                          checked={isSelectedSlot1}
                          onChange={() => onSelect(version.id, 1)}
                          className="w-3.5 h-3.5 accent-new-version"
                        />
                      </label>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-300 ease',
                      isExpanded ? 'max-h-60 mt-2 opacity-100' : 'max-h-0 opacity-0'
                    )}
                  >
                    <div className="bg-bg-card rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="font-medium text-text-primary">{version.uploader}</span>
                        <span>上传于 {format(version.uploadTime, 'yyyy-MM-dd HH:mm')}</span>
                      </div>
                      {version.note && (
                        <p className="text-sm text-text-secondary line-clamp-3">
                          {version.note.slice(0, 200)}
                          {version.note.length > 200 && '...'}
                        </p>
                      )}
                      {isSelected && (
                        <div
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs',
                            isSelectedSlot0
                              ? 'bg-old-version/20 text-old-version'
                              : 'bg-new-version/20 text-new-version'
                          )}
                        >
                          已选为{isSelectedSlot0 ? '旧版本' : '新版本'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
