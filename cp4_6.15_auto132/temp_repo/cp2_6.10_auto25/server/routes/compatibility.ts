import express from 'express';
import { medicines, EIGHTEEN_INCOMPATIBILITIES, NINETEEN_MUTUAL_FEAR } from '../data/medicines';
import type { CompatibilityCheckRequest, CompatibilityCheckResponse, CompatibilityConflict } from '../../src/types';

const router = express.Router();

router.post('/check', (req, res) => {
  const { medicineIds } = req.body as CompatibilityCheckRequest;
  
  if (!medicineIds || !Array.isArray(medicineIds)) {
    return res.status(400).json({ error: '参数错误' });
  }

  const foundMedicines = medicines.filter(m => medicineIds.includes(m.id));
  const medicineNames = foundMedicines.map(m => m.name);
  const conflicts: CompatibilityConflict[] = [];

  for (const rule of EIGHTEEN_INCOMPATIBILITIES) {
    const found = rule.herbs.filter(h => medicineNames.includes(h));
    if (found.length >= 2) {
      const conflictMedicines = foundMedicines.filter(m => rule.herbs.includes(m.name));
      conflicts.push({
        medicineIds: conflictMedicines.map(m => m.id),
        medicineNames: conflictMedicines.map(m => m.name),
        type: '十八反',
        description: rule.description
      });
    }
  }

  for (const rule of NINETEEN_MUTUAL_FEAR) {
    const found = rule.herbs.filter(h => medicineNames.includes(h));
    if (found.length >= 2) {
      const conflictMedicines = foundMedicines.filter(m => rule.herbs.includes(m.name));
      conflicts.push({
        medicineIds: conflictMedicines.map(m => m.id),
        medicineNames: conflictMedicines.map(m => m.name),
        type: '十九畏',
        description: rule.description
      });
    }
  }

  const response: CompatibilityCheckResponse = { conflicts };
  res.json(response);
});

export default router;
