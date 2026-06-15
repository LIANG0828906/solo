import { useState, useMemo, useRef, useEffect } from 'react';
import { Heart, Users } from 'lucide-react';
import { Schedule, Band } from '../types';
import { useStore } from '../store/useStore';
import { formatTime, formatDate, getTimePosition, getTimeRangeWidth } from '../utils/time';
import './LineupTimeline.css';

interface LineupTimelineProps {
  schedules: Schedule[];
  bands: Band[];
}

const STAGES = ['主舞台', '副舞台', '电音舞台'];
const DAY_START_HOUR = 12;
const DAY_END_HOUR = 24;

const genreColors: Record<string, string> = {
  '摇滚': '#6c63ff',
  '独立': '#f9a826',
  '电子': '#10b981',
  '后摇': '#8b5cf6',
  '器乐': '#ec4899',
  '流行': '#06b6d4',
  '合成器': '#f43f5e',
  '民谣': '#84cc16',
  '氛围': '#6366f1',
  '实验': '#f97316',
};

function getGenreColor(genres: string[]): string {
  if (genres.length === 0) return '#6c63ff';
  return genreColors[genres[0]] || '#6c63ff';
}

export default function LineupTimeline({ schedules, bands }: LineupTimelineProps) {
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [hoveredSchedule, setHoveredSchedule] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(800);

  const { favorites, toggleFavorite, isFavorite } = useStore();

  const days = useMemo(() => {
    const daySet = new Set<string>();
    schedules.forEach(s => {
      const date = new Date(s.startTime);
      date.setHours(0, 0, 0, 0);
      daySet.add(date.toISOString());
    });
    return Array.from(daySet).sort();
  }, [schedules]);

  useEffect(() => {
    if (days.length > 0 && !selectedDay) {
      setSelectedDay(days[0]);
    }
  }, [days, selectedDay]);

  useEffect(() => {
    const updateWidth = () => {
      if (timelineRef.current) {
        setTimelineWidth(timelineRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const scheduleDay = new Date(s.startTime);
      scheduleDay.setHours(0, 0, 0, 0);
      const dayMatch = scheduleDay.toISOString() === selectedDay;
      const stageMatch = selectedStage === 'all' || s.stage === selectedStage;
      return dayMatch && stageMatch;
    });
  }, [schedules, selectedDay, selectedStage]);

  const displayStages = useMemo(() => {
    if (selectedStage !== 'all') {
      return [selectedStage];
    }
    const stageSet = new Set<string>();
    filteredSchedules.forEach(s => stageSet.add(s.stage));
    return STAGES.filter(s => stageSet.has(s));
  }, [selectedStage, filteredSchedules]);

  const getDayStart = (day: string) => {
    const date = new Date(day);
    date.setHours(DAY_START_HOUR, 0, 0, 0);
    return date.toISOString();
  };

  const getDayEnd = (day: string) => {
    const date = new Date(day);
    date.setHours(DAY_END_HOUR, 0, 0, 0);
    return date.toISOString();
  };

  const timeMarkers = useMemo(() => {
    const markers = [];
    for (let h = DAY_START_HOUR; h <= DAY_END_HOUR; h += 2) {
      markers.push(`${String(h).padStart(2, '0')}:00`);
    }
    return markers;
  }, []);

  const handleMouseEnter = (scheduleId: string, e: React.MouseEvent) => {
    setHoveredSchedule(scheduleId);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredSchedule(null);
  };

  const hoveredScheduleData = schedules.find(s => s.id === hoveredSchedule);
  const hoveredBand = bands.find(b => b.id === hoveredScheduleData?.bandId);

  return (
    <div className="lineup-timeline">
      <div className="timeline-header">
        <h2 className="timeline-title">演出日程</h2>
        <div className="timeline-filters">
          <div className="filter-group">
            <label>日期</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="filter-select"
            >
              {days.map(day => (
                <option key={day} value={day}>{formatDate(day)}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>舞台</label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="filter-select"
            >
              <option value="all">全部舞台</option>
              {STAGES.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedDay && (
        <div className="timeline-container" ref={timelineRef}>
          <div className="timeline-grid">
            <div className="timeline-time-axis">
              <div className="time-axis-spacer"></div>
              {timeMarkers.map(time => (
                <div key={time} className="time-marker">{time}</div>
              ))}
            </div>

            {displayStages.map((stage, stageIndex) => (
              <div key={stage} className="timeline-row">
                <div className="stage-label">
                  <span>{stage}</span>
                </div>
                <div className="stage-timeline">
                  <div className="timeline-grid-lines">
                    {timeMarkers.map((_, i) => (
                      <div key={i} className="grid-line"></div>
                    ))}
                  </div>
                  {filteredSchedules
                    .filter(s => s.stage === stage)
                    .map((schedule) => {
                      const dayStart = getDayStart(selectedDay);
                      const dayEnd = getDayEnd(selectedDay);
                      const left = getTimePosition(schedule.startTime, dayStart, dayEnd, 100);
                      const width = getTimeRangeWidth(schedule.startTime, schedule.endTime, dayStart, dayEnd, 100);
                      const color = getGenreColor(schedule.genres);
                      const favorited = isFavorite(schedule.bandId);

                      return (
                        <div
                          key={schedule.id}
                          className="schedule-block fade-in"
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            background: `linear-gradient(135deg, ${color}, ${color}99)`,
                            animationDelay: `${stageIndex * 0.05}s`
                          }}
                          onMouseEnter={(e) => handleMouseEnter(schedule.id, e)}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div className="schedule-info">
                            <span className="schedule-band">{schedule.bandName}</span>
                            <span className="schedule-time">
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </span>
                          </div>
                          <button
                            className={`favorite-btn ${favorited ? 'favorited' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(schedule.bandId);
                            }}
                          >
                            <Heart size={14} fill={favorited ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hoveredScheduleData && hoveredBand && (
        <div
          className="schedule-tooltip"
          style={{
            left: tooltipPos.x + 15,
            top: tooltipPos.y + 15
          }}
        >
          <div className="tooltip-header">
            <h4>{hoveredScheduleData.bandName}</h4>
            <button
              className={`favorite-btn ${isFavorite(hoveredScheduleData.bandId) ? 'favorited' : ''}`}
              onClick={() => toggleFavorite(hoveredScheduleData.bandId)}
            >
              <Heart size={16} fill={isFavorite(hoveredScheduleData.bandId) ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div className="tooltip-genres">
            {hoveredScheduleData.genres.map(g => (
              <span key={g} className="genre-tag" style={{ background: getGenreColor([g]) }}>{g}</span>
            ))}
          </div>
          <p className="tooltip-desc">{hoveredBand.description}</p>
          <div className="tooltip-meta">
            <span><Users size={14} /> {hoveredBand.memberCount}人</span>
            <span>{formatTime(hoveredScheduleData.startTime)} - {formatTime(hoveredScheduleData.endTime)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
