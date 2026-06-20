import { create } from 'zustand';
import type { Entry, Mood } from './types';

interface EntryStore {
  entries: Entry[];
  addEntry: (entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEntry: (id: string, updates: Partial<Omit<Entry, 'id' | 'createdAt'>>) => void;
  deleteEntry: (id: string) => void;
}

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const sortByCreatedAt = (entries: Entry[]): Entry[] => {
  return [...entries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

const createSampleEntries = (): Entry[] => {
  const now = new Date();
  const moods: Mood[] = ['excited', 'thoughtful', 'bored', 'anxious'];
  const sampleData: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      title: '完成了一个重要的项目里程碑',
      source: '工作笔记',
      summary: '## 项目进展\n\n今天终于完成了**Q2季度的核心功能开发**，团队所有人都很兴奋。\n\n### 关键点\n- ✅ 用户认证系统重构\n- ✅ 性能优化提升40%\n- ✅ 代码覆盖率达到85%\n\n> "团队协作的力量是无穷的" - 项目经理',
      mood: 'excited',
    },
    {
      title: '阅读《人类简史》有感',
      source: '读书笔记',
      summary: '## 认知革命\n\n尤瓦尔·赫拉利提出了一个有趣的观点：**人类之所以能统治地球，是因为我们会讲故事**。\n\n### 思考\n- 虚构的故事如何让大规模协作成为可能？\n- 金钱、宗教、国家都是集体想象的产物？\n\n这让我重新审视我们所认为的"现实"。',
      mood: 'thoughtful',
    },
    {
      title: '周日的下午',
      source: '生活随笔',
      summary: '## 无所事事的美好\n\n窗外下着小雨，听着爵士乐，什么也不做。\n\n有时候，**无聊也是一种奢侈**。\n\n- 泡了一杯伯爵茶\n- 看了半集老电影\n- 发呆了半小时\n\n这种慢节奏的感觉真好。',
      mood: 'bored',
    },
    {
      title: '即将到来的技术面试',
      source: '个人日记',
      summary: '## 面试焦虑\n\n明天就要参加梦想公司的技术面试了，心情有点复杂。\n\n### 准备清单\n- [ ] 算法题再刷一遍\n- [ ] 系统设计复习\n- [ ] 项目经历梳理\n- [ ] 自我介绍演练\n\n深呼吸，相信自己的准备。',
      mood: 'anxious',
    },
    {
      title: '第一次尝试做日式拉面',
      source: '美食记录',
      summary: '## 厨房冒险\n\n今天尝试在家做**日式豚骨拉面**，结果出乎意料的好！\n\n### 食材\n- 猪骨熬汤8小时\n- 自制叉烧\n- 溏心蛋\n- 细卷面\n\n虽然过程很麻烦，但吃到第一口的时候，一切都值得了！',
      mood: 'excited',
    },
    {
      title: '关于远程工作的思考',
      source: '博客草稿',
      summary: '## 远程工作三年祭\n\n不知不觉已经远程工作三年了，有一些心得想分享。\n\n### 优点\n1. 时间灵活\n2. 省去通勤\n3. 可以专注工作\n\n### 缺点\n1. 社交减少\n2. 工作生活边界模糊\n3. 需要更强的自律性\n\n**你更倾向哪种工作方式？**',
      mood: 'thoughtful',
    },
    {
      title: '等待周五的到来',
      source: '工作吐槽',
      summary: '## 周三综合症\n\n今天是周三，距离周末还有两天...\n\n- 上午：开了三个会\n- 下午：回复了50封邮件\n- 晚上：只想躺平\n\n感觉时间过得好慢啊。',
      mood: 'bored',
    },
    {
      title: '产品上线前的紧张',
      source: '工作日记',
      summary: '## D-1 倒计时\n\n明天产品就要正式上线了，手心都是汗。\n\n### 检查清单\n- ✅ 所有Bug已修复\n- ✅ 性能测试通过\n- ✅ 监控告警配置完成\n- ⏳ 最后的回归测试\n\n希望一切顺利，不要出什么幺蛾子。',
      mood: 'anxious',
    },
    {
      title: '收到了用户的感谢信',
      source: '工作记录',
      summary: '## 温暖的一天\n\n今天收到一封用户的感谢信，说我们的产品帮助他解决了很大的问题。\n\n> "你们的软件让我每天节省了2小时的工作时间，真的非常感谢！"\n\n作为开发者，这就是我们坚持下去的动力啊！❤️',
      mood: 'excited',
    },
    {
      title: '散步时的哲学思考',
      source: '随笔录',
      summary: '## 存在主义咖啡馆\n\n傍晚在公园散步，看着夕阳西下，突然想到：\n\n**我们每天忙碌的意义是什么？**\n\n是为了更好的生活？还是为了实现自我价值？\n\n可能答案并不重要，重要的是我们一直在寻找。\n\n> "人生的意义在于寻找意义的过程。"',
      mood: 'thoughtful',
    },
    {
      title: '又是重复的一天',
      source: '日记',
      summary: '## 日常\n\n- 7:00 起床\n- 8:00 上班\n- 9:00 晨会\n- 12:00 午饭\n- 14:00 继续工作\n- 18:00 下班\n- 20:00 晚饭\n- 22:00 睡觉\n\n明天大概也是一样吧。',
      mood: 'bored',
    },
    {
      title: '体检报告出来了',
      source: '个人健康',
      summary: '## 健康焦虑\n\n年度体检报告出来了，有几项指标不太正常。\n\n- 体重超标 ⚠️\n- 轻度脂肪肝 ⚠️\n- 血压偏高 ⚠️\n\n是时候改变生活方式了：\n1. 每周运动3次\n2. 少吃油腻食物\n3. 早睡早起\n\n健康才是最重要的。',
      mood: 'anxious',
    },
    {
      title: '马拉松完赛！',
      source: '运动记录',
      summary: '## 人生第一个全马\n\n今天完成了人生第一个全程马拉松！\n\n### 成绩\n- 枪声成绩：4:32:18\n- 净成绩：4:28:45\n- 排名：第1234名\n\n虽然很累，但是冲过终点线的那一刻，**所有的训练都是值得的！**\n\n🏅 下一个目标：跑进4小时！',
      mood: 'excited',
    },
    {
      title: '深夜沉思：关于选择',
      source: '深夜随笔',
      summary: '## 岔路口\n\n躺在床上睡不着，在想一个问题：\n\n**如果当初做了不同的选择，现在会是怎样？**\n\n- 如果当年选择了另一个专业？\n- 如果当初接受了那份offer？\n- 如果勇敢地说了那句话？\n\n可惜人生没有如果，只有结果和后果。\n\n但也许，**一切都是最好的安排**。',
      mood: 'thoughtful',
    },
    {
      title: '周末的下雨天',
      source: '生活记录',
      summary: '## 雨声\n\n外面下着大雨，听着雨滴敲打窗户的声音。\n\n不想出门，不想工作，就想这样躺着。\n\n- 看了一部老电影\n- 读了几页书\n- 泡了个热水澡\n\n有时候，浪费时间也是一种享受。',
      mood: 'bored',
    },
  ];

  return sampleData.map((data, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - index);
    date.setHours(Math.floor(Math.random() * 10) + 8, Math.floor(Math.random() * 60), 0, 0);
    
    return {
      id: generateId(),
      ...data,
      mood: moods[index % 4],
      createdAt: date,
      updatedAt: date,
    };
  });
};

export const useEntryStore = create<EntryStore>((set) => ({
  entries: sortByCreatedAt(createSampleEntries()),
  
  addEntry: (entry) =>
    set((state) => {
      const now = new Date();
      const newEntry: Entry = {
        id: generateId(),
        ...entry,
        createdAt: now,
        updatedAt: now,
      };
      return {
        entries: sortByCreatedAt([...state.entries, newEntry]),
      };
    }),
  
  updateEntry: (id, updates) =>
    set((state) => {
      const updatedEntries = state.entries.map((entry) =>
        entry.id === id
          ? { ...entry, ...updates, updatedAt: new Date() }
          : entry
      );
      return {
        entries: sortByCreatedAt(updatedEntries),
      };
    }),
  
  deleteEntry: (id) =>
    set((state) => ({
      entries: sortByCreatedAt(state.entries.filter((entry) => entry.id !== id)),
    })),
}));
