import type { Speaker, TranscriptResult } from '@/types';

const SPEAKER_STORAGE_KEY = 'transcript_speaker_data';

export interface SpeakerStorageData {
  speakerNames: Record<string, string>;
  speakerNotes: Record<string, string>;
}

export function loadSpeakerData(): SpeakerStorageData {
  try {
    const data = localStorage.getItem(SPEAKER_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load speaker data:', e);
  }
  return { speakerNames: {}, speakerNotes: {} };
}

export function saveSpeakerData(data: SpeakerStorageData): void {
  try {
    localStorage.setItem(SPEAKER_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save speaker data:', e);
  }
}

export function applySpeakerData(
  transcript: TranscriptResult,
  speakerData: SpeakerStorageData
): TranscriptResult {
  const speakers = transcript.speakers.map((speaker) => ({
    ...speaker,
    name: speakerData.speakerNames[speaker.id] || speaker.name,
    note: speakerData.speakerNotes[speaker.id] || '',
  }));
  return { ...transcript, speakers };
}
