import React from 'react';
import type { MaterialMeta } from '../types';

interface MetadataTableProps {
  metadata: MaterialMeta[];
  sortField: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  onItemClick: (item: MaterialMeta) => void;
}

const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const columns = [
  { key: 'thumbnailUrl', label: '缩略图', sortable: false },
  { key: 'title', label: '标题', sortable: true },
  { key: 'scene', label: '场景', sortable: true },
  { key: 'actor', label: '演员', sortable: true },
  { key: 'lighting', label: '灯光', sortable: true },
  { key: 'duration', label: '时长', sortable: true },
  { key: 'createTime', label: '创建时间', sortable: true }
];

const MetadataTable: React.FC<MetadataTableProps> = ({
  metadata,
  sortField,
  sortOrder,
  onSort,
  onItemClick
}) => {
  if (metadata.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📹</div>
        <div className="empty-state-text">暂无素材数据</div>
      </div>
    );
  }

  return (
    <div className="table-view">
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={sortField === col.key ? 'sorted' : ''}
                onClick={() => col.sortable && onSort(col.key)}
                style={{ cursor: col.sortable ? 'pointer' : 'default' }}
              >
                {col.label}
                {col.sortable && (
                  <span className="sort-icon">
                    {sortField === col.key ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metadata.map(item => (
            <tr key={item.id} onClick={() => onItemClick(item)}>
              <td>
                <div className="table-thumb">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.title} />
                  ) : null}
                </div>
              </td>
              <td>{item.title}</td>
              <td>{item.scene || '-'}</td>
              <td>{item.actor || '-'}</td>
              <td>{item.lighting || '-'}</td>
              <td>{item.duration}秒</td>
              <td>{formatTime(item.createTime)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MetadataTable;
