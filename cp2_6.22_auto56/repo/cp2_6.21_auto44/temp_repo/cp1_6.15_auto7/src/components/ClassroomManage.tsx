import React, { useState } from 'react';
import { Classroom, ScheduleEntry, Course, Teacher } from '../types';
import { createClassroom, updateClassroom, deleteClassroom } from '../api/scheduleApi';

interface Props {
  classrooms: Classroom[];
  schedule: ScheduleEntry[];
  courses: Course[];
  teachers: Teacher[];
  onRefresh: () => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const TOTAL_SLOTS = 20;
const SLOT_LABELS: string[] = [];
for (let i = 0; i < TOTAL_SLOTS; i++) {
  const hour = 8 + Math.floor(i / 2);
  const min = i % 2 === 0 ? '00' : '30';
  SLOT_LABELS.push(`${hour}:${min}`);
}

const ROOM_TYPES = [
  { value: 'normal', label: 'Normal' },
  { value: 'lab', label: 'Lab' },
  { value: 'multimedia', label: 'Multimedia' },
];

const defaultForm = { name: '', capacity: 30, type: 'normal' };

export default function ClassroomManage({ classrooms, schedule, courses, teachers, onRefresh }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [occupancyId, setOccupancyId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ ...defaultForm });
  const [editForm, setEditForm] = useState({ ...defaultForm });

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    await createClassroom(addForm);
    setAddForm({ ...defaultForm });
    setAdding(false);
    onRefresh();
  };

  const handleEdit = (classroom: Classroom) => {
    setEditingId(classroom.id);
    setEditForm({ name: classroom.name, capacity: classroom.capacity, type: classroom.type });
  };

  const handleEditSave = async (id: string) => {
    if (!editForm.name.trim()) return;
    await updateClassroom(id, editForm);
    setEditingId(null);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    await deleteClassroom(id);
    setDeleteConfirmId(null);
    onRefresh();
  };

  const getCourseName = (id: string) => courses.find((c) => c.id === id)?.name ?? 'Unknown';
  const getTeacherName = (id: string) => teachers.find((t) => t.id === id)?.name ?? 'Unknown';

  const typeBadge = (type: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      normal: { bg: '#E3F2FD', color: '#1565C0' },
      lab: { bg: '#E8F5E9', color: '#2E7D32' },
      multimedia: { bg: '#F3E5F5', color: '#7B1FA2' },
    };
    const c = colors[type] || colors.normal;
    return <span style={{ background: c.bg, color: c.color, padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500 }}>{type}</span>;
  };

  const getOccupancyGrid = (classroomId: string) => {
    const grid: (ScheduleEntry | null)[][] = Array.from({ length: 5 }, () =>
      Array(TOTAL_SLOTS).fill(null)
    );
    const entries = schedule.filter((e) => e.classroomId === classroomId);
    for (const entry of entries) {
      const course = courses.find((c) => c.id === entry.courseId);
      const end = entry.startSlot + (course?.duration ?? 1);
      for (let s = entry.startSlot; s < end && s < TOTAL_SLOTS; s++) {
        grid[entry.day][s] = entry;
      }
    }
    return grid;
  };

  const renderOccupancy = (classroom: Classroom) => {
    const grid = getOccupancyGrid(classroom.id);
    return (
      <div style={{ marginTop: 12, overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ padding: '4px 8px', fontSize: 12, color: '#546E7A', borderBottom: '1px solid #E3F2FD', textAlign: 'left' }}>Time</th>
              {DAYS.map((d) => (
                <th key={d} style={{ padding: '4px 8px', fontSize: 12, color: '#546E7A', borderBottom: '1px solid #E3F2FD', textAlign: 'center' }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOT_LABELS.map((label, slotIndex) => (
              <tr key={slotIndex}>
                <td style={{ padding: '2px 8px', fontSize: 12, color: '#78909C', borderBottom: '1px solid #f5f5f5', whiteSpace: 'nowrap' }}>{label}</td>
                {DAYS.map((_, dayIndex) => {
                  const entry = grid[dayIndex][slotIndex];
                  if (entry) {
                    return (
                      <td key={dayIndex} style={{ padding: '2px 4px', textAlign: 'center', borderBottom: '1px solid #f5f5f5' }}>
                        <div style={{ background: '#E3F2FD', color: '#1565C0', padding: '2px 4px', borderRadius: 3, fontSize: 10, lineHeight: 1.3, whiteSpace: 'nowrap' }}>
                          {getCourseName(entry.courseId)}<br />{getTeacherName(entry.teacherId)}
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td key={dayIndex} style={{ padding: '2px 4px', textAlign: 'center', borderBottom: '1px solid #f5f5f5' }}>
                      <span style={{ fontSize: 10, color: '#CFD8DC' }}>-</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1565C0' }}>Classroom Management</h2>
        <button className="btn-primary" onClick={() => setAdding(true)} style={{ display: adding ? 'none' : 'inline-block' }}>
          + Add Classroom
        </button>
      </div>

      {adding && (
        <div className="panel-card" style={{ marginBottom: 12, border: '1px solid #90CAF9' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: 12, color: '#546E7A', display: 'block', marginBottom: 4 }}>Name</label>
              <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="Classroom name" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#546E7A', display: 'block', marginBottom: 4 }}>Capacity</label>
              <input type="number" min={1} value={addForm.capacity} onChange={(e) => setAddForm({ ...addForm, capacity: Number(e.target.value) })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#546E7A', display: 'block', marginBottom: 4 }}>Type</label>
              <select value={addForm.type} onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}>
                {ROOM_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <button className="btn-primary" onClick={handleAdd}>Save</button>
            <button className="btn-secondary" onClick={() => { setAdding(false); setAddForm({ ...defaultForm }); }}>Cancel</button>
          </div>
        </div>
      )}

      {classrooms.length === 0 && !adding && (
        <div className="panel-card" style={{ textAlign: 'center', color: '#90A4AE', padding: 32 }}>
          No classrooms yet. Click "Add Classroom" to get started.
        </div>
      )}

      {classrooms.map((classroom) => (
        <div key={classroom.id}>
          {editingId === classroom.id ? (
            <div className="panel-card" style={{ marginBottom: 12, border: '1px solid #90CAF9' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ fontSize: 12, color: '#546E7A', display: 'block', marginBottom: 4 }}>Name</label>
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#546E7A', display: 'block', marginBottom: 4 }}>Capacity</label>
                  <input type="number" min={1} value={editForm.capacity} onChange={(e) => setEditForm({ ...editForm, capacity: Number(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#546E7A', display: 'block', marginBottom: 4 }}>Type</label>
                  <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                    {ROOM_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <button className="btn-primary" onClick={() => handleEditSave(classroom.id)}>Save</button>
                <button className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="panel-card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>{classroom.name}</span>
                    {typeBadge(classroom.type)}
                  </div>
                  <div style={{ fontSize: 13, color: '#546E7A', marginTop: 4 }}>
                    Capacity: {classroom.capacity}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-secondary" onClick={() => setOccupancyId(occupancyId === classroom.id ? null : classroom.id)}>
                    {occupancyId === classroom.id ? 'Hide Occupancy' : 'View Occupancy'}
                  </button>
                  <button className="btn-secondary" onClick={() => handleEdit(classroom)}>Edit</button>
                  {deleteConfirmId === classroom.id ? (
                    <>
                      <button className="btn-danger" onClick={() => handleDelete(classroom.id)}>Confirm</button>
                      <button className="btn-secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                    </>
                  ) : (
                    <button className="btn-danger" onClick={() => setDeleteConfirmId(classroom.id)}>Delete</button>
                  )}
                </div>
              </div>
              {occupancyId === classroom.id && renderOccupancy(classroom)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
