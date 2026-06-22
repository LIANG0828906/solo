import { useState, useEffect } from 'react';

interface BorrowRecord {
  id: string;
  bookId: string;
  borrowerName: string;
  borrowDate: string;
  returnDate?: string;
}

interface HistoryPanelProps {
  bookId: string;
}

const HistoryPanel = ({ bookId }: HistoryPanelProps) => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [bookId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/books/${bookId}/history`);
      const data = await response.json();
      setRecords(data);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>加载中...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.title}>借阅历史</div>
      {records.length === 0 ? (
        <div style={styles.empty}>暂无借阅记录</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>借阅者</th>
              <th style={styles.th}>借出日期</th>
              <th style={styles.th}>归还日期</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr
                key={record.id}
                style={{
                  ...styles.tableRow,
                  ...(index % 2 === 0 ? styles.rowEven : styles.rowOdd),
                }}
              >
                <td style={styles.td}>{record.borrowerName}</td>
                <td style={styles.td}>{record.borrowDate}</td>
                <td style={styles.td}>
                  {record.returnDate ? (
                    <span style={styles.returned}>{record.returnDate}</span>
                  ) : (
                    <span style={styles.notReturned}>借阅中</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: 12,
  },
  loading: {
    fontSize: 13,
    color: '#94a3b8',
    padding: 8,
  },
  empty: {
    fontSize: 13,
    color: '#94a3b8',
    padding: '8px 4px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    background: '#e2e8f0',
  },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: 13,
    fontWeight: 700,
    color: '#334155',
  },
  tableRow: {
    transition: 'background-color 0.2s ease-out',
  },
  rowEven: {
    background: '#f8fafc',
  },
  rowOdd: {
    background: '#ffffff',
  },
  td: {
    padding: '10px 14px',
    fontSize: 14,
    color: '#334155',
  },
  returned: {
    color: '#16a34a',
  },
  notReturned: {
    color: '#ea580c',
    fontWeight: 500,
  },
};

export default HistoryPanel;
