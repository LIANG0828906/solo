import React, { useMemo } from 'react';
import { useMockStore } from '../../moduleB/store/mockStore';
import type { ComponentProps } from '../../types';
import { formatValueForDisplay } from '../../utils';

interface SandboxTableProps extends ComponentProps {
  dataKey?: string;
  columns?: string[];
}

export const SandboxTable: React.FC<SandboxTableProps> = React.memo((props) => {
  const { dataKey = 'tableData', columns = [] } = props;
  const getDataByKey = useMockStore((state) => state.getDataByKey);

  const data = useMemo(() => {
    const rawData = getDataByKey(dataKey);
    return Array.isArray(rawData) ? rawData : [];
  }, [dataKey, getDataByKey]);

  const displayColumns = useMemo(() => {
    if (columns.length > 0) return columns;
    if (data.length > 0) {
      return Object.keys(data[0]);
    }
    return [];
  }, [columns, data]);

  if (data.length === 0) {
    return (
      <div className="empty-state" style={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
        暂无数据
      </div>
    );
  }

  return (
    <table className="sandbox-table">
      <thead>
        <tr>
          {displayColumns.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row: any, rowIndex: number) => (
          <tr key={rowIndex}>
            {displayColumns.map((col) => (
              <td key={col}>{formatValueForDisplay(row[col])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
});

SandboxTable.displayName = 'SandboxTable';
