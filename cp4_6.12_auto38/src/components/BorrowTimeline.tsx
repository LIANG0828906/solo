import { useEffect, useRef } from 'react';
import { BorrowRecord, Member } from '../types';

interface BorrowTimelineProps {
  records: BorrowRecord[];
  members: Member[];
}

function BorrowTimeline({ records, members }: BorrowTimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lastRecordId = records[records.length - 1]?.id;

  useEffect(() => {
    if (trackRef.current && lastRecordId) {
      const scrollContainer = trackRef.current.parentElement;
      if (scrollContainer) {
        scrollContainer.scrollTo({
          left: scrollContainer.scrollWidth,
          behavior: 'smooth'
        });
      }
    }
  }, [lastRecordId]);

  const getMember = (id: string) => members.find((m) => m.id === id);

  const sortedRecords = [...records].sort((a, b) => {
    const dateA = new Date(a.borrowDate);
    const dateB = new Date(b.borrowDate);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="borrow-timeline">
      <div className="timeline-track" ref={trackRef}>
        {sortedRecords.map((record, index) => {
          const fromMember = getMember(record.fromMemberId);
          const toMember = getMember(record.toMemberId);
          const isNew = index === sortedRecords.length - 1;

          return (
            <div
              key={record.id}
              className="timeline-item"
              style={isNew ? undefined : { animation: 'fadeIn 0.3s ease' }}
            >
              <div className={`timeline-node ${record.type}`}>
                {record.type === 'borrow' ? '↑' : '↓'}
              </div>
              <div className="timeline-card">
                <div className="timeline-date">{record.borrowDate}</div>
                <div className={`timeline-type ${record.type}`}>
                  {record.type === 'borrow' ? '借出' : '归还'}
                </div>
                {record.type === 'borrow' ? (
                  <>
                    {fromMember && (
                      <div className="timeline-person">
                        <img
                          src={fromMember.avatar}
                          alt={fromMember.name}
                          className="timeline-avatar"
                        />
                        <span>来自：{fromMember.name}</span>
                      </div>
                    )}
                    {toMember && (
                      <div className="timeline-person">
                        <img
                          src={toMember.avatar}
                          alt={toMember.name}
                          className="timeline-avatar"
                        />
                        <span>借给：{toMember.name}</span>
                      </div>
                    )}
                  </>
                ) : (
                  toMember && (
                    <div className="timeline-person">
                      <img
                        src={toMember.avatar}
                        alt={toMember.name}
                        className="timeline-avatar"
                      />
                      <span>归还人：{toMember.name}</span>
                    </div>
                  )
                )}
                {record.note && (
                  <div className="timeline-note">{record.note}</div>
                )}
              </div>
            </div>
          );
        })}
        {sortedRecords.length === 0 && (
          <div style={{ color: '#999', padding: '20px' }}>暂无借阅记录</div>
        )}
      </div>
    </div>
  );
}

export default BorrowTimeline;
