import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DrillDownPanelProps {
  isOpen: boolean;
  onClose: () => void;
  chartType: string;
  chartTitle: string;
  dataPoint: unknown;
  detailTable: unknown[];
  subChartData: unknown[];
}

function DrillDownPanel({
  isOpen,
  onClose,
  chartType,
  chartTitle,
  dataPoint,
  detailTable,
  subChartData,
}: DrillDownPanelProps) {
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const sortedData = useMemo(() => {
    if (!sortField || !detailTable.length) return detailTable;
    const data = [...detailTable] as Record<string, unknown>[];
    data.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
    return data;
  }, [detailTable, sortField, sortDirection]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const tableColumns = detailTable[0]
    ? Object.keys(detailTable[0] as Record<string, unknown>)
    : [];

  const dataPointLabel = useMemo(() => {
    if (!dataPoint) return '';
    const dp = dataPoint as Record<string, unknown>;
    if (dp.category) return dp.category as string;
    if (dp.time) return dp.time as string;
    if (dp.region) return `${dp.region} - ${dp.hour}时`;
    return '';
  }, [dataPoint]);

  const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <>
      <div
        className={`drilldown-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      <div className={`drilldown-panel ${isOpen ? 'open' : ''}`}>
        <div className="drilldown-header">
          <div>
            <h3>钻取分析 - {chartTitle}</h3>
            <p className="drilldown-subtitle">{dataPointLabel}</p>
          </div>
          <button className="drilldown-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="drilldown-content">
          <div className="drilldown-section">
            <h4>数据明细</h4>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {tableColumns.map((col) => (
                      <th key={col} onClick={() => handleSort(col)}>
                        {col}
                        {sortField === col && (
                          <span className="sort-icon">
                            {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, idx) => (
                    <tr key={idx}>
                      {tableColumns.map((col) => (
                        <td key={col}>
                          {String((row as Record<string, unknown>)[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                上一页
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                下一页
              </button>
            </div>
          </div>

          <div className="drilldown-section">
            <h4>关联图表</h4>
            <div className="subchart-container">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={subChartData as Record<string, unknown>[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {(subChartData as Record<string, unknown>[]).map((_entry, index) => (
                      <rect
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .drilldown-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
          z-index: 998;
        }
        .drilldown-overlay.open {
          opacity: 1;
          visibility: visible;
        }
        .drilldown-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 480px;
          height: 100vh;
          background: #fff;
          box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
          transform: translateX(100%);
          transition: transform 0.3s ease, opacity 0.3s ease;
          opacity: 0;
          z-index: 999;
          display: flex;
          flex-direction: column;
        }
        .drilldown-panel.open {
          transform: translateX(0);
          opacity: 1;
        }
        .drilldown-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .drilldown-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }
        .drilldown-subtitle {
          margin: 4px 0 0 0;
          font-size: 14px;
          color: #64748b;
        }
        .drilldown-close {
          width: 32px;
          height: 32px;
          border: none;
          background: #f1f5f9;
          border-radius: 8px;
          font-size: 20px;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .drilldown-close:hover {
          background: #e2e8f0;
          transform: scale(0.97);
        }
        .drilldown-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
        }
        .drilldown-section {
          margin-bottom: 28px;
        }
        .drilldown-section h4 {
          margin: 0 0 12px 0;
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
        }
        .table-container {
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .data-table th {
          background: #f8fafc;
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
          cursor: pointer;
          user-select: none;
          transition: background 0.2s ease;
        }
        .data-table th:hover {
          background: #f1f5f9;
        }
        .data-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }
        .data-table tr:last-child td {
          border-bottom: none;
        }
        .sort-icon {
          color: #6366f1;
        }
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 12px;
        }
        .pagination button {
          padding: 6px 14px;
          border: 1px solid #e2e8f0;
          background: #fff;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          color: #475569;
          transition: all 0.2s ease;
        }
        .pagination button:hover:not(:disabled) {
          background: #f8fafc;
          transform: scale(0.97);
        }
        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pagination span {
          font-size: 13px;
          color: #64748b;
        }
        .subchart-container {
          background: #fafbfc;
          border-radius: 8px;
          padding: 16px;
        }
        @media (max-width: 768px) {
          .drilldown-panel {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

export default DrillDownPanel;
