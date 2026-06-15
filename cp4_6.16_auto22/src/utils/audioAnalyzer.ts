import { v4 as uuidv4 } from 'uuid';
import { 
  ScriptSegment, 
  TimelineSegment, 
  RhythmMetrics, 
  AudioAnalysisResult, 
  FILLER_WORDS,
  SilenceDetectionOptions,
  SilenceSegment,
} from '@/types';

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

export const detectSilenceMock = (
  audioDuration: number,
  options?: SilenceDetectionOptions
): SilenceSegment[] => {
  const minSilenceDuration = options?.minSilenceDuration ?? 1.5;
  const seed = Math.floor(audioDuration * 1000);
  const rand = seededRandom(seed);

  const segments: SilenceSegment[] = [];
  let currentTime = 0;
  let isSpeech = true;

  while (currentTime < audioDuration) {
    if (isSpeech) {
      const speechDuration = 10 + rand() * 50;
      const end = Math.min(currentTime + speechDuration, audioDuration);
      segments.push({
        start: currentTime,
        end,
        duration: end - currentTime,
        type: 'speech',
      });
      currentTime = end;
    } else {
      const silenceDuration = 0.5 + rand() * 2.5;
      const end = Math.min(currentTime + silenceDuration, audioDuration);
      const actualDuration = end - currentTime;
      
      if (actualDuration > 0) {
        segments.push({
          start: currentTime,
          end,
          duration: actualDuration,
          type: 'silence',
        });
        currentTime = end;
      }
    }
    isSpeech = !isSpeech;
  }

  if (segments.length > 0 && segments[segments.length - 1].type === 'silence') {
    const lastSilence = segments[segments.length - 1];
    if (lastSilence.duration < minSilenceDuration * 0.5) {
      segments.pop();
      if (segments.length > 0) {
        const lastSpeech = segments[segments.length - 1];
        lastSpeech.end = audioDuration;
        lastSpeech.duration = audioDuration - lastSpeech.start;
      }
    }
  }

  return segments;
};

export const analyzeAudio = (
  file: File,
  audioDuration: number,
  segments: ScriptSegment[],
  options?: SilenceDetectionOptions
): AudioAnalysisResult => {
  const mode = options?.mode ?? 'hybrid';
  const seed = Math.floor(audioDuration * 1000) + file.name.length;
  const rand = seededRandom(seed);

  const sortedSegments = [...segments].sort((a, b) => a.order - b.order);
  const totalExpected = sortedSegments.reduce((sum, s) => sum + s.expectedDuration, 0);
  const segmentCount = options?.segmentCount ?? sortedSegments.length;

  const timeline: TimelineSegment[] = [];
  let currentTime = 0;
  const actualDurations: number[] = [];

  const silenceSegments = mode !== 'interval' 
    ? detectSilenceMock(audioDuration, options).filter(s => s.type === 'silence')
    : [];

  const calculateSplitPoints = (): number[] => {
    if (mode === 'interval') {
      const interval = audioDuration / segmentCount;
      return Array.from({ length: segmentCount - 1 }, (_, i) => (i + 1) * interval);
    }

    if (mode === 'silence') {
      const validSilences = silenceSegments.filter(s => 
        s.duration >= (options?.minSilenceDuration ?? 1.5)
      );
      const targetSplits = sortedSegments.length - 1;
      
      if (validSilences.length <= targetSplits) {
        return validSilences.map(s => s.start + s.duration / 2);
      }

      const step = validSilences.length / targetSplits;
      const selected: number[] = [];
      for (let i = 0; i < targetSplits; i++) {
        const idx = Math.floor((i + 0.5) * step);
        const silence = validSilences[Math.min(idx, validSilences.length - 1)];
        selected.push(silence.start + silence.duration / 2);
      }
      return selected.sort((a, b) => a - b);
    }

    const expectedSplitPoints: number[] = [];
    let expectedTime = 0;
    for (let i = 0; i < sortedSegments.length - 1; i++) {
      const ratio = totalExpected > 0 
        ? sortedSegments[i].expectedDuration / totalExpected 
        : 1 / sortedSegments.length;
      expectedTime += audioDuration * ratio;
      expectedSplitPoints.push(expectedTime);
    }

    const hybridPoints: number[] = [];
    for (const expectedPoint of expectedSplitPoints) {
      let bestSilence = silenceSegments[0];
      let bestDist = Infinity;
      
      for (const silence of silenceSegments) {
        const silenceMid = silence.start + silence.duration / 2;
        const dist = Math.abs(silenceMid - expectedPoint);
        if (dist < bestDist && silence.duration >= (options?.minSilenceDuration ?? 1.5) * 0.5) {
          bestDist = dist;
          bestSilence = silence;
        }
      }

      if (bestSilence && bestDist < audioDuration * 0.15) {
        hybridPoints.push(bestSilence.start + bestSilence.duration / 2);
      } else {
        hybridPoints.push(expectedPoint);
      }
    }

    return hybridPoints.sort((a, b) => a - b);
  };

  const splitPoints = calculateSplitPoints();

  sortedSegments.forEach((seg, index) => {
    let endTime: number;
    
    if (index < splitPoints.length) {
      endTime = splitPoints[index];
    } else {
      endTime = audioDuration;
    }

    const actualDuration = endTime - currentTime;
    const deviation = actualDuration - seg.expectedDuration;
    const isOverBudget = deviation > seg.expectedDuration * 0.2;

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
