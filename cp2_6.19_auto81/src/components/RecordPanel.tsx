import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Scatter, Line } from 'react-chartjs-2';
import { v4 as uuidv4 } from 'uuid';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  subWeeks,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Pet, PetRecord, RecordType, WeeklyReport } from '../types';
import {
  RECORD_TYPE_LABELS,
  RECORD_TYPE_ICONS,
  RECORD_TYPE_COLORS,
} from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RecordPanelProps {
  pet: Pet;
  records: PetRecord[];
  allRecords: PetRecord[];
  onAddRecord: (record: PetRecord) => void;
  onBack: () => void;
}

type FilterType = RecordType | 'all';

function getWeekRange(date: Date) {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  const sunday = endOfWeek(date, { weekStartsOn: 1 });
  return { start: monday, end: sunday };
}

function countRecordsByType(records: PetRecord[], start: Date, end: Date): { [key in RecordType]: number } {
  const counts: { [key in RecordType]: number } = {
    food: 0,
    water: 0,
    walk: 0,
    health: 0,
  };
  
  records.forEach(record => {
    const recordDate = parseISO(record.timestamp);
    if (isWithinInterval(recordDate, { start, end })) {
      counts[record.type]++;
    }
  });
  
  return counts;
}

function generateWeeklyReport(pet: Pet, records: PetRecord[]): WeeklyReport {
  const now = new Date();
  const thisWeek = getWeekRange(now);
  const lastWeek = getWeekRange(subWeeks(now, 1));
  
  const currentStats = countRecordsByType(records, thisWeek.start, thisWeek.end);
  const previousStats = countRecordsByType(records, lastWeek.start, lastWeek.end);
  
  const summaryParts: string[] = [];
  const warnings: string[] = [];
  
  if (currentStats.walk < 2) {
    warnings.push(`本周遛弯次数仅 ${currentStats.walk} 次，建议增加运动频率，保持每日至少1次户外活动。`);
  }
  
  const healthRecords = records.filter(r => 
    r.type === 'health' && 
    isWithinInterval(parseISO(r.timestamp), { start: thisWeek.start, end: thisWeek.end })
  );
  
  const abnormalNotes = healthRecords.filter(r => 
    r.note.includes('异常') || 
    r.note.includes('不舒服') || 
    r.note.includes('生病') ||
    r.note.includes('呕吐') ||
    r.note.includes('腹泻') ||
    r.note.includes('发烧')
  );
  
  if (abnormalNotes.length > 0) {
    warnings.push(`本周记录了 ${abnormalNotes.length} 条健康异常：${abnormalNotes.map(r => r.note).join('；')}。建议密切关注宠物状态，必要时就医。`);
  }
  
  if (currentStats.food >= 7) {
    summaryParts.push(`本周喂食规律，共 ${currentStats.food} 次，继续保持！`);
  } else if (currentStats.food > 0) {
    summaryParts.push(`本周喂食 ${currentStats.food} 次，建议保持每日定时定量。`);
  }
  
  if (currentStats.water >= 5) {
    summaryParts.push(`补水充足，共 ${currentStats.water} 次喂水记录。`);
  }
  
  if (currentStats.walk >= 2) {
    summaryParts.push(`运动达标，本周遛弯 ${currentStats.walk} 次。`);
  }
  
  if (currentStats.health > 0 && abnormalNotes.length === 0) {
    summaryParts.push(`健康记录良好，继续保持关注。`);
  }
  
  let summary = '';
  if (warnings.length > 0) {
    summary += `<span class="warning">⚠️ 注意：${warnings.join(' ')}</span><br/><br/>`;
  }
  if (summaryParts.length > 0) {
    summary += summaryParts.join(' ');
  } else {
    summary += '本周记录较少，建议多记录宠物的日常活动。';
  }
  
  return {
    petId: pet.id,
    weekStart: thisWeek.start.toISOString(),
    weekEnd: thisWeek.end.toISOString(),
    stats: currentStats,
    comparison: {
      current: currentStats,
      previous: previousStats,
    },
    summary,
  };
}

