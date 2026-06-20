import { get, set, del, keys, values } from 'idb-keyval';
import type { ReadingGoal, ReadingRecord, Note } from '@/types';

const DB_PREFIX = 'reading_tracker_';

export const db = {
  async getGoals(): Promise<ReadingGoal[]> {
    const goalKeys = await keys();
    const goalIds = goalKeys
      .filter((k) => k.toString().startsWith(`${DB_PREFIX}goal_`))
      .map((k) => k.toString());
    const goals: ReadingGoal[] = [];
    for (const id of goalIds) {
      const goal = await get(id);
      if (goal) goals.push(goal);
    }
    return goals.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async saveGoal(goal: ReadingGoal): Promise<void> {
    await set(`${DB_PREFIX}goal_${goal.id}`, goal);
  },

  async deleteGoal(goalId: string): Promise<void> {
    await del(`${DB_PREFIX}goal_${goalId}`);
    const records = await this.getRecords(goalId);
    for (const record of records) {
      await del(`${DB_PREFIX}record_${record.id}`);
    }
    const notes = await this.getNotes(goalId);
    for (const note of notes) {
      await del(`${DB_PREFIX}note_${note.id}`);
    }
  },

  async getRecords(goalId?: string): Promise<ReadingRecord[]> {
    const allKeys = await keys();
    const recordKeys = allKeys
      .filter((k) => k.toString().startsWith(`${DB_PREFIX}record_`))
      .map((k) => k.toString());
    const records: ReadingRecord[] = [];
    for (const id of recordKeys) {
      const record = await get(id);
      if (record && (!goalId || record.goalId === goalId)) {
        records.push(record);
      }
    }
    return records.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  async saveRecord(record: ReadingRecord): Promise<void> {
    await set(`${DB_PREFIX}record_${record.id}`, record);
  },

  async deleteRecord(recordId: string): Promise<void> {
    await del(`${DB_PREFIX}record_${recordId}`);
  },

  async getNotes(goalId?: string): Promise<Note[]> {
    const allKeys = await keys();
    const noteKeys = allKeys
      .filter((k) => k.toString().startsWith(`${DB_PREFIX}note_`))
      .map((k) => k.toString());
    const notes: Note[] = [];
    for (const id of noteKeys) {
      const note = await get(id);
      if (note && (!goalId || note.goalId === goalId)) {
        notes.push(note);
      }
    }
    return notes;
  },

  async saveNote(note: Note): Promise<void> {
    await set(`${DB_PREFIX}note_${note.id}`, note);
  },

  async deleteNote(noteId: string): Promise<void> {
    await del(`${DB_PREFIX}note_${noteId}`);
  },

  async getAll(): Promise<{
    goals: ReadingGoal[];
    records: ReadingRecord[];
    notes: Note[];
  }> {
    const allValues = await values();
    const goals: ReadingGoal[] = [];
    const records: ReadingRecord[] = [];
    const notes: Note[] = [];

    for (const value of allValues) {
      if (value && 'category' in value && 'totalPages' in value) {
        goals.push(value);
      } else if (value && 'duration' in value && 'mood' in value) {
        records.push(value);
      } else if (value && 'highlightText' in value && 'annotation' in value) {
        notes.push(value);
      }
    }

    return {
      goals: goals.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      records: records.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
      notes,
    };
  },
};
