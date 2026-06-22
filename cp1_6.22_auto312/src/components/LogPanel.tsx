import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EventType, FertilizerType, GrowthRecord, Plant } from '../types';
import {
  addRecord,
  canWater,
  getCurrentHeight,
  getCurrentLeaves,
  getRecords,
} from '../growthLogger';
import styles from './LogPanel.module.css';

interface LogPanelProps {
  plant: Plant;
  onRecordAdded: () => void;
}

const eventTypeColors: Record<EventType, string> = {
  浇水: styles.dotWater,
  施肥: styles.dotFertilize,
  修剪: styles.dotPrune,
  换盆: styles.dotRepot,
};

const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
};

const LogPanel: React.FC<LogPanelProps> = function LogPanel({ plant, onRecordAdded }) {
  const [records, setRecords] = useState<GrowthRecord[]>(() => getRecords(plant.id));
  const [eventType, setEventType] = useState<EventType>('浇水');
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [height, setHeight] = useState<string>(() => String(getCurrentHeight(plant.id)));
  const [leaves, setLeaves] = useState<string>(() => String(getCurrentLeaves(plant.id)));
  const [fertilizerType, setFertilizerType] = useState<FertilizerType>('普通');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecords(getRecords(plant.id));
  }, [plant.id]);

  const currentHeight = useMemo(() => getCurrentHeight(plant.id), [plant.id, records]);
  const currentLeaves = useMemo(() => getCurrentLeaves(plant.id), [plant.id, records]);

  useEffect(() => {
    setHeight(String(currentHeight));
    setLeaves(String(currentLeaves));
  }, [currentHeight, currentLeaves]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (eventType === '浇水' && !canWater(plant.id)) {
        setError('请稍后再浇水');
        return;
      }

      const recordData = {
        eventType,
        timestamp: new Date(date).toISOString(),
        height: eventType !== '施肥' && eventType !== '换盆' ? Number(height) || undefined : undefined,
        leaves: eventType !== '施肥' && eventType !== '换盆' ? Number(leaves) || undefined : undefined,
        fertilizerType: eventType === '施肥' ? fertilizerType : undefined,
        note: note || undefined,
      };

      const newRecord = addRecord(plant.id, recordData);
      if (newRecord) {
        setRecords(getRecords(plant.id));
        setNote('');
        onRecordAdded();

        setTimeout(() => {
          if (timelineRef.current) {
            timelineRef.current.scrollTo({
              top: 0,
              behavior: 'smooth',
            });
          }
        }, 100);
      }
    },
    [plant.id, eventType, date, height, leaves, fertilizerType, note, onRecordAdded]
  );

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>生长日志</h3>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>日期时间</label>
          <input
            type="datetime-local"
            className={styles.input}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>事件类型</label>
          <select
            className={styles.select}
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventType)}
          >
            <option value="浇水">💧 浇水</option>
            <option value="施肥">🌱 施肥</option>
            <option value="修剪">✂️ 修剪</option>
            <option value="换盆">🪴 换盆</option>
          </select>
        </div>

        {eventType === '施肥' && (
          <div className={styles.formGroup}>
            <label className={styles.label}>肥料类型</label>
            <select
              className={styles.select}
              value={fertilizerType}
              onChange={(e) => setFertilizerType(e.target.value as FertilizerType)}
            >
              <option value="普通">普通肥料</option>
              <option value="促花">促花肥料</option>
              <option value="促根">促根肥料</option>
            </select>
          </div>
        )}

        {(eventType === '浇水' || eventType === '修剪') && (
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>当前高度 (cm)</label>
              <input
                type="number"
                className={styles.input}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                min="0"
                max="500"
                step="0.1"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>叶片数量</label>
              <input
                type="number"
                className={styles.input}
                value={leaves}
                onChange={(e) => setLeaves(e.target.value)}
                min="0"
                max="100"
                step="1"
              />
            </div>
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label">备注</label>
          <textarea
            className={styles.textarea}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="记录观察到的现象..."
          />
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <button type="submit" className={styles.submitBtn}>
          添加记录
        </button>
      </form>

      <div className={styles.timeline} ref={timelineRef}>
        {records.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <p>暂无生长记录，添加第一条记录吧！</p>
          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} className={styles.timelineItem}>
              <div className={`${styles.timelineDot} ${eventTypeColors[record.eventType]}`}>
                <span className={styles.tooltip}>
                  {record.note || '点击查看详情'}
                </span>
              </div>
              <div className={styles.eventHeader}>
                <span className={styles.eventType}>
                  {record.eventType === '施肥' && record.fertilizerType && (
                    <span className={styles.fertilizerBadge}>{record.fertilizerType}</span>
                  )}
                  {record.eventType}
                </span>
                <span className={styles.eventTime}>{formatDateTime(record.timestamp)}</span>
              </div>
              <div className={styles.eventDetails}>
                {record.height !== undefined && <p>高度：{record.height} cm</p>}
                {record.leaves !== undefined && <p>叶片：{record.leaves} 片</p>}
                {record.note && <p>备注：{record.note}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogPanel;
