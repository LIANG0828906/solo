import { diffChars } from 'diff';
import { v4 as uuidv4 } from 'uuid';
import type { DiffChunk, DiffResult } from './types';

interface DiffViewerProps {
  oldText: string;
  newText: string;
  chunks: DiffChunk[] | null;
  onChunksChange: (chunks: DiffChunk[]) => void;
  onChunkAccept: (chunkId: string) => void;
  onChunkReject: (chunkId: string) => void;
  animationKey: number;
}

export function computeDiff(oldText: string, newText: string): DiffResult {
  const changes = diffChars(oldText, newText);
  const chunks: DiffChunk[] = changes.map((part) => ({
    id: uuidv4(),
    operation: part.added ? 'insert' : part.removed ? 'delete' : 'equal',
    value: part.value,
    accepted: undefined,
  }));
  return { chunks };
}

export default function DiffViewer({
  oldText,
  newText,
  chunks,
  onChunksChange,
  onChunkAccept,
  onChunkReject,
  animationKey,
}: DiffViewerProps) {
  if (!chunks) {
    const result = computeDiff(oldText, newText);
    onChunksChange(result.chunks);
    return null;
  }

  const hasChanges = chunks.some((c) => c.operation !== 'equal');

  if (!hasChanges) {
    return (
      <div className="diff-section" key={animationKey}>
        <h3 className="diff-title">差异对比</h3>
        <div className="diff-content">
          <div className="empty-diff">两个版本完全相同，没有差异。</div>
        </div>
      </div>
    );
  }

  return (
    <div className="diff-section" key={animationKey}>
      <h3 className="diff-title">差异对比（点击按钮逐块接受或拒绝）</h3>
      <div className="diff-content">
        {chunks.map((chunk) => (
          <div
            key={chunk.id}
            className={`diff-chunk ${chunk.operation} ${
              chunk.accepted === true ? 'accepted' : chunk.accepted === false ? 'rejected' : ''
            }`}
          >
            <span className="diff-chunk-text">
              {chunk.accepted === false && chunk.operation === 'insert'
                ? ''
                : chunk.accepted === false && chunk.operation === 'delete'
                ? chunk.value
                : chunk.value}
            </span>
            {(chunk.operation === 'insert' || chunk.operation === 'delete') &&
              chunk.accepted === undefined && (
                <div className="diff-chunk-actions">
                  <button
                    className="btn btn-accept"
                    onClick={() => onChunkAccept(chunk.id)}
                    title="接受此差异"
                  >
                    接受
                  </button>
                  <button
                    className="btn btn-reject"
                    onClick={() => onChunkReject(chunk.id)}
                    title="拒绝此差异"
                  >
                    拒绝
                  </button>
                </div>
              )}
            {chunk.accepted === true && (
              <span style={{ fontSize: '11px', color: '#4caf50', flexShrink: 0 }}>✓ 已接受</span>
            )}
            {chunk.accepted === false && (
              <span style={{ fontSize: '11px', color: '#f44336', flexShrink: 0 }}>✗ 已拒绝</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
