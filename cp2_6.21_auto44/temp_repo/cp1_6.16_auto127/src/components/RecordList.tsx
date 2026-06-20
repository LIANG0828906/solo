import React from 'react';
import { useTeaStore, TeaRecord } from '../store/teaStore';

const RecordList: React.FC = () => {
  const { records, loadRecord } = useTeaStore();

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}'${secs > 0 ? secs + '"' : ''}`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`mini-star ${i <= rating ? 'active' : ''}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="record-list">
      <h3 className="record-title">冲泡记录</h3>

      {records.length === 0 ? (
        <div className="empty-record">
          <p>暂无冲泡记录</p>
          <p className="hint">调整参数后点击保存即可记录</p>
        </div>
      ) : (
        <div className="record-items">
          {records.map((record: TeaRecord) => (
            <div
              key={record.id}
              className="record-item"
              onClick={() => loadRecord(record)}
            >
              <div className="record-thumbnail">
                <img src={record.thumbnail} alt={`${record.teaName}风味雷达图`} />
              </div>
              <div className="record-info">
                <div className="record-header">
                  <span
                    className="record-tea-color"
                    style={{ backgroundColor: record.teaColor }}
                  ></span>
                  <span className="record-tea-name">{record.teaName}</span>
                </div>
                <div className="record-params">
                  <span>{record.temperature}℃</span>
                  <span className="separator">·</span>
                  <span>{formatTime(record.brewTime)}</span>
                </div>
                <div className="record-rating">
                  {renderStars(record.rating)}
                </div>
                <div className="record-date">
                  {formatDate(record.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecordList;
