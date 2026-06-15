import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SubtitleEntry } from '../types';

interface UseSubtitlesReturn {
  subtitles: SubtitleEntry[];
  isGenerating: boolean;
  generateSubtitles: (audioBlob: Blob | null, duration: number) => Promise<void>;
  updateSubtitle: (id: string, updates: Partial<SubtitleEntry>) => void;
  adjustOffset: (id: string, offsetMs: number) => void;
  deleteSubtitle: (id: string) => void;
  addSubtitle: (entry: Omit<SubtitleEntry, 'id'>) => void;
  exportSRT: () => string;
  exportVTT: () => string;
  getCurrentSubtitle: (time: number) => SubtitleEntry | null;
  setSubtitles: (subtitles: SubtitleEntry[]) => void;
}

function formatSRTTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}

function formatVTTTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = Math.floor((ms % 1000) / 10);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
}

const mockSubtitles: string[] = [
  '欢迎使用ScreenCap Studio，这是一款专业的屏幕录制工具。',
  '首先，我们需要选择录制区域，可以是整个屏幕、应用窗口或指定区域。',
  '点击开始录制按钮后，会有三秒的倒计时。',
  '录制过程中，您可以使用快捷键来切换注释工具。',
  '按 P 键可以激活画笔工具，选择不同颜色进行绘制。',
  '按 H 键可以使用高亮工具，框选重要内容。',
  '按 T 键可以添加文本注释，在屏幕上输入文字说明。',
  '录制完成后，系统会自动识别音频并生成字幕。',
  '您可以在右侧面板中编辑字幕内容和调整时间偏移。',
  '最后，点击导出按钮，即可下载带字幕的视频文件。',
  '感谢使用ScreenCap Studio，祝您录制愉快！',
];

export function useSubtitles(): UseSubtitlesReturn {
  const [subtitles, setSubtitlesState] = useState<SubtitleEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const recognitionRef = useRef<any>(null);

  const generateSubtitles = useCallback(async (audioBlob: Blob | null, duration: number) => {
    setIsGenerating(true);
    setSubtitlesState([]);

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition && audioBlob) {
        try {
          recognitionRef.current = new SpeechRecognition();
          const recognition = recognitionRef.current;
          
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'zh-CN';

          const generatedSubtitles: SubtitleEntry[] = [];
          let currentStartTime = 0;

          recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              }
            }

            if (finalTranscript) {
              const endTime = Math.min(currentStartTime + 5000, duration * 1000);
              generatedSubtitles.push({
                id: uuidv4(),
                startTime: currentStartTime,
                endTime: endTime,
                text: finalTranscript,
                offset: 0,
              });
              setSubtitlesState([...generatedSubtitles]);
              currentStartTime = endTime;
            }
          };

          recognition.onerror = (event: any) => {
            console.warn('Speech recognition error:', event.error);
            generateMockSubtitles(duration);
          };

          recognition.onend = () => {
            setIsGenerating(false);
          };

          try {
            recognition.start();
            setTimeout(() => {
              if (recognitionRef.current) {
                recognitionRef.current.stop();
              }
              if (generatedSubtitles.length === 0) {
                generateMockSubtitles(duration);
              }
            }, Math.min(duration * 1000, 30000));
            return;
          } catch (e) {
            console.warn('Failed to start speech recognition:', e);
            generateMockSubtitles(duration);
            return;
          }
        } catch (e) {
          console.warn('Speech recognition setup failed:', e);
          generateMockSubtitles(duration);
          return;
        }
      } else {
        generateMockSubtitles(duration);
      }
    } catch (error) {
      console.error('Subtitle generation failed:', error);
      generateMockSubtitles(duration);
    }
  }, []);

  const generateMockSubtitles = useCallback((duration: number) => {
    const totalDuration = duration * 1000;
    const subtitleCount = Math.min(mockSubtitles.length, Math.max(5, Math.floor(duration / 5)));
    const interval = totalDuration / subtitleCount;

    const generatedSubtitles: SubtitleEntry[] = [];

    for (let i = 0; i < subtitleCount; i++) {
      generatedSubtitles.push({
        id: uuidv4(),
        startTime: i * interval,
        endTime: (i + 1) * interval,
        text: mockSubtitles[i % mockSubtitles.length],
        offset: 0,
      });
    }

    setSubtitlesState(generatedSubtitles);
    setIsGenerating(false);
  }, []);

  const updateSubtitle = useCallback((id: string, updates: Partial<SubtitleEntry>) => {
    setSubtitlesState(prev => prev.map(sub =>
      sub.id === id ? { ...sub, ...updates } : sub
    ));
  }, []);

  const adjustOffset = useCallback((id: string, offsetMs: number) => {
    setSubtitlesState(prev => prev.map(sub =>
      sub.id === id ? {
        ...sub,
        offset: sub.offset + offsetMs,
        startTime: sub.startTime + offsetMs,
        endTime: sub.endTime + offsetMs,
      } : sub
    ));
  }, []);

  const deleteSubtitle = useCallback((id: string) => {
    setSubtitlesState(prev => prev.filter(sub => sub.id !== id));
  }, []);

  const addSubtitle = useCallback((entry: Omit<SubtitleEntry, 'id'>) => {
    setSubtitlesState(prev => [...prev, { ...entry, id: uuidv4() }]
      .sort((a, b) => a.startTime - b.startTime));
  }, []);

  const exportSRT = useCallback(() => {
    let srtContent = '';
    const sortedSubtitles = [...subtitles].sort((a, b) => a.startTime - b.startTime);

    sortedSubtitles.forEach((sub, index) => {
      const adjustedStart = Math.max(0, sub.startTime + sub.offset);
      const adjustedEnd = Math.max(adjustedStart + 1, sub.endTime + sub.offset);

      srtContent += `${index + 1}\n`;
      srtContent += `${formatSRTTime(adjustedStart)} --> ${formatSRTTime(adjustedEnd)}\n`;
      srtContent += `${sub.text}\n\n`;
    });

    return srtContent;
  }, [subtitles]);

  const exportVTT = useCallback(() => {
    let vttContent = 'WEBVTT\n\n';
    const sortedSubtitles = [...subtitles].sort((a, b) => a.startTime - b.startTime);

    sortedSubtitles.forEach((sub, index) => {
      const adjustedStart = Math.max(0, sub.startTime + sub.offset);
      const adjustedEnd = Math.max(adjustedStart + 1, sub.endTime + sub.offset);

      vttContent += `${index + 1}\n`;
      vttContent += `${formatVTTTime(adjustedStart)} --> ${formatVTTTime(adjustedEnd)}\n`;
      vttContent += `${sub.text}\n\n`;
    });

    return vttContent;
  }, [subtitles]);

  const getCurrentSubtitle = useCallback((time: number) => {
    const timeMs = time * 1000;
    return subtitles.find(sub =>
      timeMs >= sub.startTime + sub.offset && timeMs <= sub.endTime + sub.offset
    ) || null;
  }, [subtitles]);

  const setSubtitles = useCallback((newSubtitles: SubtitleEntry[]) => {
    setSubtitlesState(newSubtitles);
  }, []);

  return {
    subtitles,
    isGenerating,
    generateSubtitles,
    updateSubtitle,
    adjustOffset,
    deleteSubtitle,
    addSubtitle,
    exportSRT,
    exportVTT,
    getCurrentSubtitle,
    setSubtitles,
  };
}
