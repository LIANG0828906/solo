import type { TranscriptResult, Speaker, TranscriptSentence } from '@/types';

const SPEAKER_COLORS = ['#e3f2fd', '#fff3e0', '#e8f5e9', '#f3e5f5', '#fff9c4'];

const MOCK_SENTENCES = [
  '大家好，今天我们来讨论一下新产品的开发计划。',
  '首先，我想介绍一下市场调研的结果。',
  '根据我们的数据，用户对移动端的需求增长很快。',
  '是的，我也注意到了这个趋势。',
  '那我们是不是应该优先开发移动端版本？',
  '我觉得可以，但是也要考虑到现有用户的体验。',
  '说得对，我们不能牺牲桌面端的质量。',
  '我的建议是双管齐下，两个平台同时推进。',
  '那资源够吗？团队现在的工作量已经很大了。',
  '我们可以考虑招聘一些新的成员。',
  '或者，也可以把一些非核心功能外包出去。',
  '外包的话，质量怎么保证呢？',
  '我们可以制定严格的验收标准。',
  '我觉得还是内部开发更稳妥一些。',
  '这样吧，我们先做一个详细的评估报告。',
  '好的，那谁来负责这个评估？',
  '我来吧，我对这方面比较熟悉。',
  '那就辛苦你了，预计什么时候能出结果？',
  '大概需要一周的时间。',
  '行，那就下周五之前给我们汇报。',
  '好的，没问题。',
  '还有其他事情要讨论吗？',
  '我想提一下用户反馈的问题。',
  '最近收到一些用户说界面太复杂了。',
  '这个问题确实存在，我们需要简化一下。',
  '我同意，应该做一些用户体验优化。',
  '那我们安排一下，下周开个专题会议讨论。',
  '好的，我来安排时间。',
  '还有，关于数据分析的功能，用户呼声很高。',
  '这个功能我们已经在规划中了。',
  '大概什么时候能上线？',
  '预计下个季度吧。',
  '能不能提前一些？很多用户都在问。',
  '我尽量吧，但质量还是第一位的。',
  '理解，那就拜托你们了。',
  '好的，我们会尽力的。',
  '今天的会议就到这里吧，大家还有问题吗？',
  '没有了。',
  '好，散会。',
];

function generateMockTranscript(): TranscriptResult {
  const speakerCount = 3;
  const speakers: Speaker[] = [];
  
  for (let i = 0; i < speakerCount; i++) {
    speakers.push({
      id: `speaker-${i}`,
      name: `说话人${String.fromCharCode(65 + i)}`,
      color: SPEAKER_COLORS[i % SPEAKER_COLORS.length],
    });
  }

  const sentences: TranscriptSentence[] = [];
  let currentTime = 0;

  MOCK_SENTENCES.forEach((text, index) => {
    const speakerIndex = index % speakerCount;
    const duration = 3 + Math.random() * 4;
    const startTime = currentTime;
    const endTime = currentTime + duration;

    sentences.push({
      id: `sentence-${index}`,
      speakerId: speakers[speakerIndex].id,
      text,
      startTime: Math.round(startTime * 10) / 10,
      endTime: Math.round(endTime * 10) / 10,
    });

    currentTime = endTime + 0.5;
  });

  return {
    sentences,
    speakers,
    duration: Math.round(currentTime * 10) / 10,
  };
}

export async function mockUpload(file: File, onProgress: (progress: number) => void): Promise<string> {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        onProgress(100);
        setTimeout(() => resolve('mock-task-id'), 300);
      } else {
        onProgress(Math.floor(progress));
      }
    }, 150);
  });
}

export async function mockTranscribe(
  taskId: string,
  onProgress: (progress: number) => void
): Promise<TranscriptResult> {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 8;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        onProgress(100);
        setTimeout(() => resolve(generateMockTranscript()), 500);
      } else {
        onProgress(Math.floor(progress));
      }
    }, 200);
  });
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
}

export function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}
