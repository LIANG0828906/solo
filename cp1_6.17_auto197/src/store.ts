import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { CreativeCard, TimelineState, TimelineActions, SortType, CardType } from './types';

const STORAGE_KEY = 'creative-timeline-data';

const createMockData = (): CreativeCard[] => {
  return [
    {
      id: uuidv4(),
      year: 2020,
      type: 'article',
      title: '初次写作：我的第一篇博客',
      summary: '记录了我开始学习编程的心路历程，从迷茫到找到方向。',
      thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=200&h=200&fit=crop',
      detailImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=400&fit=crop',
      content: '这是我人生中的第一篇正式博客文章。当时我刚刚踏入编程的世界，对一切都充满好奇。文章记录了我从最初接触HTML时的困惑，到写出第一个Hello World程序时的喜悦。虽然现在回看，代码写得很稚嫩，但那种探索未知的热情始终激励着我前进。\n\n在这篇文章中，我分享了三个重要的学习心得：第一，不要害怕犯错，每一个bug都是成长的机会；第二，保持好奇心，技术世界日新月异，唯有持续学习才能不被淘汰；第三，找到志同道合的伙伴，社区的支持是最宝贵的资源。',
      order: 0,
      createdAt: '2020-03-15',
    },
    {
      id: uuidv4(),
      year: 2020,
      type: 'painting',
      title: '数字绘画初试：梦境花园',
      summary: '第一次尝试用数位板创作的插画作品，描绘了心中的梦幻世界。',
      thumbnail: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=200&h=200&fit=crop',
      detailImage: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=400&fit=crop',
      content: '这幅画是我使用数位板创作的第一件正式作品。画中描绘了一个充满奇幻色彩的花园：发光的蘑菇、飞舞的精灵、倒挂的彩虹瀑布。创作过程历时两周，从最初的草图构思到最后的细节润色，每一步都让我对数字艺术有了更深的理解。\n\n特别值得一提的是背景的渐变效果，我尝试了十几种不同的配色方案，最终选择了紫蓝色调，因为这让我想起童年夏日傍晚的天空。',
      order: 1,
      createdAt: '2020-08-22',
    },
    {
      id: uuidv4(),
      year: 2021,
      type: 'music',
      title: '轻音乐作品：晨雾',
      summary: '用FL Studio制作的第一首纯音乐，灵感来自清晨山间的薄雾。',
      thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&h=200&fit=crop',
      detailImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=400&fit=crop',
      content: '《晨雾》是我的第一首完整音乐作品。灵感来源于一次登山经历，那天清晨山间弥漫着淡淡的雾气，阳光穿过树林洒下斑驳的光影，整个世界仿佛都笼罩在梦幻之中。\n\n作品采用钢琴为主旋律，配以轻柔的合成器铺底和远处的鸟鸣声效。全曲时长3分42秒，结构为A-B-A-Coda形式，试图用音乐描绘出雾气从聚到散、阳光从暗到明的变化过程。',
      order: 0,
      createdAt: '2021-02-10',
    },
    {
      id: uuidv4(),
      year: 2021,
      type: 'video',
      title: 'Vlog：我的城市漫步',
      summary: '记录了独自在城市中探索的一天，用镜头捕捉平凡中的美好瞬间。',
      thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&h=200&fit=crop',
      detailImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop',
      content: '这是我第一次尝试拍摄和剪辑Vlog。视频记录了我在城市中漫步的一天：清晨的咖啡馆、午后的旧书店、傍晚的江边步道。虽然拍摄设备只是手机，剪辑手法也很生疏，但记录下的那些真实瞬间却格外珍贵。\n\n在剪辑过程中，我尝试了多种转场效果，最终选择了最朴素的淡入淡出，因为我觉得简单才能衬托出生活本身的质感。配乐选用了自己创作的《晨雾》，意外地很搭。',
      order: 1,
      createdAt: '2021-06-18',
    },
    {
      id: uuidv4(),
      year: 2021,
      type: 'article',
      title: '技术深度：React源码阅读笔记',
      summary: '深入研读React 18源码后整理的学习笔记，包含Fiber架构详解。',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&h=200&fit=crop',
      detailImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop',
      content: '这篇技术文章是我花了三个月时间研读React 18源码后的总结。文章从Fiber架构的设计理念讲起，深入剖析了协调算法、优先级调度、并发模式等核心概念。\n\n为了让读者更容易理解，我画了二十多张架构图，还写了多个简化版的Demo来模拟React的核心流程。文章发布后在社区获得了不错的反响，很多读者反馈说终于理解了React的工作原理，这让我觉得所有的付出都是值得的。',
      order: 2,
      createdAt: '2021-11-05',
    },
    {
      id: uuidv4(),
      year: 2022,
      type: 'painting',
      title: '概念设计：赛博朋克都市',
      summary: '以未来都市为主题的概念插画系列，展现霓虹灯下的科技美学。',
      thumbnail: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=200&h=200&fit=crop',
      detailImage: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=800&h=400&fit=crop',
      content: '这幅作品是赛博朋克都市系列的第一幅。画中描绘了2077年的超级都市：高耸入云的摩天楼、横亘天际的高架桥、无处不在的全息广告，以及在雨中闪烁的霓虹灯光。\n\n创作这幅画时，我参考了大量的建筑摄影和科幻电影设定图。特别注意了光影层次的营造：前景的雨水、中景的建筑轮廓、远景的朦胧天际线，三层空间构成了丰富的视觉纵深。整幅画使用了超过200个图层，耗时整整一个月完成。',
      order: 0,
      createdAt: '2022-04-30',
    },
    {
      id: uuidv4(),
      year: 2022,
      type: 'music',
      title: '电子舞曲：Neon Pulse',
      summary: '融合Synthwave风格的电子音乐作品，强劲节拍搭配复古合成器音色。',
      thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop',
      detailImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
      content: '《Neon Pulse》是我首次尝试电子舞曲创作。作品灵感来源于赛博朋克画作，试图用音乐还原那种霓虹闪烁、速度感十足的都市氛围。\n\n全曲BPM设定为128，采用经典的Four-on-the-floor鼓点，配以80年代复古风格的合成器Arpeggio。在Drop部分，我加入了厚重的Bassline和交织的Lead旋律，营造出强烈的爆发力。混音阶段前后调整了不下20个版本，终于在低频和中频之间找到了满意的平衡。',
      order: 1,
      createdAt: '2022-09-14',
    },
    {
      id: uuidv4(),
      year: 2023,
      type: 'video',
      title: '短片：时间的重量',
      summary: '探讨时间与记忆关系的实验性短片，获校园影像节最佳创意奖。',
      thumbnail: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=200&h=200&fit=crop',
      detailImage: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=400&fit=crop',
      content: '《时间的重量》是我最用心的一部影像作品。短片讲述了一位老人通过旧物重拾青春记忆的故事，全片没有一句台词，完全依靠画面、音乐和剪辑来传递情感。\n\n拍摄历时两个月，足迹遍布城市的角角落落。最难忘的是老火车站那组镜头，为了捕捉清晨最美的光线，我们连续一周凌晨四点就起床准备。最终这部作品获得了校园影像节的最佳创意奖，颁奖词中说"用最朴素的镜头语言，讲述了最动人的时间故事"。',
      order: 0,
      createdAt: '2023-05-20',
    },
    {
      id: uuidv4(),
      year: 2023,
      type: 'article',
      title: '独立开发者的一年',
      summary: '记录作为独立开发者从零到一的完整历程，包含收入数据和经验总结。',
      thumbnail: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=200&h=200&fit=crop',
      detailImage: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&h=400&fit=crop',
      content: '这篇文章是我作为独立开发者第一年的年终总结。文中详细记录了我从辞职开始，到第一个产品上线，再到实现月入过万的完整过程。\n\n文章包含了很多真实的数据：每个月的收入明细、产品迭代日志、用户增长曲线，甚至还有我犯过的各种错误和踩过的坑。我希望这些真实的经验能够帮助到那些和我一样，想要走上独立开发道路的朋友们。文章最后总结了三个关键词：坚持、专注、耐心。',
      order: 1,
      createdAt: '2023-12-31',
    },
    {
      id: uuidv4(),
      year: 2024,
      type: 'painting',
      title: '国风插画：四季歌',
      summary: '以中国传统二十四节气为灵感的系列插画作品，展现东方美学韵味。',
      thumbnail: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=200&h=200&fit=crop',
      detailImage: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=800&h=400&fit=crop',
      content: '《四季歌》是我历时半年完成的国风水墨插画系列，共24幅，对应二十四节气。每幅画都试图捕捉那个节气最独特的意境：立春的嫩芽、清明的烟雨、大暑的蝉鸣、冬至的初雪。\n\n创作中我尝试将传统水墨技法与数字绘画工具结合，用毛笔笔刷表现线条的韵律，用水彩图层模拟墨色的晕染。在配色上以淡雅为主，大面积留白，追求"言有尽而意无穷"的东方美学。这个系列作品后来被一家文创品牌买下版权，做成了台历和明信片。',
      order: 0,
      createdAt: '2024-08-08',
    },
    {
      id: uuidv4(),
      year: 2024,
      type: 'music',
      title: '民谣单曲：归途',
      summary: '以游子思乡为主题的原创民谣，吉他弹唱，温暖治愈风格。',
      thumbnail: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=200&h=200&fit=crop',
      detailImage: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=400&fit=crop',
      content: '《归途》是我写的第一首民谣作品。灵感来源于春节回家的火车上，看着窗外飞逝的风景，突然就明白了"归途"两个字的重量。\n\n这首歌的创作只用了一个晚上，歌词和旋律几乎是同时涌出来的。编曲采用最朴素的吉他弹唱，间奏加入了口琴，副歌部分有淡淡的弦乐铺垫。录制时我故意保留了人声的一些瑕疵，因为我觉得不完美才是最真实的表达。歌曲上线音乐平台后，收到了很多听众的评论，大家都说在这首歌里听到了自己的故事。',
      order: 1,
      createdAt: '2024-02-10',
    },
    {
      id: uuidv4(),
      year: 2024,
      type: 'video',
      title: '纪录片：手艺人',
      summary: '走访三位传统手艺人的纪录片，记录非遗技艺的传承与坚守。',
      thumbnail: 'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=200&h=200&fit=crop',
      detailImage: 'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=800&h=400&fit=crop',
      content: '纪录片《手艺人》记录了三位传统手艺人的日常：做了四十年油纸伞的王师傅、用古法烧制陶瓷的李阿姨、还有用榫卯结构做微型建筑的赵大爷。\n\n拍摄历时半年，我们和三位师傅同吃同住，用最平实的镜头记录下那些看似枯燥却充满温度的劳作瞬间。全片时长52分钟，没有华丽的特效，没有刻意的煽情，只是安静地呈现手艺本身。片子上线后在全网获得了超过百万的播放量，很多观众说看完后想要去学一门手艺，这就是对我们最大的肯定。',
      order: 2,
      createdAt: '2024-10-15',
    },
  ];
};

