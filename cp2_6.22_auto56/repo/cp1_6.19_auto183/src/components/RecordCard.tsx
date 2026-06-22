import type { VinylRecord } from '../data/records';

interface RecordCardProps {
  record: VinylRecord;
  searchQuery: string;
  onCardClick: (record: VinylRecord) => void;
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="highlight">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function RecordCard({ record, searchQuery, onCardClick }: RecordCardProps) {
  const isSoldOut = record.stock <= 0;
  const isLowStock = record.stock <= 1 && record.stock > 0;

  const handleClick = () => {
    if (!isSoldOut) {
      onCardClick(record);
    }
  };

  return (
    <div
      className={`record-card ${isSoldOut ? 'sold-out' : ''}`}
      onClick={handleClick}
      role={isSoldOut ? undefined : 'button'}
      tabIndex={isSoldOut ? -1 : 0}
      onKeyDown={(e) => {
        if (!isSoldOut && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onCardClick(record);
        }
      }}
    >
      <div className="record-cover" />
      <div className="record-title">{highlightText(record.title, searchQuery)}</div>
      <div className="record-artist">{highlightText(record.artist, searchQuery)}</div>
      <div className="record-info-row">
        <span className="record-price">¥{record.price}</span>
        {!isSoldOut && (
          <span className={`record-stock ${isLowStock ? 'low' : ''}`}>
            库存 {record.stock}
          </span>
        )}
      </div>
      {isSoldOut && <div className="sold-out-badge">已售罄</div>}
    </div>
  );
}
