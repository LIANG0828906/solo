import { useAlgorithmStore } from '../stores/algorithmStore';
import type { EightQueensInfo, AStarInfo, BinaryTreeInfo } from '../utils/colorUtils';

export function InfoPanel() {
  const { algorithmType, currentStepIndex, snapshots, jumpToStep } = useAlgorithmStore();
  const currentSnapshot = snapshots[currentStepIndex];
  const totalSteps = snapshots.length;
  const progress = totalSteps > 1 ? (currentStepIndex / (totalSteps - 1)) * 100 : 0;

  const renderInfoContent = () => {
    if (!currentSnapshot) return null;
    const info = currentSnapshot.infoData;

    switch (algorithmType) {
      case 'eightQueens': {
        const eq = info as EightQueensInfo;
        return (
          <>
            <InfoRow label="当前行数" value={`${eq.currentRow + 1} / 8`} />
            <InfoRow label="已放置皇后" value={`${eq.placedQueens}`} />
            <InfoRow label="回溯次数" value={`${eq.backtrackCount}`} />
          </>
        );
      }
      case 'aStar': {
        const ast = info as AStarInfo;
        return (
          <>
            <InfoRow label="已考察节点" value={`${ast.exploredNodes}`} />
            <InfoRow label="当前路径长度" value={`${ast.currentPathLength}`} />
            <InfoRow label="启发式估计值" value={`${ast.heuristicEstimate}`} />
          </>
        );
      }
      case 'binaryTree': {
        const bt = info as BinaryTreeInfo;
        return (
          <>
            <InfoRow label="当前节点值" value={bt.currentNodeValue !== null ? `${bt.currentNodeValue}` : '-'} />
            <InfoRow label="访问顺序索引" value={`${bt.visitOrderIndex}`} />
          </>
        );
      }
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const targetIndex = Math.round(ratio * (totalSteps - 1));
    jumpToStep(targetIndex);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 80,
        right: 20,
        width: 280,
        background: '#1E1E2E',
        borderRadius: 8,
        border: '1px solid #3D3D5C',
        padding: 20,
        zIndex: 10,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <h3
          style={{
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 600,
            margin: 0,
            marginBottom: 4,
          }}
        >
          算法状态
        </h3>
        <span
          style={{
            color: '#6C63FF',
            fontSize: 12,
          }}
        >
          步骤 {currentStepIndex + 1} / {totalSteps}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {renderInfoContent()}
      </div>

      <div
        style={{
          padding: '12px 14px',
          background: '#2D2D44',
          borderRadius: 6,
          marginBottom: 20,
        }}
      >
        <p
          style={{
            color: '#CCCCCC',
            fontSize: 13,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {currentSnapshot?.description || '等待开始...'}
        </p>
      </div>

      <div>
        <span
          style={{
            color: '#888',
            fontSize: 11,
            display: 'block',
            marginBottom: 8,
          }}
        >
          时间线
        </span>
        <div
          onClick={handleTimelineClick}
          style={{
            width: '100%',
            height: 20,
            background: '#2D2D44',
            borderRadius: 4,
            position: 'relative',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: '#6C63FF',
              borderRadius: 4,
              transition: 'width 0.2s ease',
              boxShadow: '0 0 10px rgba(108, 99, 255, 0.5)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: `calc(${progress}% - 6px)`,
              top: 2,
              width: 16,
              height: 16,
              background: '#FFFFFF',
              borderRadius: '50%',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              transition: 'left 0.2s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ color: '#888888', fontSize: 13 }}>{label}</span>
      <span
        style={{
          color: '#FFFFFF',
          fontSize: 20,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}
