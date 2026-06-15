import { useState, useCallback } from 'react';
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

const fallbackSentences = [
  '欢迎使用ScreenCap Studio屏幕录制工具。',
  '首先，请选择您希望录制的屏幕区域。',
  '您可以录制整个屏幕、特定窗口或自定义区域。',
  '点击开始按钮后，会有三秒钟的准备时间。',
  '录制过程中可以随时使用画笔工具标注重点。',
  '按键盘上的P键可以快速切换到画笔模式。',
  '按H键可以使用高亮工具框选重要内容。',
  '按T键可以在屏幕上添加文本注释。',
  '使用Ctrl+Z快捷键可以撤销上一步注释操作。',
  '录制完成后系统会自动识别音频并生成字幕。',
  '您可以在右侧面板中编辑字幕的时间和内容。',
  '调整时间偏移可以让字幕与视频完美同步。',
  '最后点击导出按钮，即可下载完整的教程视频。',
  '感谢使用ScreenCap Studio，祝您录制顺利！',
];

export function useSubtitles(): UseSubtitlesReturn {
  const [subtitles, setSubtitlesState] = useState<SubtitleEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateFromFallback = useCallback((duration: number) => {
    const totalDurationMs = duration * 1000;
    if (totalDurationMs <= 0) {
      setTimeout(() => {
        setSubtitlesState([]);
        setIsGenerating(false);
      }, 500);
      return;
    }

    const count = Math.min(fallbackSentences.length, Math.max(3, Math.floor(duration / 4)));
    const perDuration = totalDurationMs / count;
    const result: SubtitleEntry[] = [];

    for (let i = 0; i < count; i++) {
      result.push({
        id: uuidv4(),
        startTime: i * perDuration,
        endTime: (i + 1) * perDuration,
        text: fallbackSentences[i],
        offset: 0,
      });
    }

    setTimeout(() => {
      setSubtitlesState(result);
      setIsGenerating(false);
    }, 800);
  }, []);

  const generateSubtitles = useCallback(async (audioBlob: Blob | null, duration: number) => {
    setIsGenerating(true);
    setSubtitlesState([]);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported, using fallback subtitles');
      generateFromFallback(duration);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';
      recognition.maxAlternatives = 1;

      const results: Array<{ text: string; startTime: number; endTime: number }> = [];
      let sentenceStart = 0;
      const recognitionStartTime = Date.now();

      recognition.onresult = (event: any) => {
        const now = Date.now();
        const elapsed = now - recognitionStartTime;
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          }
        }

        if (finalText.trim()) {
          const sentences = finalText
            .split(/[。！？.!?\n]+/)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);

          for (let i = 0; i < sentences.length; i++) {
            const sentenceDuration = Math.max(2000, Math.min(6000, sentences[i].length * 250));
            const start = sentenceStart;
            const end = Math.min(elapsed, start + sentenceDuration);

            if (end > start && sentences[i].length > 0) {
              results.push({
                text: sentences[i],
                startTime: start,
                endTime: end,
              });
            }
            sentenceStart = end;
          }

          const subtitleEntries: SubtitleEntry[] = results.map((r) => ({
            id: uuidv4(),
            startTime: r.startTime,
            endTime: r.endTime,
            text: r.text,
            offset: 0,
          }));

          setSubtitlesState(subtitleEntries);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        try {
          recognition.stop();
        } catch (e) {
          // ignore
        }
        if (results.length === 0) {
          generateFromFallback(duration);
        } else {
          setIsGenerating(false);
        }
      };

      recognition.onend = () => {
        if (results.length === 0) {
          generateFromFallback(duration);
        } else {
          setIsGenerating(false);
        }
      };

      try {
        recognition.start();
        const timeoutMs = Math.min(Math.max(duration * 1000, 3000), 20000);
        setTimeout(() => {
          try {
            recognition.stop();
          } catch (e) {
            // ignore
          }
        }, timeoutMs);
      } catch (startError) {
        console.warn('Failed to start speech recognition:', startError);
        generateFromFallback(duration);
      }
    } catch (error) {
      console.error('Subtitle generation error:', error);
      generateFromFallback(duration);
    }
  }, [generateFromFallback]);

  const updateSubtitle = useCallback((id: string, updates: Partial<SubtitleEntry>) => {
    setSubtitlesState((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub))
    );
  }, []);

  const adjustOffset = useCallback((id: string, offsetMs: number) => {
    setSubtitlesState((prev) =>
      prev.map((sub) =>
        sub.id === id
          ? {
              ...sub,
              offset: sub.offset + offsetMs,
              startTime: Math.max(0, sub.startTime + offsetMs),
              endTime: Math.max(sub.startTime + offsetMs + 1, sub.endTime + offsetMs),
            }
          : sub
      )
    );
  }, []);

  const deleteSubtitle = useCallback((id: string) => {
    setSubtitlesState((prev) => prev.filter((sub) => sub.id !== id));
  }, []);

  const addSubtitle = useCallback((entry: Omit<SubtitleEntry, 'id'>) => {
    setSubtitlesState((prev) =>
      [...prev, { ...entry, id: uuidv4() }].sort((a, b) => a.startTime - b.startTime)
    );
  }, []);

  const exportSRT = useCallback(() => {
    const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
    if (sorted.length === 0) return '';

    let content = '';
    sorted.forEach((sub, idx) => {
      const start = Math.max(0, sub.startTime + sub.offset);
      const end = Math.max(start + 1, sub.endTime + sub.offset);
      content += `${idx + 1}\n`;
      content += `${formatSRTTime(start)} --> ${formatSRTTime(end)}\n`;
      content += `${sub.text}\n\n`;
    });
    return content;
  }, [subtitles]);

  const exportVTT = useCallback(() => {
    const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
    if (sorted.length === 0) return 'WEBVTT\n\n';

    let content = 'WEBVTT\n\n';
    sorted.forEach((sub, idx) => {
      const start = Math.max(0, sub.startTime + sub.offset);
      const end = Math.max(start + 1, sub.endTime + sub.offset);
      content += `${idx + 1}\n`;
      content += `${formatVTTTime(start)} --> ${formatVTTTime(end)}\n`;
      content += `${sub.text}\n\n`;
    });
    return content;
  }, [subtitles]);

  const getCurrentSubtitle = useCallback(
    (time: number) => {
      const timeMs = time * 1000;
      return (
        subtitles.find(
          (sub) =>
            timeMs >= sub.startTime + sub.offset && timeMs <= sub.endTime + sub.offset
        ) || null
      );
    },
    [subtitles]
  );

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
