import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface Marker {
  id: string;
  x: number;
  z: number;
  y: number;
  label: string;
  createdAt: string;
}

let markers: Marker[] = [];

router.get('/markers', (_req: Request, res: Response) => {
  res.json(markers);
});

router.post('/markers', (req: Request, res: Response) => {
  try {
    const { x, z, y, label } = req.body;
    
    if (typeof x !== 'number' || typeof z !== 'number' || typeof y !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates'
      });
    }
    
    const newMarker: Marker = {
      id: uuidv4(),
      x,
      z,
      y,
      label: label || '',
      createdAt: new Date().toISOString()
    };
    
    markers.push(newMarker);
    res.json(newMarker);
  } catch (error) {
    console.error('Create marker error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create marker'
    });
  }
});

router.delete('/markers/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const index = markers.findIndex(m => m.id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Marker not found'
      });
    }
    
    markers.splice(index, 1);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete marker error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete marker'
    });
  }
});

export default router;
