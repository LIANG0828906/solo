import { v4 as uuidv4 } from 'uuid';
import { ScriptSegment, TimelineSegment, RhythmMetrics, AudioAnalysisResult, FILLER_WORDS } from '@/types';

export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法读取音频文件'));
    };
  });
};

const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const standardDeviation = (values: number[]): number => {
  if (values.length === 0) return 0;
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSqDiff = squaredDiffs.reduce((a, b) => a + b, 0) / n;
  return Math.sqrt(avgSqDiff);
};

export const analyzeAudio = (
  file: File,
  audioDuration: number,
  segments: ScriptSegment[]
): AudioAnalysisResult => {
  const seed = Math.floor(audioDuration * 1000) + file.name.length;
  const rand = seededRandom(seed);

  const sortedSegments = [...segments].sort((a, b) => a.order - b.order);
  const totalExpected = sortedSegments.reduce((sum, s) => sum + s.expectedDuration, 0);

  const timeline: TimelineSegment[] = [];
  let currentTime = 0;
  const actualDurations: number[] = [];

  sortedSegments.forEach((seg, index) => {
    const expectedRatio = totalExpected > 0 ? seg.expectedDuration / totalExpected : 1 / sortedSegments.length;
    const baseActual = audioDuration * expectedRatio;
    
    const variation = (rand() - 0.45) * 0.6;
    let actualDuration = Math.max(5, baseActual * (1 + variation));
    
    if (index === sortedSegments.length - 1) {
      actualDuration = Math.max(5, audioDuration - currentTime);
    }

    const deviation = actualDuration - seg.expectedDuration;
    const isOverBudget = deviation > seg.expectedDuration * 0.2;

    const endTime = Math.min(currentTime + actualDuration, audioDuration);
    
    timeline.push({
      id: uuidv4(),
      segmentId: seg.id,
      title: seg.title,
      startTime: currentTime,
      endTime: endTime,
      expectedDuration: seg.expectedDuration,
      actualDuration: actualDuration,
      isOverBudget,
      deviation: deviation,
    });

    actualDurations.push(actualDuration);
    currentTime = endTime;
  });

  const totalChars = sortedSegments.reduce((sum, s) => sum + s.content.length, 0);
  const speakingRate = totalChars > 0 
    ? Math.round((totalChars / (audioDuration / 60)) * (0.95 + rand() * 0.15))
    : Math.round(180 + rand() * 60);

  const stdDev = standardDeviation(actualDurations);
  const meanDuration = actualDurations.length > 0 
    ? actualDurations.reduce((a, b) => a + b, 0) / actualDurations.length 
    : 0;
  const cv = meanDuration > 0 ? stdDev / meanDuration : 1;
  const uniformity = Math.max(0, Math.min(100, Math.round((1 - Math.min(cv, 1)) * 100)));

  const totalMinutes = audioDuration / 60;
  const fillerWordCount = FILLER_WORDS.map(word => ({
    word,
    count: Math.floor(rand() * 8 * Math.max(1, totalMinutes / 5)),
  }));
  const totalFillers = fillerWordCount.reduce((sum, f) => sum + f.count, 0);
  const fillerFrequency = Math.round((totalFillers / Math.max(totalMinutes, 1)) * 10) / 10;

  const metrics: RhythmMetrics = {
    speakingRate,
    speakingRateRange: [180, 240],
    uniformity,
    uniformityRange: [70, 100],
    fillerFrequency,
    fillerFrequencyRange: [0, 4],
    fillerWordCount: fillerWordCount.filter(f => f.count > 0).sort((a, b) => b.count - a.count),
  };

  return {
    totalDuration: audioDuration,
    timeline,
    metrics,
  };
};

export const formatDuration = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatDurationLong = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '0秒';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}时${mins}分${secs}秒`;
  }
  if (mins > 0) {
    return `${mins}分${secs}秒`;
  }
  return `${secs}秒`;
};
