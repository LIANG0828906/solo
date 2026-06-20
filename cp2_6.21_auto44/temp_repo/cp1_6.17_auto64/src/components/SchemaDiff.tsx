import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  getSchemaType,
  hasChildren,
  TYPE_COLORS,
  type JSONSchema,
  type DiffResult,
} from '@/types/schema';
import { createDiffPathSet, getDiffForPath, countDiffs } from '@/utils/diff';
import { DiffDetailModal } from './DiffDetailModal';

interface SchemaDiffProps {
  oldSchema: JSONSchema | null;
  newSchema: JSONSchema | null;
  diffResults: DiffResult[];
  showOnlyDiff: boolean;
}

interface DiffTreeNodeProps {
  name: string;
  schema: JSONSchema;
  path: string[];
  depth: number;
  side: 'left' | 'right';
  diffSet: Set<string>;
  diffResults: DiffResult[];
  showOnlyDiff: boolean;
  onNodeClick: (diff: DiffResult) => void;
  nodeRefs: React.MutableRefObject<Map<string, HTMLDivElement | null>>;
}

const DiffTreeNode: React.FC<DiffTreeNodeProps> = React.memo(
  ({
    name,
    schema,
    path,
    depth,
    side,
    diffSet,
    diffResults,
    showOnlyDiff,
    onNodeClick,
    nodeRefs,
  }) => {
    const [expanded, setExpanded] = useState(depth < 1);
    const nodeType = getSchemaType(schema);
    const hasChild = hasChildren(schema);
    const typeColor = TYPE_COLORS[nodeType];
    const pathStr = path.join('.');

    const diffInfo = useMemo(
      () => getDiffForPath(diffResults, path),
      [diffResults, pathStr],
    );

    const hasDiffInSubtree = diffSet.has(pathStr) || diffInfo !== null;

    const isDiffNode = diffInfo !== null;

    const diffBgColor = useMemo(() => {
      if (!diffInfo) return 'transparent';
      if (diffInfo.type === 'add' && side === 'right') return '#d1fae5';
      if (diffInfo.type === 'remove' && side === 'left') return '#fecaca';
      if (diffInfo.type === 'modify') return '#fef9c3';
      return 'transparent';
    }, [diffInfo, side]);

    const hasStrikeThrough = diffInfo?.type === 'remove' && side === 'left';

    const hasAddHighlight = diffInfo?.type === 'add' && side === 'right';

    const handleToggle = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setExpanded((prev) => !prev);
    }, []);

    const handleClick = useCallback(() => {
      if (diffInfo) {
        onNodeClick(diffInfo);
      }
    }, [diffInfo, onNodeClick]);

    const setRef = useCallback(
      (el: HTMLDivElement | null) => {
        if (isDiffNode) {
          nodeRefs.current.set(`${side}-${pathStr}`, el);
        }
      },
      [side, pathStr, isDiffNode, nodeRefs],
    );

    const children = useMemo(() => {
      if (!hasChild || !expanded) return null;

      let childEntries: [string, JSONSchema][] = [];

      if (nodeType === 'object' && schema.properties) {
        childEntries = Object.entries(schema.properties);
      } else if (nodeType === 'array' && schema.items) {
        childEntries = [['items', schema.items]];
      }

      if (showOnlyDiff) {
        childEntries = childEntries.filter(([key]) => {
          const childPath = [...path, key].join('.');
          return diffSet.has(childPath);
        });
      }

      if (childEntries.length === 0) return null;

      return childEntries.map(([key, childSchema]) => (
        <DiffTreeNode
          key={key}
          name={key}
          schema={childSchema}
          path={[...path, key]}
          depth={depth + 1}
          side={side}
          diffSet={diffSet}
          diffResults={diffResults}
          showOnlyDiff={showOnlyDiff}
          onNodeClick={onNodeClick}
          nodeRefs={nodeRefs}
        />
      ));
    }, [
      hasChild,
      expanded,
      nodeType,
      schema,
      showOnlyDiff,
      path,
      depth,
      side,
      diffSet,
      diffResults,
      onNodeClick,
      nodeRefs,
    ]);

    if (showOnlyDiff && !hasDiffInSubtree && depth > 0) {
      return null;
    }

    return (
      <div className="diff-tree-node-container">
        <div
          ref={setRef}
          className={`diff-tree-node ${isDiffNode ? 'has-diff' : ''}`}
          style={{
            paddingLeft: `${depth * 16 + 8}px`,
            backgroundColor: diffBgColor,
            cursor: isDiffNode ? 'pointer' : 'default',
          }}
          onClick={handleClick}
        >
          {hasChild ? (
            <span
              className={`diff-tree-toggle ${expanded ? 'expanded' : ''}`}
              onClick={handleToggle}
            >
              ▶
            </span>
          ) : (
            <span className="diff-tree-toggle-placeholder" />
          )}
          <span
            className="diff-tree-node-name"
            style={{
              textDecoration: hasStrikeThrough ? 'line-through' : 'none',
              opacity: hasStrikeThrough ? 0.7 : 1,
            }}
          >
            {name}
          </span>
          <span
            className="diff-tree-type-tag"
            style={{
              backgroundColor: typeColor + '20',
              color: typeColor,
              borderColor: typeColor + '40',
            }}
          >
            {nodeType}
          </span>
          {hasAddHighlight && (
            <span className="diff-badge add-badge">+</span>
          )}
        </div>
        {hasChild && expanded && (
          <div
            className="diff-tree-children"
            style={{ maxHeight: expanded ? '10000px' : '0' }}
          >
            {children}
          </div>
        )}
      </div>
    );
  },
);

