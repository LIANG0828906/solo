import React, { useState } from 'react';
import { Course, Teacher } from '../types';
import { createCourse, updateCourse, deleteCourse } from '../api/scheduleApi';

interface Props {
  courses: Course[];
  teachers: Teacher[];
  onRefresh: () => void;
}

const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const DURATION_OPTIONS = [
  { value: 1, label: '1 slot (30 min)' },
  { value: 2, label: '2 slots (1 hr)' },
  { value: 3, label: '3 slots (1.5 hr)' },
];
const ROOM_TYPES = [
  { value: 'normal', label: 'Normal' },
  { value: 'lab', label: 'Lab' },
  { value: 'multimedia', label: 'Multimedia' },
];

const defaultForm = {
  name: '',
  grade: GRADES[0],
  duration: 2,
  requiredRoomType: 'normal',
  preferredTeacherIds: [] as string[],
  weeklyHours: 2,
};

export default function CourseManage({ courses, teachers, onRefresh }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ ...defaultForm });
  const [editForm, setEditForm] = useState({ ...defaultForm });

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    await createCourse(addForm);
    setAddForm({ ...defaultForm });
    setAdding(false);
    onRefresh();
  };

  const handleEdit = (course: Course) => {
    setEditingId(course.id);
    setEditForm({
      name: course.name,
      grade: course.grade,
      duration: course.duration,
      requiredRoomType: course.requiredRoomType,
      preferredTeacherIds: [...course.preferredTeacherIds],
      weeklyHours: course.weeklyHours,
    });
  };

  const handleEditSave = async (id: string) => {
    if (!editForm.name.trim()) return;
    await updateCourse(id, editForm);
    setEditingId(null);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    await deleteCourse(id);
    setDeleteConfirmId(null);
    onRefresh();
  };

  const togglePreferredTeacher = (formType: 'add' | 'edit', teacherId: string) => {
    const form = formType === 'add' ? addForm : editForm;
    const setter = formType === 'add' ? setAddForm : setEditForm;
    const current = form.preferredTeacherIds;
    if (current.includes(teacherId)) {
      setter({ ...form, preferredTeacherIds: current.filter((id) => id !== teacherId) });
    } else {
      setter({ ...form, preferredTeacherIds: [...current, teacherId] });
    }
  };

  const renderTeacherCheckboxes = (formType: 'add' | 'edit') => {
    const form = formType === 'add' ? addForm : editForm;
    return (
      <div>
        <label style={{ fontSize: 12, color: '#546E7A', display: 'block', marginBottom: 4 }}>Preferred Teachers</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 100, overflowY: 'auto', border: '1px solid #BBDEFB', borderRadius: 6, padding: 8, background: 'white' }}>
          {teachers.length === 0 && <span style={{ fontSize: 12, color: '#90A4AE' }}>No teachers available</span>}
          {teachers.map((t) => (
            <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.preferredTeacherIds.includes(t.id)}
                onChange={() => togglePreferredTeacher(formType, t.id)}
                style={{ accentColor: '#1565C0' }}
              />
              {t.name} ({t.subject})
            </label>
          ))}
        </div>
      </div>
    );
  };

  const renderForm = (
    form: typeof defaultForm,
    setter: React.Dispatch<React.SetStateAction<typeof defaultForm>>,
    formType: 'add' | 'edit',
    onSave: () => void,
    onCancel: () => void
  ) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div>
        <label style={{ fontSize: 12, color: '#546E7A', display: 'block', marginBottom: 4 }}>Name</label>
        <input value={form.name} onChange={(e) => setter({ ...form, name: e.target.value })} placeholder="Course name" />
      </div>
      <div>
        <label style={{ fontSize: 12, color: '#546E7A', display: 'block', marginBottom: 4 }}>Grade</label>
        <select value={form.grade} onChange={(e) => setter({ ...form, grade: e.target.value })}>
          {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 12, color: '#546E7A', display: 'block', marginBottom: 4 }}>Duration</label>
        <select value={form.duration} onChange={(e) => setter({ ...form, duration: Number(e.target.value) })}>
          {DURATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 12, color: '#546E7A', display: 'block', marginBottom: 4 }}>Room Type</label>
        <select value={form.requiredRoomType} onChange={(e) => setter({ ...form, requiredRoomType: e.target.value })}>
          {ROOM_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 12, color: '#546E7A', display: 'block', marginBottom: 4 }}>Weekly Hours</label>
        <input type="number" min={1} max={20} value={form.weeklyHours} onChange={(e) => setter({ ...form, weeklyHours: Number(e.target.value) })} />
      </div>
      {renderTeacherCheckboxes(formType)}
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', paddingTop: 18 }}>
        <button className="btn-primary" onClick={onSave}>Save</button>
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );

  const roomTypeBadge = (type: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      normal: { bg: '#E3F2FD', color: '#1565C0' },
      lab: { bg: '#E8F5E9', color: '#2E7D32' },
      multimedia: { bg: '#F3E5F5', color: '#7B1FA2' },
    };
    const c = colors[type] || colors.normal;
    return <span style={{ background: c.bg, color: c.color, padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{type}</span>;
  };

  const getTeacherName = (id: string) => teachers.find((t) => t.id === id)?.name ?? 'Unknown';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1565C0' }}>Course Management</h2>
        <button className="btn-primary" onClick={() => setAdding(true)} style={{ display: adding ? 'none' : 'inline-block' }}>
          + Add Course
        </button>
      </div>

      {adding && (
        <div className="panel-card" style={{ marginBottom: 12, border: '1px solid #90CAF9' }}>
          {renderForm(addForm, setAddForm, 'add', handleAdd, () => { setAdding(false); setAddForm({ ...defaultForm }); })}
        </div>
      )}

      {courses.length === 0 && !adding && (
        <div className="panel-card" style={{ textAlign: 'center', color: '#90A4AE', padding: 32 }}>
          No courses yet. Click "Add Course" to get started.
        </div>
      )}

      {courses.map((course) => (
        <div key={course.id}>
          {editingId === course.id ? (
            <div className="panel-card" style={{ marginBottom: 12, border: '1px solid #90CAF9' }}>
              {renderForm(editForm, setEditForm, 'edit', () => handleEditSave(course.id), () => setEditingId(null))}
            </div>
          ) : (
            <div className="panel-card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>{course.name}</span>
                    <span style={{ background: '#FFF3E0', color: '#E65100', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{course.grade}</span>
                    {roomTypeBadge(course.requiredRoomType)}
                  </div>
                  <div style={{ fontSize: 13, color: '#546E7A', marginTop: 4 }}>
                    Duration: {course.duration} slot{course.duration > 1 ? 's' : ''} &middot; Weekly: {course.weeklyHours} hr{course.weeklyHours > 1 ? 's' : ''}
                  </div>
                  {course.preferredTeacherIds.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                      {course.preferredTeacherIds.map((tid) => (
                        <span key={tid} style={{ background: '#E3F2FD', color: '#1565C0', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                          {getTeacherName(tid)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
                  <button className="btn-secondary" onClick={() => handleEdit(course)}>Edit</button>
                  {deleteConfirmId === course.id ? (
                    <>
                      <button className="btn-danger" onClick={() => handleDelete(course.id)}>Confirm</button>
                      <button className="btn-secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                    </>
                  ) : (
                    <button className="btn-danger" onClick={() => setDeleteConfirmId(course.id)}>Delete</button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
