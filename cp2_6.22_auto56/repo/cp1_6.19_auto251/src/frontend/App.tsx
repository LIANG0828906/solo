import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Grid from './Grid';
import Sidebar from './Sidebar';
import CourseForm from './CourseForm';
import { useScheduleStore } from './store';
import { COLOR_LABEL, COLOR_MAP, ColorTag } from './types';

type DayFilter = 'all' | 'mwf' | 'tt';

const DAY_FILTER_OPTIONS: { value: DayFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'mwf', label: '周一三五' },
  { value: 'tt', label: '周二四' },
];

function NotificationBar() {
  const notification = useScheduleStore((s) => s.notification);
  const setNotification = useScheduleStore((s) => s.setNotification);

  if (!notification) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2000,
          background: notification.type === 'error' ? '#ef4444' : '#22c55e',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        <span>{notification.message}</span>
        <button
          onClick={() => setNotification(null)}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const fetchCourses = useScheduleStore((s) => s.fetchCourses);
  const dayFilter = useScheduleStore((s) => s.dayFilter);
  const setDayFilter = useScheduleStore((s) => s.setDayFilter);
  const typeFilter = useScheduleStore((s) => s.typeFilter);
  const toggleTypeFilter = useScheduleStore((s) => s.toggleTypeFilter);
  const batchImport = useScheduleStore((s) => s.batchImport);
  const setNotification = useScheduleStore((s) => s.setNotification);
  const courses = useScheduleStore((s) => s.courses);
  const conflicts = useScheduleStore((s) => s.getConflicts());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const parseICal = (content: string): any[] => {
    const lines = content.split(/\r?\n/);
    const events: any[] = [];
    let current: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === 'BEGIN:VEVENT') {
        current = {};
      } else if (line === 'END:VEVENT') {
        if (current) events.push(current);
        current = null;
      } else if (current) {
        const [key, ...rest] = line.split(':');
        const value = rest.join(':');
        if (key.startsWith('SUMMARY')) current.name = value;
        if (key.startsWith('LOCATION')) current.classroom = value;
        if (key.startsWith('DESCRIPTION')) current.teacher = value;
        if (key.startsWith('DTSTART')) {
          const match = value.match(/T(\d{2})(\d{2})/);
          if (match) {
            const hour = parseInt(match[1]);
            const min = parseInt(match[2]);
            current.startSlot = Math.max(0, (hour - 8) * 2 + (min >= 30 ? 1 : 0));
          }
        }
        if (key.startsWith('DTEND')) {
          const match = value.match(/T(\d{2})(\d{2})/);
          if (match && current.startSlot !== undefined) {
            const hour = parseInt(match[1]);
            const min = parseInt(match[2]);
            const endSlot = Math.max(0, (hour - 8) * 2 + (min >= 30 ? 1 : 0));
            current.duration = Math.max(1, endSlot - current.startSlot);
          }
        }
        if (key.startsWith('RRULE')) {
          const byday = value.match(/BYDAY=([A-Z,]+)/);
          if (byday) {
            const dayMap: Record<string, number> = {
              MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6,
            };
            const first = byday[1].split(',')[0];
            if (dayMap[first] !== undefined) current.dayOfWeek = dayMap[first];
          }
        }
      }
    }

    return events.map((e) => ({
      name: e.name || '未命名课程',
      teacher: e.teacher || '',
      classroom: e.classroom || '',
      dayOfWeek: e.dayOfWeek ?? 0,
      startSlot: e.startSlot ?? 0,
      duration: e.duration ?? 2,
      weekType: 'all' as const,
      colorTag: 'major' as const,
    }));
  };

  const parseCSV = (content: string): any[] => {
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const idx = (name: string) => header.findIndex((h) => h.includes(name));
    const results: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      const dayIdx = idx('day');
      const startIdx = idx('start');
      results.push({
        name: cols[idx('name')] || cols[idx('课程')] || '未命名课程',
        teacher: cols[idx('teacher')] || cols[idx('教师')] || '',
        classroom: cols[idx('classroom')] || cols[idx('教室')] || '',
        dayOfWeek: dayIdx >= 0 ? parseInt(cols[dayIdx]) - 1 : 0,
        startSlot: startIdx >= 0 ? parseInt(cols[startIdx]) : 0,
        duration: 2,
        weekType: 'all' as const,
        colorTag: 'major' as const,
      });
    }
    return results;
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      let parsed: any[];
      if (file.name.endsWith('.ics') || file.name.endsWith('.ical')) {
        parsed = parseICal(content);
      } else if (file.name.endsWith('.csv')) {
        parsed = parseCSV(content);
      } else {
        throw new Error('不支持的文件格式');
      }
      if (parsed.length === 0) {
        throw new Error('未能解析出课程数据');
      }
      await batchImport(parsed);
    } catch (err) {
      setNotification({
        message: (err as Error).message || '导入失败，请检查文件格式',
        type: 'error',
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#F9F6F0',
      }}
    >
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          height: 60,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'rgba(249, 246, 240, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E8E3D9',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #5B86E5, #A66CFF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            课
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#222' }}>课表精灵</div>
            <div style={{ fontSize: 11, color: '#999' }}>Schedule Sprite</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {conflicts.size > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
              {conflicts.size} 门课程存在冲突
            </motion.div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.ics,.ical"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '8px 16px',
              borderRadius: 12,
              border: '2px solid #E8E3D9',
              background: '#fff',
              color: '#555',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            导入课表
          </motion.button>
          <div style={{ fontSize: 12, color: '#999' }}>
            共 {courses.length} 门课程
          </div>
        </div>
      </motion.div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Grid />
        <Sidebar />
      </div>

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        style={{
          height: 64,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '0 24px',
          background: 'rgba(249, 246, 240, 0.9)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid #E8E3D9',
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          {DAY_FILTER_OPTIONS.map((opt) => (
            <motion.button
              key={opt.value}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              onClick={() => setDayFilter(opt.value)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: dayFilter === opt.value ? '2px solid #5B86E5' : '2px solid #E8E3D9',
                background: dayFilter === opt.value ? 'rgba(91, 134, 229, 0.1)' : '#fff',
                color: dayFilter === opt.value ? '#5B86E5' : '#555',
                fontSize: 13,
                fontWeight: dayFilter === opt.value ? 600 : 500,
              }}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>

        <div style={{ width: 1, height: 28, background: '#E8E3D9' }} />

        <div style={{ display: 'flex', gap: 6 }}>
          {(['major', 'elective', 'pe', 'lab'] as ColorTag[]).map((tag) => {
            const active = typeFilter.has(tag);
            return (
              <motion.button
                key={tag}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                onClick={() => toggleTypeFilter(tag)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: active ? `2px solid ${COLOR_MAP[tag]}` : '2px solid #E8E3D9',
                  background: active ? `${COLOR_MAP[tag]}15` : '#fff',
                  color: active ? COLOR_MAP[tag] : '#888',
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  opacity: active ? 1 : 0.6,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: COLOR_MAP[tag],
                  }}
                />
                {COLOR_LABEL[tag]}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <CourseForm />
      <NotificationBar />
    </div>
  );
}
