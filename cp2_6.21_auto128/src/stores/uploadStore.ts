import { create } from 'zustand';
import type { UploadStatus, TranscriptResult, Speaker } from '@/types';
import { mockUpload, mockTranscribe } from '@/utils/mockApi';
import { loadSpeakerData, saveSpeakerData, applySpeakerData } from '@/utils/storage';

interface UploadState {
  status: UploadStatus;
  uploadProgress: number;
  transcribeProgress: number;
  transcript: TranscriptResult | null;
  fileName: string;
  error: string | null;

  uploadFile: (file: File) => Promise<void>;
  loadDemoData: () => Promise<void>;
  reset: () => void;
  renameSpeaker: (speakerId: string, newName: string) => void;
  setSpeakerNote: (speakerId: string, note: string) => void;
  getSpeakerById: (speakerId: string) => Speaker | undefined;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  status: 'idle',
  uploadProgress: 0,
  transcribeProgress: 0,
  transcript: null,
  fileName: '',
  error: null,

  uploadFile: async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      set({ error: '文件大小不能超过50MB', status: 'error' });
      return;
    }

    set({ status: 'uploading', uploadProgress: 0, fileName: file.name, error: null });

    try {
      const taskId = await mockUpload(file, (progress) => {
        set({ uploadProgress: progress });
      });

      set({ status: 'transcribing', transcribeProgress: 0 });

      const result = await mockTranscribe(taskId, (progress) => {
        set({ transcribeProgress: progress });
      });

      const speakerData = loadSpeakerData();
      const transcriptWithData = applySpeakerData(result, speakerData);

      set({ transcript: transcriptWithData, status: 'completed' });
    } catch (e) {
      set({ error: '转写失败，请重试', status: 'error' });
    }
  },

  loadDemoData: async () => {
    set({
      status: 'transcribing',
      uploadProgress: 100,
      transcribeProgress: 0,
      fileName: '示例会议录音.mp3',
      error: null,
    });

    try {
      const result = await mockTranscribe('demo-task', (progress) => {
        set({ transcribeProgress: progress });
      });

      const speakerData = loadSpeakerData();
      const transcriptWithData = applySpeakerData(result, speakerData);

      set({ transcript: transcriptWithData, status: 'completed' });
    } catch (e) {
      set({ error: '加载示例数据失败', status: 'error' });
    }
  },

  reset: () => {
    set({
      status: 'idle',
      uploadProgress: 0,
      transcribeProgress: 0,
      transcript: null,
      fileName: '',
      error: null,
    });
  },

  renameSpeaker: (speakerId: string, newName: string) => {
    const { transcript } = get();
    if (!transcript) return;

    const speakerData = loadSpeakerData();
    speakerData.speakerNames[speakerId] = newName;
    saveSpeakerData(speakerData);

    const speakers = transcript.speakers.map((s) =>
      s.id === speakerId ? { ...s, name: newName } : s
    );
    set({ transcript: { ...transcript, speakers } });
  },

  setSpeakerNote: (speakerId: string, note: string) => {
    const { transcript } = get();
    if (!transcript) return;

    const speakerData = loadSpeakerData();
    speakerData.speakerNotes[speakerId] = note;
    saveSpeakerData(speakerData);

    const speakers = transcript.speakers.map((s) =>
      s.id === speakerId ? { ...s, note } : s
    );
    set({ transcript: { ...transcript, speakers } });
  },

  getSpeakerById: (speakerId: string) => {
    const { transcript } = get();
    return transcript?.speakers.find((s) => s.id === speakerId);
  },
}));
