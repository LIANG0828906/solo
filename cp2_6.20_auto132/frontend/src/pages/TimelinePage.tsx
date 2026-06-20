import { useEffect } from 'react';
import RecordCard from '../components/RecordCard';
import AddRecordForm from '../components/AddRecordForm';
import { useStore } from '../store/useStore';
import type { TrainingType } from '../types';

const TimelinePage = () => {
  const { records, loading, fetchRecords, addRecord } = useStore();

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const sortedRecords = [...records].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleAddRecord = async (data: {
    type: TrainingType;
    duration: number;
    date: string;
    notes: string;
  }) => {
    await addRecord(data);
  };

  return (
    <div className="page-container">
      <AddRecordForm onSubmit={handleAddRecord} loading={loading} />

      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          marginBottom: '1.5rem',
          color: 'var(--text-primary)',
        }}
      >
        训练时间线
      </h2>

      {loading && records.length === 0 ? (
        <div className="loading">加载中...</div>
      ) : sortedRecords.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '3rem',
          }}
        >
          <div
            style={{
              fontSize: '3rem',
              marginBottom: '1rem',
            }}
          >
            🏃
          </div>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1.1rem',
            }}
          >
            还没有训练记录，开始你的第一次训练吧！
          </p>
        </div>
      ) : (
        <div
          style={{
            position: 'relative',
            paddingLeft: '0.5rem',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '8px',
              top: '0',
              bottom: '0',
              width: '2px',
              backgroundColor: 'var(--border)',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            {sortedRecords.map((record, index) => (
              <RecordCard key={record.id} record={record} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelinePage;
