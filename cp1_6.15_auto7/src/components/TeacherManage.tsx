import React, { useState } from 'react';
import { Teacher, Course, TimeSlot } from '../types';
import { createTeacher, updateTeacher, deleteTeacher, updateTeacherSlots } from '../api/scheduleApi';

interface Props {
  teachers: Teacher[];
  courses: Course[];
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

function normalizeSlot(slot: TimeSlot): TimeSlot[] {
  const result: TimeSlot[] = [];

  if (slot.endSlot <= slot.startSlot) {
    return result;
  }

  let remainingStart = slot.startSlot;
  let remainingEnd = slot.endSlot;
  let currentDay = slot.day;

  while (remainingEnd > remainingStart && currentDay < 5) {
    const clampedStart = Math.max(0, remainingStart);
    const clampedEnd = Math.min(TOTAL_SLOTS, remainingEnd);

    if (clampedEnd > clampedStart) {
      result.push({
        day: Math.max(0, Math.min(4, currentDay)),
        startSlot: clampedStart,
        endSlot: clampedEnd,
      });
    }

    if (remainingEnd > TOTAL_SLOTS) {
      remainingStart = 0;
      remainingEnd = remainingEnd - TOTAL_SLOTS;
      currentDay++;
    } else {
      break;
    }
  }

  return result;
}

function slotsToGrid(availableSlots: TimeSlot[]): boolean[][] {
  const grid: boolean[][] = Array.from({ length: 5 }, () => Array(TOTAL_SLOTS).fill(false));
  for (const rawSlot of availableSlots) {
    const normalized = normalizeSlot(rawSlot);
    for (const slot of normalized) {
      for (let s = slot.startSlot; s < slot.endSlot; s++) {
        if (s >= 0 && s < TOTAL_SLOTS && slot.day >= 0 && slot.day < 5) {
          grid[slot.day][s] = true;
        }
      }
    }
  }
  return grid;
}

function gridToSlots(grid: boolean[][]): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let day = 0; day < 5; day++) {
    if (!grid[day]) continue;
    let start: number | null = null;
    for (let s = 0; s <= TOTAL_SLOTS; s++) {
      const available = s < TOTAL_SLOTS && grid[day][s] === true;
      if (available && start === null) {
        start = s;
      } else if (!available && start !== null) {
        const safeStart = Math.max(0, Math.min(TOTAL_SLOTS - 1, start));
        const safeEnd = Math.max(safeStart + 1, Math.min(TOTAL_SLOTS, s));
        if (safeEnd > safeStart) {
          slots.push({ day, startSlot: safeStart, endSlot: safeEnd });
        }
        start = null;
      }
    }
  }
  return slots;
}

