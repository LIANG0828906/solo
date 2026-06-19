import { useMemo, useState } from 'react';
import { initialRecords, type VinylRecord, type Feedback } from './data/records';
import RecordCard from './components/RecordCard';
import DetailPanel from './components/DetailPanel';
import './styles/global.css';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function App() {
  const [records, setRecords] = useState<VinylRecord[]>(initialRecords);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<VinylRecord | null>(null);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.artist.toLowerCase().includes(q),
    );
  }, [records, searchQuery]);

  const handleCardClick = (record: VinylRecord) => {
    setSelectedRecord(record);
  };

  const handleClosePanel = () => {
    setSelectedRecord(null);
  };

  const handleMarkSold = (recordId: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        if (r.stock <= 0) return r;
        const today = formatDate(new Date());
        const newStock = r.stock - 1;
        return {
          ...r,
          stock: newStock,
          sales: [
            { id: `s-${Date.now()}`, date: today, customerName: '顾**' },
            ...r.sales,
          ],
          trajectory: [
            {
              id: `t-${Date.now()}`,
              type: 'sale' as const,
              date: today,
              summary: '现场售出 1 张',
            },
            ...r.trajectory,
          ],
        };
      }),
    );
    setSelectedRecord((prev) => {
      if (!prev || prev.id !== recordId) return prev;
      const updated = records.find((r) => r.id === recordId);
      if (!updated) return prev;
      if (updated.stock <= 0) return { ...prev, stock: 0 };
      const today = formatDate(new Date());
      return {
        ...prev,
        stock: updated.stock - 1,
        sales: [
          { id: `s-${Date.now()}`, date: today, customerName: '顾**' },
          ...prev.sales,
        ],
        trajectory: [
          {
            id: `t-${Date.now()}`,
            type: 'sale' as const,
            date: today,
            summary: '现场售出 1 张',
          },
          ...prev.trajectory,
        ],
      };
    });
  };

  const handleAddFeedback = (
    recordId: string,
    fb: Omit<Feedback, 'id' | 'createdAt'>,
  ) => {
    const today = formatDate(new Date());
    const newFeedback: Feedback = {
      id: `f-${Date.now()}`,
      rating: fb.rating,
      comment: fb.comment,
      createdAt: today,
    };
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? { ...r, feedbacks: [newFeedback, ...r.feedbacks] }
          : r,
      ),
    );
    setSelectedRecord((prev) =>
      prev && prev.id === recordId
        ? { ...prev, feedbacks: [newFeedback, ...prev.feedbacks] }
        : prev,
    );
  };

  return (
    <>
      <header className="app-header">
        <span>🎵 独立黑胶唱片店</span>
      </header>
      <main className="main-content">
        <input
          type="text"
          className="search-bar"
          placeholder="搜索唱片名或艺人..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="record-grid">
          {filteredRecords.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              searchQuery={searchQuery}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </main>
      {selectedRecord && (
        <DetailPanel
          record={selectedRecord}
          onClose={handleClosePanel}
          onMarkSold={handleMarkSold}
          onAddFeedback={handleAddFeedback}
        />
      )}
    </>
  );
}

export default App;