const loadFromStorage = (): CreativeCard[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load from storage', e);
  }
  const data = createMockData();
  saveToStorage(data);
  return data;
};

const saveToStorage = (cards: CreativeCard[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save to storage', e);
  }
};

export const useTimelineStore = create<TimelineState & TimelineActions>((set) => ({
  cards: loadFromStorage(),
  filteredTypes: [],
  sortType: 'newest',
  expandedYears: [],
  selectedCard: null,

  setFilteredTypes: (types: CardType[]) => set({ filteredTypes: types }),

  setSortType: (sort: SortType) => set({ sortType: sort }),

  toggleYear: (year: number) =>
    set((state) => ({
      expandedYears: state.expandedYears.includes(year)
        ? state.expandedYears.filter((y) => y !== year)
        : [...state.expandedYears, year],
    })),

  setSelectedCard: (card: CreativeCard | null) => set({ selectedCard: card }),

  reorderCards: (year: number, fromIndex: number, toIndex: number) =>
    set((state) => {
      const yearCards = state.cards
        .filter((c) => c.year === year)
        .sort((a, b) => a.order - b.order);

      if (fromIndex < 0 || fromIndex >= yearCards.length || toIndex < 0 || toIndex >= yearCards.length) {
        return state;
      }

      const movedCard = yearCards[fromIndex];
      yearCards.splice(fromIndex, 1);
      yearCards.splice(toIndex, 0, movedCard);

      const updatedYearCards = yearCards.map((card, idx) => ({ ...card, order: idx }));
      const newCards = state.cards.map((card) => {
        const updated = updatedYearCards.find((u) => u.id === card.id);
        return updated ? updated : card;
      });

      saveToStorage(newCards);
      return { cards: newCards };
    }),
}));