export default function TeacherManage({ teachers, courses, onRefresh }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slotEditorId, setSlotEditorId] = useState<string | null>(null);
  const [slotGrid, setSlotGrid] = useState<boolean[][]>([]);
  const [slotCopyDay, setSlotCopyDay] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [addForm, setAddForm] = useState({ name: '', experience: 0, subject: '' });
  const [editForm, setEditForm] = useState({ name: '', experience: 0, subject: '' });

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.subject.trim()) return;
    await createTeacher(addForm);
    setAddForm({ name: '', experience: 0, subject: '' });
    setAdding(false);
    onRefresh();
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setEditForm({ name: teacher.name, experience: teacher.experience, subject: teacher.subject });
  };

  const handleEditSave = async (id: string) => {
    if (!editForm.name.trim() || !editForm.subject.trim()) return;
    await updateTeacher(id, editForm);
    setEditingId(null);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    await deleteTeacher(id);
    setDeleteConfirmId(null);
    onRefresh();
  };

  const openSlotEditor = (teacher: Teacher) => {
    setSlotEditorId(teacher.id);
    setSlotGrid(slotsToGrid(teacher.availableSlots));
    setSlotCopyDay(0);
  };

  const toggleSlot = (day: number, slotIndex: number) => {
    const next = slotGrid.map((d) => [...d]);
    next[day][slotIndex] = !next[day][slotIndex];
    setSlotGrid(next);
  };

  const copyToAllDays = () => {
    const source = slotGrid[slotCopyDay];
    const next = slotGrid.map((d) => [...source]);
    setSlotGrid(next);
  };

  const saveSlots = async () => {
    if (!slotEditorId) return;
    const slots = gridToSlots(slotGrid);
    await updateTeacherSlots(slotEditorId, slots);
    setSlotEditorId(null);
    onRefresh();
  };

  const assignedCourses = (teacherId: string) =>
    courses.filter((c) => c.preferredTeacherIds.includes(teacherId));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1565C0' }}>Teacher Management</h2>
        <button className="btn-primary" onClick={() => setAdding(true)} style={{ display: adding ? 'none' : 'inline-block' }}>
          + Add Teacher
        </button>
      </div>

      {adding && (
        <div className="panel-card" style={{ marginBottom: 12, border: '1px solid #90CAF9' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: 12, color: '#546E7A', display: 'block', marginBottom: 4 }}>Name</label>
              <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="Teacher name" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#546E7A', display: 'block', marginBottom: 4 }}>Experience (years)</label>
              <input type="number" min={0} value={addForm.experience} onChange={(e) => setAddForm({ ...addForm, experience: Number(e.target.value) })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#546E7A', display: 'block', marginBottom: 4 }}>Subject</label>
              <input value={addForm.subject} onChange={(e) => setAddForm({ ...addForm, subject: e.target.value })} placeholder="Subject" />
            </div>
            <button className="btn-primary" onClick={handleAdd}>Save</button>
            <button className="btn-secondary" onClick={() => { setAdding(false); setAddForm({ name: '', experience: 0, subject: '' }); }}>Cancel</button>
          </div>
        </div>
      )}

      {teachers.length === 0 && !adding && (
        <div className="panel-card" style={{ textAlign: 'center', color: '#90A4AE', padding: 32 }}>
          No teachers yet. Click "Add Teacher" to get started.
        </div>
      )}

      {teachers.map((teacher) => (
        <div key={teacher.id}>
          {editingId === teacher.id ? (
            <div className="panel-card" style={{ marginBottom: 12, border: '1px solid #90CAF9' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ fontSize: 12, color: '#546E7A', display: 'block', marginBottom: 4 }}>Name</label>
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#546E7A', display: 'block', marginBottom: 4 }}>Experience</label>
                  <input type="number" min={0} value={editForm.experience} onChange={(e) => setEditForm({ ...editForm, experience: Number(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#546E7A', display: 'block', marginBottom: 4 }}>Subject</label>
                  <input value={editForm.subject} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })} />
                </div>
                <button className="btn-primary" onClick={() => handleEditSave(teacher.id)}>Save</button>
                <button className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="panel-card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>{teacher.name}</div>
                  <div style={{ fontSize: 13, color: '#546E7A', marginTop: 4 }}>
                    <span style={{ background: '#E3F2FD', color: '#1565C0', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{teacher.subject}</span>
                    <span style={{ marginLeft: 8 }}>{teacher.experience} years experience</span>
                  </div>
                  {assignedCourses(teacher.id).length > 0 && (
                    <div style={{ marginTop: 6, fontSize: 12, color: '#78909C' }}>
                      Preferred for: {assignedCourses(teacher.id).map((c) => c.name).join(', ')}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-secondary" onClick={() => openSlotEditor(teacher)}>Set Available Time</button>
                  <button className="btn-secondary" onClick={() => handleEdit(teacher)}>Edit</button>
                  {deleteConfirmId === teacher.id ? (
                    <>
                      <button className="btn-danger" onClick={() => handleDelete(teacher.id)}>Confirm</button>
                      <button className="btn-secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                    </>
                  ) : (
                    <button className="btn-danger" onClick={() => setDeleteConfirmId(teacher.id)}>Delete</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {slotEditorId === teacher.id && (
            <div className="panel-card" style={{ marginBottom: 12, border: '1px solid #1565C0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1565C0' }}>Available Time - {teacher.name}</h3>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <select value={slotCopyDay} onChange={(e) => setSlotCopyDay(Number(e.target.value))} style={{ fontSize: 12, padding: '4px 8px' }}>
                    {DAYS.map((d, i) => (
                      <option key={i} value={i}>{d}</option>
                    ))}
                  </select>
                  <button className="btn-secondary" onClick={copyToAllDays} style={{ fontSize: 12, padding: '4px 8px' }}>Copy to All Days</button>
                  <button className="btn-primary" onClick={saveSlots} style={{ fontSize: 12, padding: '4px 10px' }}>Save</button>
                  <button className="btn-secondary" onClick={() => setSlotEditorId(null)} style={{ fontSize: 12, padding: '4px 8px' }}>Cancel</button>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
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
                        {DAYS.map((_, dayIndex) => (
                          <td key={dayIndex} style={{ padding: '2px 4px', textAlign: 'center', borderBottom: '1px solid #f5f5f5' }}>
                            <input
                              type="checkbox"
                              checked={slotGrid[dayIndex]?.[slotIndex] ?? false}
                              onChange={() => toggleSlot(dayIndex, slotIndex)}
                              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#1565C0' }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
