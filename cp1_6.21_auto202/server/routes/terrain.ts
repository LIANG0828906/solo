import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

function generateHeightmap(size: number): number[][] {
  const heightmap: number[][] = [];
  for (let i = 0; i < size; i++) {
    const row: number[] = [];
    for (let j = 0; j < size; j++) {
      const nx = i / size - 0.5;
      const nz = j / size - 0.5;
      const elevation = 
        Math.sin(nx * 6.28) * Math.cos(nz * 6.28) * 3 +
        Math.sin(nx * 12.56 + 1.5) * Math.cos(nz * 12.56 + 0.8) * 1.5 +
        Math.sin(nx * 3.14 + nz * 3.14) * 2;
      const height = 8 + elevation + Math.random() * 0.5;
      row.push(Math.max(2, Math.min(15, height)));
    }
    heightmap.push(row);
  }
  return heightmap;
}

router.get('/terrain', (_req: Request, res: Response) => {
  const heightmap = generateHeightmap(64);
  
  const terrainData = {
    heightmap,
    layerBoundaries: [8, 6, 4],
    faultLines: [
      {
        id: 'fault-1',
        start: { x: 5, z: 10 },
        end: { x: 55, z: 50 },
        width: 0.3
      },
      {
        id: 'fault-2',
        start: { x: 10, z: 50 },
        end: { x: 50, z: 8 },
        width: 0.3
      }
    ]
  };
  
  res.json(terrainData);
});

router.post('/terrain/save', (req: Request, res: Response) => {
  try {
    const { excavatedFaces, excavatedAt } = req.body;
    const savedId = uuidv4();
    const saveData = {
      id: savedId,
      excavatedFaces,
      excavatedAt: excavatedAt || new Date().toISOString()
    };
    
    const saveDir = path.join(process.cwd(), 'server', 'saves');
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(saveDir, `terrain-${savedId}.json`),
      JSON.stringify(saveData, null, 2)
    );
    
    res.json({
      success: true,
      savedId
    });
  } catch (error) {
    console.error('Save terrain error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save terrain state'
    });
  }
});

export default router;
