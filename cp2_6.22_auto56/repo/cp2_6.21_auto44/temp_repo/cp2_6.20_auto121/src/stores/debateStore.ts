import { create } from 'zustand';

interface DebateMessage {
  id: string;
  author: string;
  authorId: string;
  content: string;
  side: 'pro' | 'con';
  timestamp: number;
}

interface Debate {
  id: string;
  title: string;
  starter: string;
  participants: number;
  lastReply: string;
  proMessages: DebateMessage[];
  conMessages: DebateMessage[];
}

const initialDebates: Debate[] = [
  {
    id: 'd1',
    title: '文学作品的道德判断：作者的人品是否应影响作品评价？',
    starter: '墨语书客',
    participants: 23,
    lastReply: '2分钟前',
    proMessages: [
      { id: 'm1', author: '阅读者A', authorId: 'u10', content: '作品是独立的艺术存在，应该与作者个人品行分开评价。陀思妥耶夫斯基嗜赌，但不妨碍他写出伟大的小说。', side: 'pro', timestamp: Date.now() - 600000 },
      { id: 'm2', author: '墨语书客', authorId: 'u1', content: '完全同意。审美判断和道德判断是两个不同维度，混为一谈会窄化我们对文学的理解。', side: 'pro', timestamp: Date.now() - 300000 },
    ],
    conMessages: [
      { id: 'm3', author: '书虫B', authorId: 'u11', content: '文字从来不是纯粹的艺术，它承载着价值观。一个有严重道德问题的作者，其作品中必然渗透着扭曲的价值取向。', side: 'con', timestamp: Date.now() - 500000 },
      { id: 'm4', author: '文艺青年C', authorId: 'u12', content: '@阅读者A 陀思妥耶夫斯基的赌博恰恰是他深刻理解人性的来源之一。但有些作者的恶行与创作完全无关，这种情况下他们的作品确实值得警惕。', side: 'con', timestamp: Date.now() - 200000 },
    ],
  },
  {
    id: 'd2',
    title: '翻译文学能否传达原著的神韵？',
    starter: '翻译爱好者',
    participants: 15,
    lastReply: '15分钟前',
    proMessages: [
      { id: 'm5', author: '译者小王', authorId: 'u20', content: '优秀的翻译本身就是再创作。当译者对两种语言和文化都有深刻理解时，完全可以传达原著的精神内核。', side: 'pro', timestamp: Date.now() - 900000 },
    ],
    conMessages: [
      { id: 'm6', author: '原著党D', authorId: 'u21', content: '语言中的韵律、双关、文化隐喻是无法完美映射的。读翻译文学永远只能获得"近似值"而非"真值"。', side: 'con', timestamp: Date.now() - 800000 },
    ],
  },
  {
    id: 'd3',
    title: '短视频时代，长篇文学是否正在失去意义？',
    starter: '数字阅读者',
    participants: 38,
    lastReply: '5分钟前',
    proMessages: [
      { id: 'm7', author: '效率派E', authorId: 'u30', content: '长篇文学中大量冗余描写已不适应当代节奏。精华可以通过更高效的方式传达。', side: 'pro', timestamp: Date.now() - 400000 },
    ],
    conMessages: [
      { id: 'm8', author: '深度阅读F', authorId: 'u31', content: '恰恰相反。信息碎片化让人更需要深度阅读来修复注意力。长篇文学提供的沉浸体验是短视频永远无法替代的。', side: 'con', timestamp: Date.now() - 350000 },
    ],
  },
];

interface DebateState {
  debates: Debate[];
  addMessage: (debateId: string, message: DebateMessage) => void;
}

export const useDebateStore = create<DebateState>((set) => ({
  debates: initialDebates,
  addMessage: (debateId, message) => {
    set((state) => ({
      debates: state.debates.map((d) => {
        if (d.id !== debateId) return d;
        const sideKey = message.side === 'pro' ? 'proMessages' : 'conMessages';
        return {
          ...d,
          [sideKey]: [...d[sideKey], message],
          participants: d.participants + (d.proMessages.length + d.conMessages.length === 0 ? 1 : 0),
          lastReply: '刚刚',
        };
      }),
    }));
  },
}));
