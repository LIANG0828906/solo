import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Comment {
  id: string;
  nickname: string;
  content: string;
  createdAt: number;
}

export interface AudioClip {
  id: string;
  title: string;
  tags: string[];
  audioUrl: string;
  blobData: string;
  duration: number;
  playCount: number;
  likeCount: number;
  isLiked: boolean;
  createdAt: number;
  waveformData: number[];
  comments: Comment[];
}

interface AudioState {
  audioList: AudioClip[];
  currentAudio: AudioClip | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  searchQuery: string;
  selectedTag: string | null;
  isRecording: boolean;
  recordingBlob: Blob | null;
  recordingDuration: number;
  recordingWaveform: number[];
  showComments: boolean;
  setAudioList: (list: AudioClip[]) => void;
  addAudio: (audio: Omit<AudioClip, 'id' | 'createdAt' | 'playCount' | 'likeCount' | 'isLiked' | 'comments'>) => void;
  playAudio: (audio: AudioClip) => void;
  togglePlay: () => void;
  updateTime: (time: number) => void;
  setVolume: (volume: number) => void;
  likeAudio: (audioId: string) => void;
  addComment: (audioId: string, content: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTag: (tag: string | null) => void;
  startRecording: () => void;
  stopRecording: (blob: Blob, duration: number, waveform: number[]) => void;
  clearRecording: () => void;
  setRecordingWaveform: (waveform: number[]) => void;
  setShowComments: (show: boolean) => void;
  getFilteredAudioList: () => AudioClip[];
  incrementPlayCount: (audioId: string) => void;
  stopPlayback: () => void;
}

const AVAILABLE_TAGS = ['雨声', '森林', '城市', '咖啡馆', '海洋', '夜晚'];

const generateMockData = (): AudioClip[] => {
  const mockTitles = [
    '城市雨夜的静谧',
    '森林深处的鸟鸣',
    '咖啡馆午后时光',
    '海浪拍打的节奏',
    '深夜街道的低语',
    '山间小溪的潺潺',
    '雷雨交加的夜晚',
    '清晨公园的宁静',
    '火车驶过的轰鸣',
    '篝火燃烧的温暖',
  ];

  return mockTitles.map((title, index) => {
    const tags = AVAILABLE_TAGS.sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2));
    const waveformData = Array.from({ length: 10 }, () => 0.3 + Math.random() * 0.7);
    
    return {
      id: uuidv4(),
      title,
      tags,
      audioUrl: '',
      blobData: '',
      duration: 30 + Math.floor(Math.random() * 120),
      playCount: Math.floor(Math.random() * 1000),
      likeCount: Math.floor(Math.random() * 500),
      isLiked: Math.random() > 0.7,
      createdAt: Date.now() - index * 86400000,
      waveformData,
      comments: [
        {
          id: uuidv4(),
          nickname: '用户' + Math.floor(Math.random() * 1000),
          content: '这个声音太治愈了！',
          createdAt: Date.now() - 3600000,
        },
        {
          id: uuidv4(),
          nickname: '旅行者',
          content: '让我想起了去年的旅行。',
          createdAt: Date.now() - 7200000,
        },
      ],
    };
  });
};

const serializeBlob = (blob: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      audioList: generateMockData(),
      currentAudio: null,
      isPlaying: false,
      currentTime: 0,
      volume: 0.8,
      searchQuery: '',
      selectedTag: null,
      isRecording: false,
      recordingBlob: null,
      recordingDuration: 0,
      recordingWaveform: Array(10).fill(0.3),
      showComments: false,

      setAudioList: (list) => set({ audioList: list }),

      addAudio: async (audio) => {
        const blob = new Blob([], { type: 'audio/webm' });
        const blobData = await serializeBlob(blob);
        
        const newAudio: AudioClip = {
          ...audio,
          id: uuidv4(),
          createdAt: Date.now(),
          playCount: 0,
          likeCount: 0,
          isLiked: false,
          comments: [],
          blobData,
        };
        
        set((state) => ({
          audioList: [newAudio, ...state.audioList],
        }));
      },

      playAudio: (audio) => {
        const state = get();
        if (state.currentAudio?.id === audio.id) {
          set({ isPlaying: !state.isPlaying });
        } else {
          set({ currentAudio: audio, isPlaying: true, currentTime: 0, showComments: false });
        }
      },

      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

      updateTime: (time) => set({ currentTime: time }),

      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

      likeAudio: (audioId) => {
        set((state) => ({
          audioList: state.audioList.map((audio) => {
            if (audio.id === audioId) {
              return {
                ...audio,
                isLiked: !audio.isLiked,
                likeCount: audio.isLiked ? audio.likeCount - 1 : audio.likeCount + 1,
              };
            }
            return audio;
          }),
          currentAudio:
            state.currentAudio?.id === audioId
              ? {
                  ...state.currentAudio,
                  isLiked: !state.currentAudio.isLiked,
                  likeCount: state.currentAudio.isLiked
                    ? state.currentAudio.likeCount - 1
                    : state.currentAudio.likeCount + 1,
                }
              : state.currentAudio,
        }));
      },

      addComment: (audioId, content) => {
        const comment: Comment = {
          id: uuidv4(),
          nickname: '匿名用户',
          content,
          createdAt: Date.now(),
        };

        set((state) => ({
          audioList: state.audioList.map((audio) => {
            if (audio.id === audioId) {
              return {
                ...audio,
                comments: [comment, ...audio.comments],
              };
            }
            return audio;
          }),
          currentAudio:
            state.currentAudio?.id === audioId
              ? {
                  ...state.currentAudio,
                  comments: [comment, ...state.currentAudio.comments],
                }
              : state.currentAudio,
        }));
      },

      setSearchQuery: (query) => set({ searchQuery: query }),

      setSelectedTag: (tag) => set({ selectedTag: tag }),

      startRecording: () => set({ isRecording: true, recordingDuration: 0, recordingBlob: null }),

      stopRecording: (blob, duration, waveform) => {
        set({
          isRecording: false,
          recordingBlob: blob,
          recordingDuration: duration,
          recordingWaveform: waveform,
        });
      },

      clearRecording: () => {
        set({
          isRecording: false,
          recordingBlob: null,
          recordingDuration: 0,
          recordingWaveform: Array(10).fill(0.3),
        });
      },

      setRecordingWaveform: (waveform) => set({ recordingWaveform: waveform }),

      setShowComments: (show) => set({ showComments: show }),

      getFilteredAudioList: () => {
        const { audioList, searchQuery, selectedTag } = get();
        return audioList.filter((audio) => {
          const matchesSearch =
            searchQuery === '' ||
            audio.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            audio.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
          const matchesTag = selectedTag === null || audio.tags.includes(selectedTag);
          return matchesSearch && matchesTag;
        });
      },

      incrementPlayCount: (audioId) => {
        set((state) => ({
          audioList: state.audioList.map((audio) =>
            audio.id === audioId ? { ...audio, playCount: audio.playCount + 1 } : audio
          ),
        }));
      },

      stopPlayback: () => {
        set({ currentAudio: null, isPlaying: false, currentTime: 0, showComments: false });
      },
    }),
    {
      name: 'soundscape-audio-store',
      partialize: (state) => ({
        audioList: state.audioList.map((audio) => ({
          ...audio,
          audioUrl: '',
        })),
        volume: state.volume,
      }),
    }
  )
);
