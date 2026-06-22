import { Contract, Song, SongAllocation, SongSummary } from '../types';

export function calculateWeights(
  songs: Song[],
  playCountWeight: number,
  durationWeight: number
): number[] {
  if (songs.length === 0) return [];

  const totalPlayCount = songs.reduce((sum, s) => sum + s.playCount, 0);
  const totalDuration = songs.reduce((sum, s) => sum + s.duration, 0);

  const weights = songs.map((song) => {
    const playRatio = totalPlayCount > 0 ? song.playCount / totalPlayCount : 0;
    const durationRatio = totalDuration > 0 ? song.duration / totalDuration : 0;
    return playRatio * playCountWeight + durationRatio * durationWeight;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) {
    return songs.map(() => 1 / songs.length);
  }

  return weights.map((w) => w / totalWeight);
}

export function calculateSongAllocations(
  contract: Contract,
  playCountWeight: number = 0.5,
  durationWeight: number = 0.5
): SongAllocation[] {
  if (contract.songs.length === 0) return [];

  const netRevenue = contract.fee * (contract.splitRatio / 100);
  const weights = calculateWeights(contract.songs, playCountWeight, durationWeight);

  return contract.songs.map((song, index) => {
    const weight = weights[index];
    const revenue = netRevenue * weight;
    const percentage = weight * 100;
    return { song, revenue, weight, percentage };
  });
}

export function calculateRevenueReport(
  contracts: Contract[],
  playCountWeight: number = 0.5,
  durationWeight: number = 0.5
): SongSummary[] {
  const songMap = new Map<string, SongSummary>();

  contracts.forEach((contract) => {
    const allocations = calculateSongAllocations(
      contract,
      playCountWeight,
      durationWeight
    );

    allocations.forEach(({ song, revenue }) => {
      const existing = songMap.get(song.id);
      if (existing) {
        existing.totalRevenue += revenue;
        existing.totalPlayCount += song.playCount;
        existing.totalDuration += song.duration;
        existing.performanceCount += 1;
      } else {
        songMap.set(song.id, {
          songId: song.id,
          songName: song.name,
          totalRevenue: revenue,
          totalPlayCount: song.playCount,
          totalDuration: song.duration,
          performanceCount: 1,
        });
      }
    });
  });

  return Array.from(songMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export function formatCurrency(amount: number): string {
  return '¥' + amount.toFixed(2);
}

export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

export function generateReportCSV(summaries: SongSummary[]): string {
  const headers = ['歌曲名称', '版税总收入(元)', '总播放次数', '总时长(秒)', '演出场次'];
  const rows = summaries.map((s) => [
    s.songName,
    s.totalRevenue.toFixed(2),
    s.totalPlayCount.toString(),
    s.totalDuration.toString(),
    s.performanceCount.toString(),
  ]);

  const csvContent =
    '\uFEFF' +
    [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

  return csvContent;
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
