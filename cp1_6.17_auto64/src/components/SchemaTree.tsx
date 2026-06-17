import React, { useState, useCallback, useMemo } from 'react';
import {
  getSchemaType,
  hasChildren,
  TYPE_COLORS,
  type JSONSchema,
} from '@/types/schema';

interface SchemaTreeProps {
  schema: JSONSchema;
  selectedPath: string[] | null;
  onSelect: (path: string[]) => void;
}

interface TreeNodeProps {
  name: string;
  schema: JSONSchema;
  path: string[];
  depth: number;
  isSelected: boolean;
  onSelect: (path: string[]) => void;
  defaultExpanded?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = React.memo(
  ({ name, schema, path, depth, isSelected, onSelect, defaultExpanded = false }) => {
    const [expanded, setExpanded] = useState(defaultExpanded || depth < 1);
    const nodeType = getSchemaType(schema);
    const hasChild = hasChildren(schema);
    const typeColor = TYPE_COLORS[nodeType];

    const handleToggle = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded((prev) => !prev);
      },
      [],
    );

    const handleClick = useCallback(() => {
      onSelect(path);
    }, [path, onSelect]);

    const children = useMemo(() => {
      if (!hasChild) return null;

      if (nodeType === 'object' && schema.properties) {
        return Object.entries(schema.properties).map(([key, childSchema]) => (
          <TreeNode
            key={key}
            name={key}
            schema={childSchema}
            path={[...path, key]}
            depth={depth + 1}
            isSelected={false}
            onSelect={onSelect}
          />
        ));
      }

      if (nodeType === 'array' && schema.items) {
        return (
          <TreeNode
            name="items"
            schema={schema.items}
            path={[...path, 'items']}
            depth={depth + 1}
            isSelected={false}
            onSelect={onSelect}
          />
        );
      }

      return null;
    }, [hasChild, nodeType, schema, path, depth, onSelect]);

    return (
      <div className="tree-node-container">
        <div
          className={`tree-node ${isSelected ? 'selected' : ''}`}
          style={{
            paddingLeft: `${depth * 16 + 8}px`,
            cursor: 'pointer',
          }}
          onClick={handleClick}
        >
          {hasChild ? (
            <span
              className={`tree-toggle ${expanded ? 'expanded' : ''}`}
              onClick={handleToggle}
            >
              ▶
            </span>
          ) : (
            <span className="tree-toggle-placeholder" />
          )}
          <span className="tree-node-name">{name}</span>
          <span
            className="tree-type-tag"
            style={{
              backgroundColor: typeColor + '20',
              color: typeColor,
              borderColor: typeColor + '40',
            }}
          >
            {nodeType}
          </span>
        </div>
        {hasChild && (
          <div
            className={`tree-children ${expanded ? 'expanded' : ''}`}
            style={{ maxHeight: expanded ? '10000px' : '0' }}
          >
            {children}
          </div>
        )}
      </div>
    );
  },
);

TreeNode.displayName = 'TreeNode';

export const SchemaTree: React.FC<SchemaTreeProps> = ({
  schema,
  selectedPath,
  onSelect,
}) => {
  const rootTitle = schema.title || 'Schema';

  return (
    <div className="schema-tree">
      <TreeNode
        name={rootTitle}
        schema={schema}
        path={[]}
        depth={0}
        isSelected={selectedPath !== null && selectedPath.length === 0}
        onSelect={onSelect}
        defaultExpanded={true}
      />
      <style>{`
        .schema-tree {
          font-size: 14px;
          line-height: 32px;
          user-select: none;
        }

        .tree-node {
          display: flex;
          align-items: center;
          height: 32px;
          gap: 6px;
          position: relative;
          transition: background-color 0.15s ease;
        }

        .tree-node:hover {
          background-color: #3a3a55;
        }

        .tree-node.selected {
          background-color: rgba(59, 130, 246, 0.15);
        }

        .tree-node.selected::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: #3b82f6;
        }

        .tree-toggle {
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

        .tree-toggle.expanded {
          transform: rotate(90deg);
        }

        .tree-toggle-placeholder {
          width: 16px;
          flex-shrink: 0;
        }

        .tree-node-name {
          color: #e2e8f0;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tree-type-tag {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid;
          font-weight: 500;
          text-transform: lowercase;
          flex-shrink: 0;
        }

        .tree-children {
          overflow: hidden;
          transition: max-height 0.3s ease;
          position: relative;
        }

        .tree-children::before {
          content: '';
          position: absolute;
          left: 24px;
          top: 0;
          bottom: 0;
          width: 1px;
          background-color: #cbd5e1;
          opacity: 0.3;
        }
      `}</style>
    </div>
  );
};

export default SchemaTree;
