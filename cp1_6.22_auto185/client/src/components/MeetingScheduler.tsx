import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Team, TeamMember } from '../utils/types';
import { api } from '../utils/api';
import {
  formatHour,
  formatHourRange,
  utcHourToLocal,
  getUTCTodayString,
  DAY_NAMES,
  getDayOfWeek,
} from '../utils/timezoneUtils';

interface Props {
  team: Team;
  onMeetingCreated: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

interface MatrixData {
  matrix: { [hour: number]: string[] };
  members: TeamMember[];
  totalMembers: number;
}

interface Recommendation {
  startHourUTC: number;
  endHourUTC: number;
  availableMemberIds: string[];
  availableMembers: TeamMember[];
  score: number;
}

const AVATAR_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
  '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E',
];

function getAvatarInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function pickAvatarColor(name: string) {
  const idx = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function MeetingScheduler({ team, onMeetingCreated, showToast }: Props) {
  const [date, setDate] = useState(getUTCTodayString());
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ hour: number; memberIdx: number } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ startHour: number; endHour: number } | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDuration, setFormDuration] = useState<number>(60);
  const [formNotes, setFormNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [selectedHours, setSelectedHours] = useState<Set<number>>(new Set());

  const heatmapRef = useRef<HTMLDivElement>(null);
  const memberMap = useMemo(() => {
    const m: { [id: string]: TeamMember } = {};
    team.members.forEach(mb => { m[mb.id] = mb; });
    return m;
  }, [team.members]);

  const loadMatrix = useCallback(async () => {
    if (team.members.length === 0) {
      setMatrixData({ matrix: {}, members: [], totalMembers: 0 });
      return;
    }
    setLoadingMatrix(true);
    try {
      const res = await api.getAvailabilityMatrix(team.id, date);
      setMatrixData(res);
    } catch (e: any) {
      showToast(e.message || '加载热力图失败', 'error');
    } finally {
      setLoadingMatrix(false);
    }
  }, [team.id, date, team.members.length, showToast]);

  useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  const loadRecommendations = async () => {
    if (team.members.length === 0) {
      showToast('请先添加团队成员', 'error');
      return;
    }
    setLoadingRecs(true);
    try {
      const res = await api.getRecommendations(team.id, date);
      setRecommendations(res.recommendations);
      if (res.recommendations.length === 0) {
        showToast('未找到合适的会议时段', 'error');
      }
    } catch (e: any) {
      showToast(e.message || '获取推荐失败', 'error');
    } finally {
      setLoadingRecs(false);
    }
  };

  const getCellClass = (availableCount: number, totalCount: number) => {
    if (totalCount === 0) return 'gray';
    const ratio = availableCount / totalCount;
    if (ratio === 0) return 'gray';
    if (ratio === 1) return 'green';
    return 'yellow';
  };

  const getCellRatio = (availableCount: number, totalCount: number) => {
    if (totalCount === 0) return 0;
    return Math.round((availableCount / totalCount) * 100);
  };

  const handleCellMouseDown = (hour: number, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart(hour);
    setDragEnd(hour);
    setSelectedHours(new Set([hour]));
    setSelectedSlot(null);
  };

  const handleCellMouseEnter = (hour: number) => {
    if (!isDragging || dragStart === null) return;
    setDragEnd(hour);
    const min = Math.min(dragStart, hour);
    const max = Math.max(dragStart, hour);
    const s = new Set<number>();
    for (let h = min; h <= max; h++) s.add(h);
    setSelectedHours(s);
  };

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart !== null && dragEnd !== null) {
      const min = Math.min(dragStart, dragEnd);
      const max = Math.max(dragStart, dragEnd);
      if (max >= min) {
        setSelectedSlot({ startHour: min, endHour: max + 1 });
        setSelectedRec(null);
        openCreateModal(null, { startHour: min, endHour: max + 1 });
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setTimeout(() => setSelectedHours(new Set()), 300);
  }, [isDragging, dragStart, dragEnd]);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  const openCreateModal = (rec: Recommendation | null, slot?: { startHour: number; endHour: number }) => {
    setSelectedRec(rec);
    if (slot) setSelectedSlot(slot);
    setFormTitle('');
    setFormDuration(60);
    setFormNotes('');
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setSelectedRec(null);
    setSelectedSlot(null);
  };

  const handleCreateMeeting = async () => {
    if (!formTitle.trim()) {
      showToast('请输入会议标题', 'error');
      return;
    }

    let startHour: number, endHour: number;
    let participantIds: string[];

    if (selectedRec) {
      startHour = selectedRec.startHourUTC;
      endHour = selectedRec.endHourUTC;
      participantIds = selectedRec.availableMemberIds;
    } else if (selectedSlot) {
      startHour = selectedSlot.startHour;
      endHour = selectedSlot.endHour;
      if (!matrixData) { showToast('请先加载热力图', 'error'); return; }
      const availableIds = new Set<string>();
      for (let h = startHour; h < endHour; h++) {
        (matrixData.matrix[h] || []).forEach(id => availableIds.add(id));
      }
      participantIds = Array.from(availableIds);
    } else {
      showToast('请先选择时间段', 'error');
      return;
    }

    if (endHour <= startHour) {
      showToast('结束时间必须晚于开始时间', 'error');
      return;
    }

    const maxDuration = (endHour - startHour) * 60;
    const finalDuration = Math.min(formDuration, maxDuration);

    try {
      const [h, m] = formatHour(startHour).split(':').map(Number);
      const startMin = h * 60 + m;
      const endMin = startMin + finalDuration;
      const endH = Math.floor(endMin / 60) % 24;
      const endM = endMin % 60;
      const startTimeStr = formatHour(startHour);
      const endTimeStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

      await api.createMeeting({
        teamId: team.id,
        title: formTitle.trim(),
        date,
        startTimeUTC: startTimeStr,
        endTimeUTC: endTimeStr,
        durationMinutes: finalDuration,
        notes: formNotes.trim() || undefined,
        participantIds,
      });

      showToast('会议创建成功！', 'success');
      closeCreateModal();
      onMeetingCreated();

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('会议已创建', {
            body: `${formTitle}\n${date} ${startTimeStr} UTC`,
            icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y=".9em" font-size="90"%3E📅%3C/text%3E%3C/svg%3E',
          });
        } catch {}
      }
    } catch (e: any) {
      showToast(e.message || '创建会议失败', 'error');
    }
  };

  const dayOfWeek = getDayOfWeek(date);
  const hourLabels = Array.from({ length: 24 }, (_, i) => formatHour(i));

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="page-header">
          <div>
            <h3 className="section-title" style={{ marginBottom: 0 }}>
              📊 空闲时段热力图
              {DAY_NAMES[dayOfWeek] && (
                <span className="chip chip-blue" style={{ marginLeft: 12 }}>{DAY_NAMES[dayOfWeek]}</span>
              )}
            </h3>
          </div>
          <div className="date-selector">
            <label className="label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              选择日期：
              <input
                type="date"
                className="input"
                style={{ width: 180 }}
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </label>
            <button
              className="btn btn-success"
              onClick={loadRecommendations}
              disabled={loadingRecs}
            >
              {loadingRecs ? '⏳ 计算中...' : '✨ 推荐空闲时段'}
            </button>
          </div>
        </div>

        <div className="legend" style={{ marginBottom: 12 }}>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#22C55E' }} />
            <span>全部成员可用</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#FACC15' }} />
            <span>部分成员可用</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#D1D5DB' }} />
            <span>无人可用</span>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
            💡 可在下方热力图中拖拽选中时段
          </div>
        </div>

        {loadingMatrix ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <div>正在加载空闲时段...</div>
          </div>
        ) : team.members.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-text">请先在「成员管理」中添加团队成员</div>
          </div>
        ) : (
          <div className="heatmap-wrapper" onMouseLeave={() => {
            if (isDragging) {
              setIsDragging(false);
              setDragStart(null);
              setDragEnd(null);
              setSelectedHours(new Set());
            }
          }}>
            <div
              className="heatmap"
              ref={heatmapRef}
              style={{
                gridTemplateColumns: `140px repeat(24, 1fr)`,
              }}
            >
              <div className="heatmap-header-row" style={{ gridColumn: '1 / -1', gridTemplateColumns: `140px repeat(24, 1fr)` }}>
                <div className="heatmap-corner">成员 ↓ / 时间 →</div>
                {hourLabels.map((h, idx) => (
                  <div key={idx} className="heatmap-hour-label">
                    {idx % 2 === 0 ? h.slice(0, 2) : ''}
                  </div>
                ))}
              </div>

              {team.members.map((member, memberIdx) => (
                <React.Fragment key={member.id}>
                  <div className="heatmap-row" style={{ gridColumn: '1 / -1', gridTemplateColumns: `140px repeat(24, 1fr)` }}>
                    <div className="heatmap-member-label">
                      <div
                        className="avatar"
                        style={{
                          width: 28, height: 28, fontSize: 11,
                          backgroundColor: member.avatarColor || pickAvatarColor(member.name),
                        }}
                      >
                        {getAvatarInitials(member.name)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="heatmap-member-name">{member.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {member.timezone}
                        </div>
                      </div>
                    </div>

                    {Array.from({ length: 24 }, (_, hour) => {
                      const availableIds = matrixData?.matrix[hour] || [];
                      const isAvailable = availableIds.includes(member.id);
                      const isSelected = selectedHours.has(hour);
                      const inRange = selectedRec
                        ? (hour >= selectedRec.startHourUTC && hour < selectedRec.endHourUTC)
                        : selectedSlot
                        ? (hour >= selectedSlot.startHour && hour < selectedSlot.endHour)
                        : false;

                      return (
                        <div
                          key={hour}
                          className={`heatmap-cell ${isAvailable ? 'green' : 'gray'} ${isSelected || inRange ? 'selected' : ''}`}
                          onMouseDown={(e) => handleCellMouseDown(hour, e)}
                          onMouseEnter={() => handleCellMouseEnter(hour)}
                          onClick={() => {
                            if (!isDragging) {
                              setSelectedHours(new Set([hour]));
                              setSelectedSlot({ startHour: hour, endHour: hour + 1 });
                              setSelectedRec(null);
                            }
                          }}
                          title={`${member.name} · ${hour}:00-${hour + 1}:00 UTC · 当地时间 ${formatHour(utcHourToLocal(hour, member.timezone))}`}
                          onMouseOver={() => setHoveredCell({ hour, memberIdx })}
                          onMouseOut={() => setHoveredCell(null)}
                        >
                          {hoveredCell?.hour === hour && hoveredCell?.memberIdx === memberIdx && (
                            <div className="tooltip">
                              <div className="tooltip-title">
                                {formatHour(hour)} - {formatHour(hour + 1)} UTC
                              </div>
                              <div style={{ fontSize: 11, marginBottom: 4 }}>
                                {member.timezone}当地：{formatHour(utcHourToLocal(hour, member.timezone))}
                              </div>
                              <div className="tooltip-title" style={{ fontSize: 11 }}>
                                本小时可用成员 ({availableIds.length}/{team.members.length})：
                              </div>
                              <div className="tooltip-list">
                                {availableIds.length === 0 ? '无人可用' : availableIds.map(id => memberMap[id]?.name).join('、')}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </React.Fragment>
              ))}

              <div className="heatmap-row" style={{ gridColumn: '1 / -1', gridTemplateColumns: `140px repeat(24, 1fr)`, marginTop: 4, paddingTop: 8, borderTop: '1px dashed var(--border-color)' }}>
                <div className="heatmap-corner" style={{ fontSize: 11 }}>可用性汇总</div>
                {Array.from({ length: 24 }, (_, hour) => {
                  const availableCount = (matrixData?.matrix[hour] || []).length;
                  const totalCount = matrixData?.totalMembers || 0;
                  const cellClass = getCellClass(availableCount, totalCount);
                  const ratio = getCellRatio(availableCount, totalCount);
                  const inRange = selectedRec
                    ? (hour >= selectedRec.startHourUTC && hour < selectedRec.endHourUTC)
                    : selectedSlot
                    ? (hour >= selectedSlot.startHour && hour < selectedSlot.endHour)
                    : selectedHours.has(hour);

                  return (
                    <div
                      key={hour}
                      className={`heatmap-cell ${cellClass} ${inRange ? 'selected' : ''}`}
                      style={{ fontWeight: 700 }}
                    >
                      {totalCount > 0 ? `${ratio}` : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 className="section-title">
            <span>✨ 智能推荐时段 (共 {recommendations.length} 条)</span>
          </h3>
          <div className="recommendations-list">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`recommendation-item ${selectedRec === rec ? 'selected' : ''}`}
                style={{
                  borderColor: selectedRec === rec ? 'var(--accent-blue)' : undefined,
                  boxShadow: selectedRec === rec ? '0 0 0 3px rgba(59,130,246,0.15)' : undefined,
                }}
                onClick={() => {
                  setSelectedRec(rec);
                  setSelectedSlot(null);
                }}
              >
                <div className="rec-rank">{idx + 1}</div>
                <div className="rec-info">
                  <div className="rec-time">
                    {formatHourRange(rec.startHourUTC, rec.endHourUTC)} UTC
                    <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                      (时长 {rec.endHourUTC - rec.startHourUTC} 小时)
                    </span>
                  </div>
                  <div className="rec-meta">
                    <span style={{ color: rec.availableMembers.length === team.members.length ? 'var(--accent-green)' : 'var(--accent-blue)' }}>
                      👥 {rec.availableMembers.length}/{team.members.length} 人可用
                    </span>
                    <div style={{ display: 'flex', gap: 0 }}>
                      {rec.availableMembers.slice(0, 6).map(m => (
                        <div
                          key={m.id}
                          className="avatar rec-avatar"
                          style={{
                            backgroundColor: m.avatarColor || pickAvatarColor(m.name),
                          }}
                          title={m.name}
                        >
                          {getAvatarInitials(m.name)}
                        </div>
                      ))}
                      {rec.availableMembers.length > 6 && (
                        <div
                          className="avatar rec-avatar"
                          style={{ backgroundColor: 'var(--text-muted)' }}
                          title={`还有 ${rec.availableMembers.length - 6} 人`}
                        >
                          +{rec.availableMembers.length - 6}
                        </div>
                      )}
                    </div>
                    {rec.availableMembers.length < team.members.length && (
                      <span style={{ color: 'var(--text-muted)' }}>
                        缺席：{team.members.filter(m => !rec.availableMemberIds.includes(m.id)).map(m => m.name).join('、')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-primary rec-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCreateModal(rec);
                  }}
                >
                  立即预约
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={closeCreateModal}
        >
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📅 创建会议</div>
              <button className="modal-close" onClick={closeCreateModal}>✕</button>
            </div>
            <div className="modal-body">
              {(selectedRec || selectedSlot) && (
                <div
                  className="card"
                  style={{ marginBottom: 20, background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.3)' }}
                >
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>已选时段</div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                    {date} · {formatHour(selectedRec?.startHourUTC ?? selectedSlot?.startHour ?? 0)} - {formatHour(selectedRec?.endHourUTC ?? selectedSlot?.endHour ?? 0)} UTC
                  </div>
                  {selectedRec && (
                    <div style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 500 }}>
                      ✅ {selectedRec.availableMembers.length}/{team.members.length} 名成员可参加
                    </div>
                  )}
                </div>
              )}

              <div className="form-row">
                <label className="label">会议标题 *</label>
                <input
                  className="input"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="例如：周会、产品评审、技术同步..."
                />
              </div>

              <div className="form-row">
                <label className="label">会议时长</label>
                <div className="duration-btns">
                  {[15, 30, 45, 60].map(d => (
                    <button
                      key={d}
                      className={`duration-btn ${formDuration === d ? 'active' : ''}`}
                      onClick={() => setFormDuration(d)}
                      disabled={
                        (selectedRec ? (selectedRec.endHourUTC - selectedRec.startHourUTC) * 60 :
                          selectedSlot ? (selectedSlot.endHour - selectedSlot.startHour) * 60 : 60) < d
                      }
                    >
                      {d} 分钟
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <label className="label">备注（可选）</label>
                <textarea
                  className="textarea"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="会议议程、链接、准备事项等"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeCreateModal}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCreateMeeting}>
                ✓ 创建会议
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
