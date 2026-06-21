import React from 'react';
import type { Branch, Paragraph } from './types';

interface BranchManagerProps {
  branches: Branch[];
  paragraphs: Paragraph[];
  activeBranchId: string;
  onSelectBranch: (branchId: string) => void;
}

interface BranchNode extends Branch {
  children: BranchNode[];
}

const BranchManager: React.FC<BranchManagerProps> = ({
  branches,
  paragraphs,
  activeBranchId,
  onSelectBranch,
}) => {
  const buildBranchTree = (branches: Branch[]): BranchNode[] => {
    const map = new Map<string, BranchNode>();
    const roots: BranchNode[] = [];

    for (const branch of branches) {
      map.set(branch.id, { ...branch, children: [] });
    }

    for (const branch of branches) {
      const node = map.get(branch.id)!;
      if (branch.parentBranchId === null) {
        roots.push(node);
      } else {
        const parent = map.get(branch.parentBranchId);
        if (parent) {
          parent.children.push(node);
        }
      }
    }

    return roots;
  };

  const getParagraphCount = (branchId: string): number => {
    return paragraphs.filter(p => p.branchId === branchId).length;
  };

  const renderBranchNode = (
    node: BranchNode,
    level: number,
    hasNextSibling: boolean,
    parentLines: boolean[]
  ): React.ReactNode => {
    const isActive = node.id === activeBranchId;
    const paragraphCount = getParagraphCount(node.id);

    return (
      <React.Fragment key={node.id}>
        <div
          onClick={() => onSelectBranch(node.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 12px',
            marginBottom: '4px',
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: isActive ? '#3B82F6' : 'transparent',
            transition: 'background-color 0.2s ease, transform 0.2s ease',
            animation: isActive ? 'fadeIn 0.3s ease-out' : 'none',
            position: 'relative',
            marginLeft: level > 0 ? `${level * 20}px` : '0',
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = '#334155';
              e.currentTarget.style.transform = 'translateX(2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateX(0)';
            }
          }}
        >
          {level > 0 && (
            <div
              style={{
                position: 'absolute',
                left: `-${level * 20}px`,
                top: '0',
                bottom: '0',
                width: `${level * 20}px`,
                pointerEvents: 'none',
              }}
            >
              {parentLines.map((showLine, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${idx * 20 + 10}px`,
                    top: '0',
                    bottom: hasNextSibling && idx === parentLines.length - 1 ? '50%' : '0',
                    width: '1px',
                    backgroundColor: showLine ? '#475569' : 'transparent',
                  }}
                />
              ))}
              <div
                style={{
                  position: 'absolute',
                  left: `${(level - 1) * 20 + 10}px`,
                  top: '50%',
                  width: '10px',
                  height: '1px',
                  backgroundColor: '#475569',
                }}
              />
            </div>
          )}

          <div
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                color: isActive ? '#FFFFFF' : '#E2E8F0',
                fontWeight: isActive ? 600 : 400,
                fontSize: '14px',
              }}
            >
              {node.name}
            </span>
            <span
              style={{
                color: isActive ? '#BFDBFE' : '#94A3B8',
                fontSize: '12px',
                backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#334155',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {paragraphCount} 段
            </span>
          </div>
        </div>

        {node.children.length > 0 &&
          node.children.map((child, idx) =>
            renderBranchNode(
              child,
              level + 1,
              idx < node.children.length - 1,
              [...parentLines, hasNextSibling]
            )
          )}
      </React.Fragment>
    );
  };

  const branchTree = buildBranchTree(branches);

  return (
    <div
      style={{
        width: '300px',
        backgroundColor: '#1E293B',
        borderRadius: '8px',
        margin: '24px 24px 24px 0',
        padding: '20px',
        height: 'calc(100vh - 60px - 48px)',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      <h3
        style={{
          color: '#F1F5F9',
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid #334155',
        }}
      >
        分支管理
      </h3>

      <div>
        {branchTree.map((root, idx) =>
          renderBranchNode(root, 0, idx < branchTree.length - 1, [])
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default BranchManager;
