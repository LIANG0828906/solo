import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScheduleStore } from './store';
import {
  COLOR_MAP,
  COLOR_LABEL,
  DAY_LABELS,
  WEEK_LABEL,
  ColorTag,
  WeekType,
  slotToTime,
  CourseInput,
  Course,
} from './types';

export default function CourseForm() {
  const showForm = useScheduleStore((s) => s.showForm);
  const closeForm = useScheduleStore((s) => s.closeForm);
  const editingCourse = useScheduleStore((s) => s.editingCourse);
  const formSlot = useScheduleStore((s) => s.formSlot);
  const addCourse = useScheduleStore((s) => s.addCourse);
  const updateCourse = useScheduleStore((s) => s.updateCourse);
  const deleteCourse = useScheduleStore((s) => s.deleteCourse);

  const [name, setName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [classroom, setClassroom] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startSlot, setStartSlot] = useState(0);
  const [duration, setDuration] = useState(2);
  const [weekType, setWeekType] = useState<WeekType>('all');
  const [colorTag, setColorTag] = useState<ColorTag>('major');

  useEffect(() => {
    if (editingCourse) {
      setName(editingCourse.name);
      setTeacher(editingCourse.teacher);
      setClassroom(editingCourse.classroom);
      setDayOfWeek(editingCourse.dayOfWeek);
      setStartSlot(editingCourse.startSlot);
      setDuration(editingCourse.duration);
      setWeekType(editingCourse.weekType);
      setColorTag(editingCourse.colorTag);
    } else if (formSlot) {
      setDayOfWeek(formSlot.dayOfWeek);
      setStartSlot(formSlot.startSlot);
      setName('');
      setTeacher('');
      setClassroom('');
      setDuration(2);
      setWeekType('all');
      setColorTag('major');
    }
  }, [editingCourse, formSlot, showForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const input: CourseInput = {
      name: name.trim(),
      teacher: teacher.trim(),
      classroom: classroom.trim(),
      dayOfWeek,
      startSlot,
      duration,
      weekType,
      colorTag,
    };

    if (editingCourse) {
      await updateCourse(editingCourse.id, input);
    } else {
      await addCourse(input);
    }
  };

  const handleDelete = async () => {
    if (editingCourse) {
      await deleteCourse(editingCourse.id);
      closeForm();
    }
  };

  if (!showForm) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={closeForm}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <motion.form
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(16px)',
            borderRadius: 20,
            padding: 28,
            width: '100%',
            maxWidth: 420,
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255,255,255,0.8)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#222' }}>
              {editingCourse ? '编辑课程' : '新增课程'}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f0ebe0',
                color: '#666',
                fontSize: 18,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#e8e0d0')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#f0ebe0')}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>课程名称 *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如：高等数学"
                maxLength={20}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '2px solid #E8E3D9',
                  background: '#fff',
                  fontSize: 14,
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#5B86E5')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E8E3D9')}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>教师</label>
                <input
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  placeholder="教师姓名"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '2px solid #E8E3D9',
                    background: '#fff',
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>教室</label>
                <input
                  value={classroom}
                  onChange={(e) => setClassroom(e.target.value)}
                  placeholder="如：教学楼A301"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '2px solid #E8E3D9',
                    background: '#fff',
                    fontSize: 14,
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>星期</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {DAY_LABELS.map((day, i) => (
                  <button
                    type="button"
                    key={day}
                    onClick={() => setDayOfWeek(i)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: dayOfWeek === i ? '2px solid #5B86E5' : '2px solid #E8E3D9',
                      background: dayOfWeek === i ? 'rgba(91, 134, 229, 0.1)' : '#fff',
                      color: dayOfWeek === i ? '#5B86E5' : '#555',
                      fontSize: 12,
                      fontWeight: dayOfWeek === i ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>
                  开始时间（{slotToTime(startSlot)}）
                </label>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={startSlot}
                  onChange={(e) => setStartSlot(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>
                  持续 {duration * 30} 分钟（{slotToTime(startSlot)}-{slotToTime(Math.min(startSlot + duration, 26))}）
                </label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>周次</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['all', 'odd', 'even'] as WeekType[]).map((w) => (
                  <button
                    type="button"
                    key={w}
                    onClick={() => setWeekType(w)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: weekType === w ? '2px solid #5B86E5' : '2px solid #E8E3D9',
                      background: weekType === w ? 'rgba(91, 134, 229, 0.1)' : '#fff',
                      color: weekType === w ? '#5B86E5' : '#555',
                      fontSize: 13,
                      fontWeight: weekType === w ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {WEEK_LABEL[w]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>课程类型</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['major', 'elective', 'pe', 'lab'] as ColorTag[]).map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => setColorTag(tag)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: colorTag === tag ? `2px solid ${COLOR_MAP[tag]}` : '2px solid #E8E3D9',
                      background: colorTag === tag ? `${COLOR_MAP[tag]}15` : '#fff',
                      color: colorTag === tag ? COLOR_MAP[tag] : '#555',
                      fontSize: 13,
                      fontWeight: colorTag === tag ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: COLOR_MAP[tag],
                      }}
                    />
                    {COLOR_LABEL[tag]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            {editingCourse && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                onClick={handleDelete}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '2px solid #ff4444',
                  background: 'transparent',
                  color: '#ff4444',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                删除
              </motion.button>
            )}
            <div style={{ flex: 1 }} />
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              onClick={closeForm}
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                border: '2px solid #E8E3D9',
                background: '#fff',
                color: '#555',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              取消
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                border: '2px solid #5B86E5',
                background: '#5B86E5',
                color: '#fff',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {editingCourse ? '保存' : '添加'}
            </motion.button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}
