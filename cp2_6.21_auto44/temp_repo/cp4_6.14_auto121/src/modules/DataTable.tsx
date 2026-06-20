import type { DataTableProps } from '../types';

export default function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        overflow: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            {columns.map((column, index) => (
              <th
                key={index}
                style={{
                  padding: 8,
                  border: '1px solid #e2e8f0',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  fontSize: 14,
                  color: '#1e293b',
                }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  style={{
                    padding: 8,
                    border: '1px solid #e2e8f0',
                    fontSize: 14,
                    color: '#475569',
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