export default function RecordPanel({
  pet,
  records,
  allRecords,
  onAddRecord,
}: RecordPanelProps) {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecordType, setNewRecordType] = useState<RecordType>('food');
  const [newRecordNote, setNewRecordNote] = useState('');
  const [newRecordTime, setNewRecordTime] = useState('');
  const [highlightedRecordId, setHighlightedRecordId] = useState<string | null>(null);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [expandingRecordId, setExpandingRecordId] = useState<string | null>(null);
  const chartRef = useRef<ChartJS<'scatter'>>(null);

  useEffect(() => {
    if (showAddForm) {
      const now = new Date();
      const localDateTime = now.toISOString().slice(0, 16);
      setNewRecordTime(localDateTime);
    }
  }, [showAddForm]);

  const filteredRecords = useMemo(() => {
    let result = [...records];
    if (filterType !== 'all') {
      result = result.filter(r => r.type === filterType);
    }
    return result.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [records, filterType]);

  const groupedRecords = useMemo(() => {
    const groups: { [key: string]: PetRecord[] } = {};
    filteredRecords.forEach(record => {
      const dateKey = format(parseISO(record.timestamp), 'yyyy年MM月dd日 EEEE', { locale: zhCN });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(record);
    });
    return groups;
  }, [filteredRecords]);

  const handleAddRecord = useCallback(() => {
    if (!newRecordTime) return;

    const timestamp = new Date(newRecordTime).toISOString();
    const newRecord: PetRecord = {
      id: uuidv4(),
      petId: pet.id,
      type: newRecordType,
      note: newRecordNote.trim(),
      timestamp,
      createdAt: new Date().toISOString(),
    };

    onAddRecord(newRecord);
    setExpandingRecordId(newRecord.id);
    setShowAddForm(false);
    setNewRecordNote('');
    setNewRecordType('food');

    setTimeout(() => setExpandingRecordId(null), 300);
  }, [newRecordType, newRecordNote, newRecordTime, pet.id, onAddRecord]);

  const handleRecordClick = useCallback((recordId: string) => {
    setHighlightedRecordId(recordId);
    
    if (chartRef.current) {
      const chart = chartRef.current;
      const record = records.find(r => r.id === recordId);
      if (record) {
        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const pointBackgroundColor = dataset.pointBackgroundColor as string[];
          if (pointBackgroundColor) {
            chart.data.datasets[datasetIndex].pointBackgroundColor = pointBackgroundColor.map((color, index) => {
              const dataPoint = dataset.data[index] as { x: number; y: number; recordId: string };
              if (dataPoint && dataPoint.recordId === recordId) {
                return RECORD_TYPE_COLORS[record.type];
              }
              return color;
            });
            chart.data.datasets[datasetIndex].pointRadius = pointBackgroundColor.map((_, index) => {
              const dataPoint = dataset.data[index] as { x: number; y: number; recordId: string };
              if (dataPoint && dataPoint.recordId === recordId) {
                return 12;
              }
              return 6;
            });
          }
        });
        chart.update('active');
      }
    }
    
    setTimeout(() => setHighlightedRecordId(null), 3000);
  }, [records]);

  const chartData = useMemo(() => {
    const typeColors = RECORD_TYPE_COLORS;
    const types: RecordType[] = ['food', 'water', 'walk', 'health'];
    
    const datasets = types.map(type => {
      const typeRecords = filterType === 'all' || filterType === type
        ? filteredRecords.filter(r => r.type === type)
        : [];
      
      const data = typeRecords.map(record => {
        const date = parseISO(record.timestamp);
        const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1;
        const minutes = date.getHours() * 60 + date.getMinutes();
        return {
          x: dayOfWeek,
          y: minutes,
          recordId: record.id,
          note: record.note,
          date: record.timestamp,
        };
      });
      
      return {
        label: RECORD_TYPE_LABELS[type],
        data,
        backgroundColor: typeColors[type],
        pointBackgroundColor: typeColors[type],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 10,
      };
    });
    
    return { datasets };
  }, [filteredRecords, filterType]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 500,
      easing: 'easeOutQuart' as const,
    },
    scales: {
      x: {
        type: 'linear' as const,
        min: -0.5,
        max: 6.5,
        ticks: {
          stepSize: 1,
          callback: (value: string | number) => {
            const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            return days[value as number];
          },
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          },
          color: '#666',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.08)',
        },
      },
      y: {
        min: 0,
        max: 24 * 60,
        ticks: {
          stepSize: 3 * 60,
          callback: (value: string | number) => {
            const minutes = value as number;
            const hours = Math.floor(minutes / 60);
            return `${hours.toString().padStart(2, '0')}:00`;
          },
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          },
          color: '#666',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.08)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            size: 12,
          },
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)' as unknown as undefined,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        titleColor: '#333',
        bodyColor: '#666',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          family: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          size: 13,
        },
        bodyFont: {
          family: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          size: 12,
        },
        callbacks: {
          title: (items: unknown[]) => {
            const item = items[0] as { dataIndex: number; dataset: { data: unknown[] } };
            if (item && item.dataset.data[item.dataIndex]) {
              const dataPoint = item.dataset.data[item.dataIndex] as { date: string };
              return format(parseISO(dataPoint.date), 'yyyy-MM-dd HH:mm');
            }
            return '';
          },
          label: (item: unknown) => {
            const chartItem = item as { dataset: { label: string }; dataIndex: number; datasetIndex: number; chart: { data: { datasets: { data: unknown[] }[] } } };
            const dataPoint = chartItem.chart.data.datasets[chartItem.datasetIndex].data[chartItem.dataIndex] as { note: string };
            const note = dataPoint.note ? ` - ${dataPoint.note}` : '';
            return `${chartItem.dataset.label}${note}`;
          },
        },
      },
    },
    onClick: (_event: unknown, elements: { datasetIndex: number; index: number }[]) => {
      if (elements.length > 0) {
        const element = elements[0];
        const dataset = chartData.datasets[element.datasetIndex];
        const dataPoint = dataset.data[element.index] as { recordId: string };
        if (dataPoint && dataPoint.recordId) {
          handleRecordClick(dataPoint.recordId);
        }
      }
    },
  } as const), [chartData, handleRecordClick]);

  const weeklyReport = useMemo(() => {
    return generateWeeklyReport(pet, allRecords.filter(r => r.petId === pet.id));
  }, [pet, allRecords]);

  const weeklyChartData = useMemo(() => {
    const types: RecordType[] = ['food', 'water', 'walk', 'health'];
    const weekDays = eachDayOfInterval({
      start: parseISO(weeklyReport.weekStart),
      end: parseISO(weeklyReport.weekEnd),
    });
    
    const labels = weekDays.map(day => format(day, 'MM/dd', { locale: zhCN }));
    
    const currentDatasets = types.map(type => ({
      label: `本周${RECORD_TYPE_LABELS[type]}`,
      data: weekDays.map(day => {
        const dayRecords = allRecords.filter(r => 
          r.petId === pet.id && 
          r.type === type && 
          isSameDay(parseISO(r.timestamp), day)
        );
        return dayRecords.length;
      }),
      borderColor: RECORD_TYPE_COLORS[type],
      backgroundColor: `${RECORD_TYPE_COLORS[type]}20`,
      tension: 0.3,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6,
    }));
    
    const lastWeekDays = eachDayOfInterval({
      start: subWeeks(parseISO(weeklyReport.weekStart), 1),
      end: subWeeks(parseISO(weeklyReport.weekEnd), 1),
    });
    
    const previousDatasets = types.map(type => ({
      label: `上周${RECORD_TYPE_LABELS[type]}`,
      data: lastWeekDays.map(day => {
        const dayRecords = allRecords.filter(r => 
          r.petId === pet.id && 
          r.type === type && 
          isSameDay(parseISO(r.timestamp), day)
        );
        return dayRecords.length;
      }),
      borderColor: `${RECORD_TYPE_COLORS[type]}80`,
      backgroundColor: 'transparent',
      borderDash: [5, 5],
      tension: 0.3,
      fill: false,
      pointRadius: 3,
      pointHoverRadius: 5,
    }));
    
    return {
      labels,
      datasets: [...currentDatasets, ...previousDatasets],
    };
  }, [weeklyReport, allRecords, pet.id]);

  const weeklyChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 500,
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.08)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            size: 11,
          },
          usePointStyle: true,
          padding: 8,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        titleColor: '#333',
        bodyColor: '#666',
        padding: 10,
        cornerRadius: 8,
      },
    },
  }), []);

  const getStatChange = (current: number, previous: number) => {
    const diff = current - previous;
    if (diff > 0) return { text: `+${diff}`, class: 'up' };
    if (diff < 0) return { text: `${diff}`, class: 'down' };
    return { text: '持平', class: '' };
  };

  return (
    <>
      <div className="record-panel-header">
        <div className="record-panel-title">
          <div
            className="pet-avatar"
            style={{ backgroundColor: pet.avatarColor, width: 48, height: 48, fontSize: 20 }}
          >
            {pet.name.charAt(0).toUpperCase()}
          </div>
          <h2>{pet.name} 的记录</h2>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => setShowWeeklyReport(true)}
        >
          📊 查看周报
        </button>
      </div>

      <div className="record-panel">
        <div className="timeline-section">
          <div className="section-header">
            <h3 className="section-title" style={{ marginBottom: 0 }}>记录时间线</h3>
            <div className="filter-tabs">
              <button
                className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                全部
              </button>
              {(['food', 'water', 'walk', 'health'] as RecordType[]).map(type => (
                <button
                  key={type}
                  className={`filter-tab ${filterType === type ? 'active' : ''}`}
                  onClick={() => setFilterType(type)}
                >
                  {RECORD_TYPE_ICONS[type]} {RECORD_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div className="timeline-list">
            {filteredRecords.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <p>暂无记录</p>
                <p style={{ fontSize: 13, marginTop: 8 }}>点击下方按钮添加第一条记录</p>
              </div>
            ) : (
              Object.entries(groupedRecords).map(([date, dateRecords]) => (
                <div key={date} className="timeline-date-group">
                  <div className="timeline-date">{date}</div>
                  {dateRecords.map(record => (
                    <div
                      key={record.id}
                      className={`timeline-item ${
                        highlightedRecordId === record.id ? 'highlighted' : ''
                      } ${expandingRecordId === record.id ? 'expanding' : ''}`}
                      onClick={() => handleRecordClick(record.id)}
                    >
                      <div
                        className="timeline-icon"
                        style={{
                          backgroundColor: `${RECORD_TYPE_COLORS[record.type]}20`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = `${RECORD_TYPE_COLORS[record.type]}40`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = `${RECORD_TYPE_COLORS[record.type]}20`;
                        }}
                      >
                        {RECORD_TYPE_ICONS[record.type]}
                      </div>
                      <div className="timeline-content">
                        <div
                          className="timeline-type"
                          style={{ color: RECORD_TYPE_COLORS[record.type] }}
                        >
                          {RECORD_TYPE_LABELS[record.type]}
                        </div>
                        <div className="timeline-time">
                          {format(parseISO(record.timestamp), 'HH:mm')}
                        </div>
                        {record.note && (
                          <div className="timeline-note">{record.note}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {!showAddForm ? (
            <button
              className="add-record-btn"
              onClick={() => setShowAddForm(true)}
            >
              + 添加新记录
            </button>
          ) : (
            <div className="add-record-form">
              <div className="form-group">
                <label>记录类型</label>
                <div className="filter-tabs" style={{ marginBottom: 0 }}>
                  {(['food', 'water', 'walk', 'health'] as RecordType[]).map(type => (
                    <button
                      key={type}
                      className={`filter-tab ${newRecordType === type ? 'active' : ''}`}
                      onClick={() => setNewRecordType(type)}
                      style={{
                        borderColor: newRecordType === type ? RECORD_TYPE_COLORS[type] : undefined,
                        backgroundColor: newRecordType === type ? RECORD_TYPE_COLORS[type] : undefined,
                      }}
                    >
                      {RECORD_TYPE_ICONS[type]} {RECORD_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="record-note">备注（可选）</label>
                <input
                  id="record-note"
                  type="text"
                  value={newRecordNote}
                  onChange={(e) => setNewRecordNote(e.target.value)}
                  placeholder="例如：吃了100g狗粮、精神状态良好..."
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="record-time">时间</label>
                <input
                  id="record-time"
                  type="datetime-local"
                  value={newRecordTime}
                  onChange={(e) => setNewRecordTime(e.target.value)}
                />
              </div>
              
              <div className="form-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  取消
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddRecord}
                  disabled={!newRecordTime}
                >
                  保存记录
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="chart-section">
          <div className="section-header">
            <h3 className="section-title" style={{ marginBottom: 0 }}>本周趋势</h3>
          </div>
          
          <div className="chart-container">
            {filteredRecords.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📈</div>
                <p>暂无数据</p>
                <p style={{ fontSize: 13, marginTop: 8 }}>添加记录后这里将显示趋势图表</p>
              </div>
            ) : (
              <Scatter
                ref={chartRef}
                data={chartData}
                options={chartOptions}
              />
            )}
          </div>
        </div>
      </div>

      {showWeeklyReport && (
        <div className="modal-overlay" onClick={() => setShowWeeklyReport(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {pet.name} 的周报
                <span style={{ fontSize: 14, color: '#999', fontWeight: 400, marginLeft: 8 }}>
                  {format(parseISO(weeklyReport.weekStart), 'MM月dd日')} - {format(parseISO(weeklyReport.weekEnd), 'MM月dd日')}
                </span>
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowWeeklyReport(false)}
              >
                ×
              </button>
            </div>

            <div className="weekly-report-stats">
              {(['food', 'water', 'walk', 'health'] as RecordType[]).map(type => {
                const current = weeklyReport.comparison.current[type];
                const previous = weeklyReport.comparison.previous[type];
                const change = getStatChange(current, previous);
                return (
                  <div key={type} className="stat-card">
                    <div className="stat-icon">{RECORD_TYPE_ICONS[type]}</div>
                    <div className="stat-value">{current}</div>
                    <div className="stat-label">{RECORD_TYPE_LABELS[type]}</div>
                    <div className={`stat-change ${change.class}`}>
                      {change.text}（较上周）
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="report-chart-container">
              <Line data={weeklyChartData} options={weeklyChartOptions} />
            </div>

            <div className="report-summary">
              <h3>💡 健康建议</h3>
              <p dangerouslySetInnerHTML={{ __html: weeklyReport.summary }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
