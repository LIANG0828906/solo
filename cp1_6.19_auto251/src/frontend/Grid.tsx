import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScheduleStore } from './store';
import {
  COLOR_MAP,
  DAY_LABELS,
  TOTAL_SLOTS,
  slotToTime,
  WEEK_LABEL,
  Course,
} from './types';

const SLOT_HEIGHT = 40;
const COLUMN_WIDTH = 140;
const TIME_COLUMN_WIDTH = 70;

function CourseCard({ course, conflict }: { course: Course; conflict: boolean }) {
  const openFormForEdit = useScheduleStore((s) => s.openFormForEdit);
  const color = COLOR_MAP[course.colorTag];
  const displayName = course.name.length > 8 ? course.name.slice(0, 8) : course.name;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'absolute',
        left: 6,
        right: 6,
        top: course.startSlot * SLOT_HEIGHT + 4,
        height: course.duration * SLOT_HEIGHT - 8,
        background: 'rgba(255, 255, 255, 0.92)',
        borderRadius: 12,
        padding: '8px 8px 8px 10px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: conflict ? '2px solid #ef4444' : '1px solid rgba(0,0,0,0.06)',
      }}
      className={conflict ? 'conflict-glow' : ''}
      onClick={(e) => {
        e.stopPropagation();
        openFormForEdit(course);
      }}
      whileHover={{
        y: -4,
        boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
        transition: { duration: 0.2, ease: 'easeInOut' },
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 8,
          bottom: 8,
          width: 4,
          borderRadius: 2,
          background: color,
        }}
      />
      <div style={{ paddingLeft: 6, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: '#1a1a1a',
            lineHeight: 1.3,
            marginBottom: 2,
            overflow: 'hidden',
          }}
        >
          {displayName}
        </div>
        {course.duration >= 3 && (
          <div style={{ fontSize: 11, color: '#666' }}>
            {WEEK_LABEL[course.weekType]} · {slotToTime(course.startSlot)}-{slotToTime(course.startSlot + course.duration)}
          </div>
        )}
        <div style={{ fontSize: 11, color: '#666', marginTop: 'auto' }}>
          {course.classroom}
        </div>
        {course.duration >= 2 && (
          <div style={{ fontSize: 11, color: '#888' }}>{course.teacher}</div>
        )}
      </div>
    </motion.div>
  );
}

export default function Grid() {
  const courses = useScheduleStore((s) => s.getFilteredCourses());
  const conflicts = useScheduleStore((s) => s.getConflicts());
  const openFormForSlot = useScheduleStore((s) => s.openFormForSlot);
  const dayFilter = useScheduleStore((s) => s.dayFilter);

  const displayedCourses = useMemo(() => courses, [courses]);

  const allowedDays = useMemo(() => {
    const set = new Set<number>();
    if (dayFilter === 'all') {
      for (let i = 0; i < 7; i++) set.add(i);
    } else if (dayFilter === 'mwf') {
      set.add(0).add(2).add(4);
    } else {
      set.add(1).add(3);
    }
    return set;
  }, [dayFilter]);

  return (
    <div
      data-schedule-grid
      style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px 20px 20px',
      }}
    >
      <div style={{ display: 'flex', minWidth: 'fit-content' }}>
        <div style={{ width: TIME_COLUMN_WIDTH, flexShrink: 0 }}>
          <div style={{ height: 36 }} />
          {Array.from({ length: TOTAL_SLOTS }).map((_, i) => (
            <div
              key={i}
              style={{
                height: SLOT_HEIGHT,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-end',
                paddingRight: 10,
                fontSize: 11,
                color: '#999',
                fontWeight: 500,
              }}
            >
              {slotToTime(i)}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flex: 1 }}>
          {DAY_LABELS.map((day, dayIdx) => {
            const dayCourses = displayedCourses.filter((c) => c.dayOfWeek === dayIdx);
            const isDimmed = !allowedDays.has(dayIdx);
            return (
              <div
                key={day}
                style={{
                  width: COLUMN_WIDTH,
                  flexShrink: 0,
                  position: 'relative',
                  opacity: isDimmed ? 0.35 : 1,
                  transition: 'opacity 0.3s ease',
                  pointerEvents: isDimmed ? 'none' : 'auto',
                }}
              >
                <div
                  style={{
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: 14,
                    color: '#444',
                  }}
                >
                  {day}
                </div>

                {Array.from({ length: TOTAL_SLOTS }).map((_, slotIdx) => (
                  <div
                    key={slotIdx}
                    onClick={() => openFormForSlot(dayIdx, slotIdx)}
                    style={{
                      height: SLOT_HEIGHT,
                      borderTop: '1px solid #f0ebe0',
                      borderRight: '1px solid #f0ebe0',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(91, 134, 229, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  />
                ))}

                <AnimatePresence>
                  {dayCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      conflict={conflicts.has(course.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
