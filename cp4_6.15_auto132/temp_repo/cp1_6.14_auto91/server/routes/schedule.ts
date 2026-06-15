import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getCollection, addItem, updateItem, deleteItem, findItems } from '../db';

const router = express.Router();

function getWeekDates(weekStart: string): string[] {
  const dates: string[] = [];
  const start = new Date(weekStart);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

router.get('/', (req, res) => {
  try {
    const { fosterFamilyId, weekStart } = req.query;

    const tasks = getCollection('scheduleTasks');
    let filtered = tasks;

    if (fosterFamilyId) {
      filtered = filtered.filter((t: any) => t.fosterFamilyId === fosterFamilyId);
    }

    if (weekStart) {
      const weekDates = getWeekDates(weekStart as string);
      filtered = filtered.filter((t: any) => weekDates.includes(t.date));
    }

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { fosterFamilyId, petName, date, timeSlot, type, description } = req.body;

    if (!fosterFamilyId || !petName || !date || !timeSlot || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const task = {
      id: uuidv4(),
      fosterFamilyId,
      petName,
      date,
      timeSlot,
      type,
      description: description || '',
    };

    await addItem('scheduleTasks', task);
    res.json({ success: true, task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await updateItem('scheduleTasks', id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ success: true, task: updated });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteItem('scheduleTasks', id);
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
