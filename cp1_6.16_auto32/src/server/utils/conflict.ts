import { Schedule, ConflictInfo } from '../types/index.js';

export function checkTimeConflict(
  schedules: Schedule[],
  stage: string,
  startTime: string,
  endTime: string,
  excludeId?: string
): ConflictInfo | null {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  for (const schedule of schedules) {
    if (schedule.stage !== stage) continue;
    if (excludeId && schedule.id === excludeId) continue;

    const sStart = new Date(schedule.startTime).getTime();
    const sEnd = new Date(schedule.endTime).getTime();

    if (start < sEnd && end > sStart) {
      return {
        stage: schedule.stage,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        bandName: schedule.bandName
      };
    }
  }

  return null;
}

export function formatConflictMessage(conflict: ConflictInfo): string {
  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return `${conflict.stage} ${formatTime(conflict.startTime)}-${formatTime(conflict.endTime)} 已被乐队${conflict.bandName}占用`;
}
