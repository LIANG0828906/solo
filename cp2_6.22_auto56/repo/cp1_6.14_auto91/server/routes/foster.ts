import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getCollection, addItem } from '../db';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const families = getCollection('fosterFamilies');
    res.json(families);
  } catch (error) {
    console.error('Error fetching foster families:', error);
    res.status(500).json({ error: 'Failed to fetch foster families' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const families = getCollection('fosterFamilies');
    const family = families.find((f: any) => f.id === id);
    if (!family) {
      return res.status(404).json({ error: 'Foster family not found' });
    }
    res.json(family);
  } catch (error) {
    console.error('Error fetching foster family:', error);
    res.status(500).json({ error: 'Failed to fetch foster family' });
  }
});

router.post('/apply', async (req, res) => {
  try {
    const { familyId, ownerName, petName, petType, startDate, endDate } = req.body;

    if (!familyId || !ownerName || !petName || !petType || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const application = {
      id: uuidv4(),
      familyId,
      ownerName,
      petName,
      petType,
      startDate,
      endDate,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    await addItem('applications', application);
    res.json({ success: true, application });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

export default router;
