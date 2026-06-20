import { EIGHTEEN_INCOMPATIBILITIES, NINETEEN_MUTUAL_FEAR } from '../../server/data/medicines';
import type { Medicine, CompatibilityConflict } from '../types';

export const checkCompatibility = (medicines: Medicine[]): CompatibilityConflict[] => {
  const conflicts: CompatibilityConflict[] = [];
  const medicineNames = medicines.map(m => m.name);

  for (const rule of EIGHTEEN_INCOMPATIBILITIES) {
    const found = rule.herbs.filter(h => medicineNames.includes(h));
    if (found.length >= 2) {
      const conflictMedicines = medicines.filter(m => rule.herbs.includes(m.name));
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
      const conflictMedicines = medicines.filter(m => rule.herbs.includes(m.name));
      conflicts.push({
        medicineIds: conflictMedicines.map(m => m.id),
        medicineNames: conflictMedicines.map(m => m.name),
        type: '十九畏',
        description: rule.description
      });
    }
  }

  return conflicts;
};

export const hasConflicts = (medicineId: string, allMedicines: Medicine[]): { hasConflict: boolean; conflictInfo?: string; conflictType?: '十八反' | '十九畏' } => {
  const medicine = allMedicines.find(m => m.id === medicineId);
  if (!medicine) return { hasConflict: false };

  const otherMedicines = allMedicines.filter(m => m.id !== medicineId);
  const conflicts = checkCompatibility([medicine, ...otherMedicines]);

  if (conflicts.length > 0) {
    const relevantConflict = conflicts.find(c => c.medicineIds.includes(medicineId));
    if (relevantConflict) {
      return {
        hasConflict: true,
        conflictInfo: `${relevantConflict.type}：${relevantConflict.description}`,
        conflictType: relevantConflict.type
      };
    }
  }

  return { hasConflict: false };
};
