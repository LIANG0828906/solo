import type { Question } from '../engine/types'

export const questions: Question[] = [
  {
    id: 1,
    text: '当你听一首歌时，最先注意到的是什么？',
    options: [
      { id: 'q1a', text: '旋律线条', dimension: 'Melody', score: 25 },
      { id: 'q1b', text: '鼓点节拍', dimension: 'Rhythm', score: 25 },
      { id: 'q1c', text: '歌词内容', dimension: 'Lyric', score: 25 },
      { id: 'q1d', text: '整体氛围', dimension: 'Mood', score: 25 },
    ],
  },
  {
    id: 2,
    text: '你更喜欢哪种音乐结构？',
    options: [
      { id: 'q2a', text: '简单直接的副歌重复', dimension: 'Melody', score: 20 },
      { id: 'q2b', text: '强烈的节奏变化', dimension: 'Rhythm', score: 25 },
      { id: 'q2c', text: '叙事性的段落展开', dimension: 'Lyric', score: 25 },
      { id: 'q2d', text: '复杂的层次叠加', dimension: 'Complexity', score: 25 },
    ],
  },
  {
    id: 3,
    text: '哪种乐器的声音最能打动你？',
    options: [
      { id: 'q3a', text: '小提琴/钢琴的优美旋律', dimension: 'Melody', score: 25 },
      { id: 'q3b', text: '架子鼓/贝斯的律动', dimension: 'Rhythm', score: 25 },
      { id: 'q3c', text: '人声演唱的情感表达', dimension: 'Lyric', score: 20 },
      { id: 'q3d', text: '合成器营造的氛围感', dimension: 'Mood', score: 25 },
    ],
  },
  {
    id: 4,
    text: '你创作音乐时最看重什么？',
    options: [
      { id: 'q4a', text: '抓耳的主旋律', dimension: 'Melody', score: 25 },
      { id: 'q4b', text: '让人想动的节奏', dimension: 'Rhythm', score: 25 },
      { id: 'q4c', text: '有深度的歌词', dimension: 'Lyric', score: 25 },
      { id: 'q4d', text: '独特的音色设计', dimension: 'Complexity', score: 20 },
    ],
  },
  {
    id: 5,
    text: '你更喜欢什么速度的音乐？',
    options: [
      { id: 'q5a', text: '舒缓悠扬的慢歌', dimension: 'Melody', score: 20 },
      { id: 'q5b', text: '动感十足的快歌', dimension: 'Rhythm', score: 25 },
      { id: 'q5c', text: '中等速度的叙事歌', dimension: 'Lyric', score: 25 },
      { id: 'q5d', text: '速度多变的前卫曲', dimension: 'Complexity', score: 25 },
    ],
  },
  {
    id: 6,
    text: '一首歌的什么最容易让你流泪？',
    options: [
      { id: 'q6a', text: '悲伤的旋律走向', dimension: 'Melody', score: 25 },
      { id: 'q6b', text: '沉重的鼓点节奏', dimension: 'Mood', score: 20 },
      { id: 'q6c', text: '戳心的歌词故事', dimension: 'Lyric', score: 25 },
      { id: 'q6d', text: '层层递进的情绪铺垫', dimension: 'Mood', score: 25 },
    ],
  },
  {
    id: 7,
    text: '你更喜欢哪种音乐风格？',
    options: [
      { id: 'q7a', text: '流行/古典', dimension: 'Melody', score: 25 },
      { id: 'q7b', text: '电子/嘻哈', dimension: 'Rhythm', score: 25 },
      { id: 'q7c', text: '民谣/摇滚', dimension: 'Lyric', score: 25 },
      { id: 'q7d', text: '前卫/实验', dimension: 'Complexity', score: 25 },
    ],
  },
  {
    id: 8,
    text: '你在什么场景下最想听音乐？',
    options: [
      { id: 'q8a', text: '专注工作时当背景', dimension: 'Mood', score: 25 },
      { id: 'q8b', text: '运动健身时打节奏', dimension: 'Rhythm', score: 25 },
      { id: 'q8c', text: '深夜独处时疗愈', dimension: 'Mood', score: 20 },
      { id: 'q8d', text: '仔细聆听品味细节', dimension: 'Complexity', score: 25 },
    ],
  },
  {
    id: 9,
    text: '你更看重一首歌的什么价值？',
    options: [
      { id: 'q9a', text: '传唱度高的流行性', dimension: 'Melody', score: 25 },
      { id: 'q9b', text: '舞蹈性强的节奏性', dimension: 'Rhythm', score: 25 },
      { id: 'q9c', text: '文学性强的歌词', dimension: 'Lyric', score: 25 },
      { id: 'q9d', text: '艺术性强的创新', dimension: 'Complexity', score: 25 },
    ],
  },
  {
    id: 10,
    text: '和朋友一起听音乐时，你会？',
    options: [
      { id: 'q10a', text: '跟着哼唱旋律', dimension: 'Melody', score: 25 },
      { id: 'q10b', text: '跟着点头打拍', dimension: 'Rhythm', score: 25 },
      { id: 'q10c', text: '讨论歌词含义', dimension: 'Lyric', score: 25 },
      { id: 'q10d', text: '分析编曲层次', dimension: 'Complexity', score: 20 },
    ],
  },
  {
    id: 11,
    text: '你觉得一首好歌最重要的是？',
    options: [
      { id: 'q11a', text: '有记忆点的hook', dimension: 'Melody', score: 25 },
      { id: 'q11b', text: '扎实的律动', dimension: 'Rhythm', score: 25 },
      { id: 'q11c', text: '真诚的表达', dimension: 'Lyric', score: 25 },
      { id: 'q11d', text: '情绪的传递', dimension: 'Mood', score: 20 },
    ],
  },
  {
    id: 12,
    text: '你更倾向于怎样的编曲？',
    options: [
      { id: 'q12a', text: '简单干净的配器', dimension: 'Melody', score: 20 },
      { id: 'q12b', text: '清晰有力的低鼓', dimension: 'Rhythm', score: 25 },
      { id: 'q12c', text: '以人声为主导', dimension: 'Lyric', score: 25 },
      { id: 'q12d', text: '丰富的层次和变化', dimension: 'Complexity', score: 25 },
    ],
  },
  {
    id: 13,
    text: '如果让你学一样乐器，你会选？',
    options: [
      { id: 'q13a', text: '吉他/钢琴（旋律）', dimension: 'Melody', score: 25 },
      { id: 'q13b', text: '架子鼓（节奏）', dimension: 'Rhythm', score: 25 },
      { id: 'q13c', text: '声乐（歌唱）', dimension: 'Lyric', score: 25 },
      { id: 'q13d', text: '合成器（声音设计）', dimension: 'Complexity', score: 20 },
    ],
  },
  {
    id: 14,
    text: '你对音乐的态度更接近？',
    options: [
      { id: 'q14a', text: '旋律是灵魂', dimension: 'Melody', score: 25 },
      { id: 'q14b', text: '节奏是骨架', dimension: 'Rhythm', score: 25 },
      { id: 'q14c', text: '歌词是心脏', dimension: 'Lyric', score: 25 },
      { id: 'q14d', text: '氛围是血液', dimension: 'Mood', score: 20 },
    ],
  },
  {
    id: 15,
    text: '你理想中的合作伙伴是？',
    options: [
      { id: 'q15a', text: '旋律感强的创作者', dimension: 'Melody', score: 25 },
      { id: 'q15b', text: '节奏把控好的制作人', dimension: 'Rhythm', score: 25 },
      { id: 'q15c', text: '文字功底深的作词人', dimension: 'Lyric', score: 20 },
      { id: 'q15d', text: '想法天马行空的艺术家', dimension: 'Complexity', score: 25 },
    ],
  },
]

export const totalQuestions = questions.length
