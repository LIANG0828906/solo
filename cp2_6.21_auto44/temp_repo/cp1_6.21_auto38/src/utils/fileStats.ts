import { TechDebtItem, FileStats, SeverityLevel } from '@/types';

const severityOrder: SeverityLevel[] = ['low', 'medium', 'high', 'critical'];

export function calculateFileStats(items: TechDebtItem[]): FileStats[] {
  const fileMap = new Map<string, FileStats>();

  items.forEach((item) => {
    item.codeReferences.forEach((ref) => {
      const existing = fileMap.get(ref.filePath);
      if (existing) {
        existing.totalItems++;
        existing.totalHours += item.estimatedHours;
        const currentIndex = severityOrder.indexOf(existing.maxSeverity);
        const newIndex = severityOrder.indexOf(item.severity);
        if (newIndex > currentIndex) {
          existing.maxSeverity = item.severity;
        }
      } else {
        fileMap.set(ref.filePath, {
          filePath: ref.filePath,
          totalItems: 1,
          totalHours: item.estimatedHours,
          maxSeverity: item.severity,
        });
      }
    });
  });

  return Array.from(fileMap.values()).sort((a, b) => b.totalHours - a.totalHours);
}

export function getScoreColor(score: number): string {
  if (score >= 90) return '#4CAF50';
  if (score >= 70) return '#C0CA33';
  if (score >= 40) return '#FB8C00';
  return '#E53935';
}