DiffTreeNode.displayName = 'DiffTreeNode';

export const SchemaDiff: React.FC<SchemaDiffProps> = ({
  oldSchema,
  newSchema,
  diffResults,
  showOnlyDiff,
}) => {
  const [selectedDiff, setSelectedDiff] = useState<DiffResult | null>(null);
  const leftRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const rightRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState(0);

  const diffSet = useMemo(() => createDiffPathSet(diffResults), [diffResults]);
  const diffCounts = useMemo(() => countDiffs(diffResults), [diffResults]);

  const handleNodeClick = useCallback((diff: DiffResult) => {
    setSelectedDiff(diff);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedDiff(null);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => forceUpdate((n) => n + 1), 350);
    return () => clearTimeout(timer);
  }, [diffResults, showOnlyDiff]);

  const diffLineElements = useMemo(() => {
    const lines: JSX.Element[] = [];

    diffResults.forEach((diff, index) => {
      const pathStr = diff.path.join('.');
      const leftEl = leftRefs.current.get(`left-${pathStr}`);
      const rightEl = rightRefs.current.get(`right-${pathStr}`);
      const container = containerRef.current;

      if (!container) return;

      const containerRect = container.getBoundingClientRect();

      let leftTop = -1;
      let rightTop = -1;

      if (leftEl) {
        const rect = leftEl.getBoundingClientRect();
        leftTop = rect.top - containerRect.top + rect.height / 2;
      }
      if (rightEl) {
        const rect = rightEl.getBoundingClientRect();
        rightTop = rect.top - containerRect.top + rect.height / 2;
      }

      if (leftTop < 0 || rightTop < 0) return;

      const lineColor =
        diff.type === 'add'
          ? '#10b981'
          : diff.type === 'remove'
            ? '#ef4444'
            : '#f59e0b';

      const midX = containerRect.width / 2;
      const leftX = containerRect.width * 0.35;
      const rightX = containerRect.width * 0.65;

      lines.push(
        <path
          key={`line-${index}`}
          d={`M ${leftX} ${leftTop} C ${midX} ${leftTop}, ${midX} ${rightTop}, ${rightX} ${rightTop}`}
          stroke={lineColor}
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="4,4"
          opacity="0.6"
        />,
      );
    });

    return lines;
  }, [diffResults]);

  if (!oldSchema || !newSchema) {
    return (
      <div className="diff-empty-state">
        <div className="diff-empty-icon">📄</div>
        <p>请选择两个 Schema 文件进行对比</p>
        <style>{`
          .diff-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #64748b;
          }
          .diff-empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="schema-diff-wrapper" ref={containerRef}>
      <div className="diff-summary-card">
        <div className="diff-summary-item">
          <span className="diff-summary-count" style={{ color: '#10b981' }}>
            +{diffCounts.add}
          </span>
          <span className="diff-summary-label">新增</span>
        </div>
        <div className="diff-summary-item">
          <span className="diff-summary-count" style={{ color: '#ef4444' }}>
            -{diffCounts.remove}
          </span>
          <span className="diff-summary-label">删除</span>
        </div>
        <div className="diff-summary-item">
          <span className="diff-summary-count" style={{ color: '#f59e0b' }}>
            ~{diffCounts.modify}
          </span>
          <span className="diff-summary-label">修改</span>
        </div>
      </div>

      <div className="diff-trees-container">
        <svg className="diff-connector-svg">
          {diffLineElements}
        </svg>

        <div className="diff-tree-panel left-panel">
          <div className="diff-tree-header">
            <span className="diff-tree-title">旧版本</span>
            <span className="diff-tree-subtitle">{oldSchema.title || 'Schema'}</span>
          </div>
          <div className="diff-tree-scroll">
            <DiffTreeNode
              name={oldSchema.title || 'Schema'}
              schema={oldSchema}
              path={[]}
              depth={0}
              side="left"
              diffSet={diffSet}
              diffResults={diffResults}
              showOnlyDiff={showOnlyDiff}
              onNodeClick={handleNodeClick}
              nodeRefs={leftRefs}
            />
          </div>
        </div>

        <div className="diff-tree-panel right-panel">
          <div className="diff-tree-header">
            <span className="diff-tree-title">新版本</span>
            <span className="diff-tree-subtitle">{newSchema.title || 'Schema'}</span>
          </div>
          <div className="diff-tree-scroll">
            <DiffTreeNode
              name={newSchema.title || 'Schema'}
              schema={newSchema}
              path={[]}
              depth={0}
              side="right"
              diffSet={diffSet}
              diffResults={diffResults}
              showOnlyDiff={showOnlyDiff}
              onNodeClick={handleNodeClick}
              nodeRefs={rightRefs}
            />
          </div>
        </div>
      </div>

      <DiffDetailModal diff={selectedDiff} onClose={handleCloseModal} />

      <style>{`
        .schema-diff-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          gap: 12px;
          position: relative;
          overflow: hidden;
        }

        .diff-summary-card {
          display: flex;
          gap: 24px;
          padding: 12px 16px;
          background: #2a2a40;
          border-radius: 8px;
          flex-shrink: 0;
          border: 1px solid #3a3a55;
        }

        .diff-summary-item {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .diff-summary-count {
          font-size: 20px;
          font-weight: 700;
        }

        .diff-summary-label {
          font-size: 13px;
          color: #94a3b8;
        }

        .diff-trees-container {
          flex: 1;
          display: flex;
          gap: 8px;
          min-height: 0;
          position: relative;
        }

        .diff-connector-svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .diff-tree-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #1e1e2e;
          border-radius: 8px;
          border: 1px solid #3a3a55;
          overflow: hidden;
          position: relative;
          z-index: 2;
        }

        .diff-tree-header {
          padding: 10px 14px;
          background: #252540;
          border-bottom: 1px solid #3a3a55;
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex-shrink: 0;
        }

        .diff-tree-title {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
        }

        .diff-tree-subtitle {
          font-size: 14px;
          color: #e2e8f0;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .diff-tree-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 4px 0;
        }

        .diff-tree-node-container {
          position: relative;
        }

        .diff-tree-node {
          display: flex;
          align-items: center;
          height: 32px;
          gap: 6px;
          position: relative;
          transition: background-color 0.15s ease;
        }

        .diff-tree-node:hover {
          background-color: rgba(58, 58, 85, 0.5) !important;
        }

        .diff-tree-node.has-diff {
          position: relative;
        }

        .diff-tree-node.has-diff::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          opacity: 0.5;
        }

        .diff-tree-toggle {
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: #94a3b8;
          transition: transform 0.2s ease;
          cursor: pointer;
          flex-shrink: 0;
        }

        .diff-tree-toggle.expanded {
          transform: rotate(90deg);
        }

        .diff-tree-toggle-placeholder {
          width: 16px;
          flex-shrink: 0;
        }

        .diff-tree-node-name {
          color: #e2e8f0;
          font-weight: 500;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .diff-tree-type-tag {
          font-size: 10px;
          padding: 1px 5px;
          border-radius: 4px;
          border: 1px solid;
          font-weight: 500;
          text-transform: lowercase;
          flex-shrink: 0;
        }

        .diff-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 0 4px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .add-badge {
          background: #10b981;
          color: white;
        }

        .diff-tree-children {
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        @media (max-width: 768px) {
          .diff-trees-container {
            flex-direction: column;
          }

          .diff-connector-svg {
            display: none;
          }

          .diff-tree-panel {
            min-height: 40%;
          }
        }
      `}</style>
    </div>
  );
};

export default SchemaDiff;
