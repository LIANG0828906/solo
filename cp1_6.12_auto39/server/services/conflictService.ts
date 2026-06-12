import { areIntervalsOverlapping } from 'date-fns';
import type { Reservation, ConflictItem, EquipmentType, TimeRange } from '../types';
import { equipmentLimits, getEquipmentName, getEquipmentLimit } from '../data/mockData';

export const checkConflicts = (
  newReservation: TimeRange & { equipmentType: EquipmentType },
  existingReservations: Reservation[],
  excludeReservationId?: string
): ConflictItem[] => {
  const conflicts: ConflictItem[] = [];
  const { start, end, equipmentType } = newReservation;

  const overlappingReservations = existingReservations.filter(res => {
    if (excludeReservationId && res.id === excludeReservationId) {
      return false;
    }
    return areIntervalsOverlapping(
      { start, end },
      { start: res.startTime, end: res.endTime }
    );
  });

  const equipmentCount: Record<EquipmentType, number> = {
    oven: 0,
    stove: 0,
    microwave: 0,
    riceCooker: 0,
    blender: 0,
  };

  const equipmentReservations: Record<EquipmentType, string[]> = {
    oven: [],
    stove: [],
    microwave: [],
    riceCooker: [],
    blender: [],
  };

  overlappingReservations.forEach(res => {
    equipmentCount[res.equipmentType]++;
    equipmentReservations[res.equipmentType].push(res.id);
  });

  const requestedEquipmentType = equipmentType;
  const currentCount = equipmentCount[requestedEquipmentType];
  const maxCount = getEquipmentLimit(requestedEquipmentType);
  const newCount = currentCount + 1;

  if (newCount > maxCount) {
    conflicts.push({
      equipmentType: requestedEquipmentType,
      equipmentName: getEquipmentName(requestedEquipmentType),
      requestedCount: newCount,
      currentCount,
      maxCount,
      conflictingReservations: equipmentReservations[requestedEquipmentType],
    });
  }

  return conflicts;
};

export const checkConflictsForAllEquipment = (
  timeRange: TimeRange,
  existingReservations: Reservation[],
  excludeReservationId?: string
): ConflictItem[] => {
  const conflicts: ConflictItem[] = [];
  const { start, end } = timeRange;

  const overlappingReservations = existingReservations.filter(res => {
    if (excludeReservationId && res.id === excludeReservationId) {
      return false;
    }
    return areIntervalsOverlapping(
      { start, end },
      { start: res.startTime, end: res.endTime }
    );
  });

  const equipmentCount: Record<EquipmentType, number> = {
    oven: 0,
    stove: 0,
    microwave: 0,
    riceCooker: 0,
    blender: 0,
  };

  const equipmentReservations: Record<EquipmentType, string[]> = {
    oven: [],
    stove: [],
    microwave: [],
    riceCooker: [],
    blender: [],
  };

  overlappingReservations.forEach(res => {
    equipmentCount[res.equipmentType]++;
    equipmentReservations[res.equipmentType].push(res.id);
  });

  equipmentLimits.forEach(limit => {
    const currentCount = equipmentCount[limit.type];
    if (currentCount >= limit.maxCount) {
      conflicts.push({
        equipmentType: limit.type,
        equipmentName: limit.name,
        requestedCount: currentCount + 1,
        currentCount,
        maxCount: limit.maxCount,
        conflictingReservations: equipmentReservations[limit.type],
      });
    }
  });

  return conflicts;
};
