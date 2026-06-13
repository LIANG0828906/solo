import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../App';
import { Teacher, Course, TimeSlot, Booking } from '../types';

const COURSE_TYPES = ['全部', '钢琴', '吉他', '声乐'] as const;
const DAYS = ['一', '二', '三', '四', '五', '六', '日'];
const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '19:00'];

export default function SearchTeachers() {
  const { currentUser, teachers, bookings, setBookings, refreshBookings } = useApp();
  const [nameQuery, setNameQuery] = useState('');
  const [courseType, setCourseType] = useState<string>('全部');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [note, setNote] = useState('');
  const [hoveredAvatar, setHoveredAvatar] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchesName = t.name.toLowerCase().includes(nameQuery.toLowerCase());
      const matchesType = courseType === '全部' || t.courses.some(c => c.type === courseType);
      return matchesName && matchesType;
    });
  }, [teachers, nameQuery, courseType]);

  useEffect(() => {
    if (!selectedTeacher) return;
    fetch(`/api/teachers/${selectedTeacher.id}/slots`)
      .then(r => r.json())
      .then((data: TimeSlot[]) => setTimeSlots(data))
      .catch(() => setTimeSlots([]));
  }, [selectedTeacher]);

  const bookedSlots = useMemo(() => {
    if (!selectedTeacher) return new Set<string>();
    const set = new Set<string>();
    (Array.isArray(bookings) ? bookings : [])
      .filter(b => b.teacherId === selectedTeacher.id && b.status !== 'cancelled')
      .forEach(b => set.add(`${b.date}_${b.startTime}`));
    return set;
  }, [bookings, selectedTeacher]);

  const weekDates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, []);

  const slotsByDayAndTime = useMemo(() => {
    const map = new Map<string, TimeSlot[]>();
    for (const s of timeSlots) {
      const key = String(s.dayOfWeek);
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return map;
  }, [timeSlots]);

  const isSlotAvailable = (dayOfWeek: number, time: string) => {
    const dateStr = weekDates[dayOfWeek - 1]
      ? weekDates[dayOfWeek - 1].toISOString().slice(0, 10)
      : '';
    if (bookedSlots.has(`${dateStr}_${time}`)) return false;
    const slots = slotsByDayAndTime.get(String(dayOfWeek)) ?? [];
    return slots.some(s => s.startTime === time && !s.isBooked);
  };

  const isSlotBooked = (dayOfWeek: number, time: string) => {
    const dateStr = weekDates[dayOfWeek - 1]
      ? weekDates[dayOfWeek - 1].toISOString().slice(0, 10)
      : '';
    return bookedSlots.has(`${dateStr}_${time}`);
  };

  const handleSubmit = async () => {
    if (!selectedCourse || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentUser.id,
          teacherId: selectedTeacher!.id,
          courseId: selectedCourse.id,
          date: selectedDate,
          startTime: selectedTime,
          note,
        }),
      });
      if (res.ok) {
        const newBooking: Booking = await res.json();
        setBookings(prev => [...prev, newBooking]);
        refreshBookings();
        setToast('预约成功！');
        setSelectedCourse(null);
        setSelectedDate('');
        setSelectedTime('');
        setNote('');
      }
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleTeacherClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSelectedCourse(null);
    setSelectedDate('');
    setSelectedTime('');
    setNote('');
  };

  const handleBack = () => {
    setSelectedTeacher(null);
    setSelectedCourse(null);
    setSelectedDate('');
    setSelectedTime('');
    setNote('');
    setTimeSlots([]);
  };

  const handleSlotClick = (dayIndex: number, time: string) => {
    if (!isSlotAvailable(dayIndex + 1, time)) return;
    const dateStr = weekDates[dayIndex].toISOString().slice(0, 10);
    setSelectedDate(dateStr);
    setSelectedTime(time);
  };

  if (selectedTeacher) {
    return (
      <div style={{ padding: 24, color: '#1F2937' }}>
        {toast && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              background: '#10B981',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              zIndex: 9999,
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            {toast}
          </div>
        )}

        <button
          onClick={handleBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#F59E0B',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 16,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ← 返回搜索
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <img
            className="avatar"
            src={selectedTeacher.avatar}
            alt={selectedTeacher.name}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selectedTeacher.name}</h2>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{selectedTeacher.bio}</p>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>选择课程</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {selectedTeacher.courses.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCourse(c)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: selectedCourse?.id === c.id ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                  background: selectedCourse?.id === c.id ? '#FEF3C7' : '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: selectedCourse?.id === c.id ? 600 : 400,
                  color: '#1F2937',
                  transition: 'all 0.15s ease',
                }}
              >
                {c.type} · {c.duration}分钟 · ¥{c.price}
              </button>
            ))}
          </div>
        </div>

        {selectedCourse && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>选择时间</h3>
            <div
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid #E5E7EB',
                background: '#fff',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `80px repeat(7, 1fr)`,
                  background: '#FEF3C7',
                }}
              >
                <div style={{ padding: '8px 4px', fontSize: 12, fontWeight: 600, color: '#92400E', textAlign: 'center' }} />
                {DAYS.map((d, i) => {
                  const dateStr = weekDates[i]?.toISOString().slice(5, 10) ?? '';
                  return (
                    <div
                      key={d}
                      style={{
                        padding: '8px 4px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#92400E',
                        textAlign: 'center',
                      }}
                    >
                      {d}
                      <div style={{ fontSize: 10, color: '#B45309', marginTop: 2 }}>{dateStr}</div>
                    </div>
                  );
                })}
              </div>
              {TIME_SLOTS.map(time => (
                <div
                  key={time}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `80px repeat(7, 1fr)`,
                    borderBottom: '1px solid #F3F4F6',
                  }}
                >
                  <div
                    style={{
                      padding: '8px 4px',
                      fontSize: 12,
                      color: '#6B7280',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {time}
                  </div>
                  {DAYS.map((_, dayIndex) => {
                    const dayOfWeek = dayIndex + 1;
                    const available = isSlotAvailable(dayOfWeek, time);
                    const booked = isSlotBooked(dayOfWeek, time);
                    const dateStr = weekDates[dayIndex]?.toISOString().slice(0, 10) ?? '';
                    const isSelected = selectedDate === dateStr && selectedTime === time;

                    return (
                      <div
                        key={dayIndex}
                        onClick={() => handleSlotClick(dayIndex, time)}
                        style={{
                          padding: '6px 2px',
                          textAlign: 'center',
                          cursor: available ? 'pointer' : 'default',
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: 28,
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 500,
                            transition: 'all 0.15s ease',
                            ...(booked
                              ? { background: '#D1D5DB', color: '#9CA3AF' }
                              : available
                              ? isSelected
                                ? { background: '#F59E0B', color: '#fff' }
                                : { background: '#10B981', color: '#fff' }
                              : { background: '#F9FAFB', color: '#D1D5DB' }),
                          }}
                        >
                          {booked ? '已约' : available ? '可选' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedCourse && selectedDate && selectedTime && (
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 20,
              border: '1px solid #E5E7EB',
              maxWidth: 420,
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>预约详情</h3>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
              课程：{selectedCourse.type} · {selectedCourse.duration}分钟 · ¥{selectedCourse.price}
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
              时间：{selectedDate} {selectedTime}
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="留言备注（选填）"
              style={{
                width: '100%',
                minHeight: 60,
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                padding: '8px 12px',
                fontSize: 13,
                resize: 'vertical',
                marginBottom: 12,
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '10px 0',
                borderRadius: 8,
                border: 'none',
                background: submitting ? '#D1D5DB' : '#F59E0B',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              {submitting ? '提交中...' : '确认预约'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#FFFBEB', minHeight: '100%', color: '#1F2937' }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            background: '#10B981',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
          }}
        >
          {toast}
        </div>
      )}

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>搜索老师</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="输入老师姓名..."
          value={nameQuery}
          onChange={e => setNameQuery(e.target.value)}
          style={{
            flex: '1 1 200px',
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #E5E7EB',
            fontSize: 14,
            outline: 'none',
            background: '#fff',
          }}
        />
        <select
          value={courseType}
          onChange={e => setCourseType(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #E5E7EB',
            fontSize: 14,
            background: '#fff',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {COURSE_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        {filteredTeachers.map(teacher => (
          <div
            key={teacher.id}
            onClick={() => handleTeacherClick(teacher)}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(245,158,11,0.15)';
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setHoveredAvatar(teacher.id)}
                onMouseLeave={() => setHoveredAvatar(null)}
              >
                <img
                  className="avatar"
                  src={teacher.avatar}
                  alt={teacher.name}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
                {hoveredAvatar === teacher.id && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%) scale(0.95)',
                      transformOrigin: 'top center',
                      marginTop: 8,
                      background: '#fff',
                      borderRadius: 10,
                      padding: 12,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      zIndex: 10,
                      minWidth: 200,
                      animation: 'tooltipIn 0.2s ease-out forwards',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#1F2937' }}>
                      {teacher.name} 的课程
                    </div>
                    {teacher.courses.map(c => (
                      <div
                        key={c.id}
                        style={{
                          fontSize: 12,
                          color: '#6B7280',
                          padding: '3px 0',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{c.type} · {c.duration}分钟</span>
                        <span style={{ fontWeight: 600, color: '#F59E0B' }}>¥{c.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{teacher.name}</div>
                <div
                  style={{
                    fontSize: 13,
                    color: '#6B7280',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {teacher.bio}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {teacher.courses.map(c => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    background: '#FEF3C7',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  <span>
                    <span style={{ fontWeight: 600, color: '#92400E' }}>{c.type}</span>
                    <span style={{ color: '#6B7280', marginLeft: 6 }}>{c.duration}分钟</span>
                  </span>
                  <span style={{ fontWeight: 600, color: '#F59E0B' }}>¥{c.price}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredTeachers.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 0',
            color: '#9CA3AF',
            fontSize: 14,
          }}
        >
          未找到匹配的老师
        </div>
      )}

      <style>{`
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateX(-50%) scale(0.95); }
          to { opacity: 1; transform: translateX(-50%) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
