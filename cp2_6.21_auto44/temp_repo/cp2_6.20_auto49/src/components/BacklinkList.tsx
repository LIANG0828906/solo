import type { BacklinkItem } from '@/types';

interface BacklinkListProps {
  backlinks: BacklinkItem[];
  onClick: (id: string) => void;
}

export default function BacklinkList({ backlinks, onClick }: BacklinkListProps) {
  if (backlinks.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h3 className="font-sans font-semibold text-lg mb-3">反向链接</h3>
      {backlinks.map((backlink) => (
        <div
          key={backlink.noteId}
          className="backlink-item rounded-lg bg-white/50 border border-gray-100 p-4 mb-2 hover:bg-white transition-colors cursor-pointer"
          onClick={() => onClick(backlink.noteId)}
        >
          <div className="font-sans font-medium text-garden-teal">{backlink.title}</div>
          <pre className="bg-gray-50 p-2 rounded font-mono text-xs text-gray-600 mt-2 whitespace-pre-wrap">
            {backlink.snippet}
          </pre>
        </div>
      ))}
    </div>
  );
}
