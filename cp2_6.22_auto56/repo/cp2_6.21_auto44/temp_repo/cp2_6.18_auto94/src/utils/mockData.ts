import { v4 as uuidv4 } from 'uuid';
import type { Project, Chapter, ChapterContent, VersionHistory, Comment } from '@/types';

const COVER_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
  '#3B82F6', '#EF4444', '#14B8A6', '#F97316', '#84CC16'
];

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

export function generateMockProjects(): Project[] {
  const titles = [
    { t: '星尘编年史', d: '一部关于星际探险的科幻史诗，讲述人类文明在宇宙中的兴衰历程。' },
    { t: '雾都往事', d: '发生在20世纪初伦敦的悬疑推理故事，迷雾中隐藏着惊天阴谋。' },
    { t: '山海奇缘', d: '基于中国神话传说改编的奇幻冒险，少年踏上寻找三海经的旅途。' },
    { t: '代码与玫瑰', d: '都市背景下的程序员爱情故事，在0和1之间寻找爱的真谛。' },
    { t: '北境之歌', d: '中世纪风格的奇幻战争史诗，七个王国的命运交织在一起。' },
    { t: '时间倒影', d: '时间旅行题材的硬科幻作品，探讨因果律与人类选择的哲学命题。' },
    { t: '深海之眼', d: '海洋生物学博士在深海发现失落文明的冒险故事。' },
    { t: '长安十二时辰', d: '盛唐背景下的历史悬疑，危机在十二个时辰内悄然逼近。' },
    { t: '量子之恋', d: '平行宇宙中的爱情故事，科学与浪漫的完美融合。' },
    { t: '孤岛咖啡馆', d: '治愈系短篇小说集，每位访客都带来一段难以忘怀的故事。' },
  ];

  return titles.map((item, idx) => ({
    id: uuidv4(),
    title: item.t,
    description: item.d,
    coverColor: COVER_COLORS[idx % COVER_COLORS.length],
    isFavorite: idx < 2,
    createdAt: daysAgo(30 + idx),
    updatedAt: idx === 0 ? hoursAgo(2) : idx === 1 ? hoursAgo(5) : daysAgo(idx),
  }));
}

export function generateMockChapters(projectIds: string[]): Chapter[] {
  const chapters: Chapter[] = [];
  projectIds.forEach((pid, pIdx) => {
    const count = 3 + (pIdx % 5);
    for (let i = 0; i < count; i++) {
      chapters.push({
        id: uuidv4(),
        projectId: pid,
        title: `第${i + 1}章 ${['序章', '风起', '相遇', '转折', '风暴', '真相', '黎明', '归途', '终章'][i] || '新章节'}`,
        orderIndex: i,
        isCompleted: i < Math.floor(count * 0.6),
        isExpanded: true,
        createdAt: daysAgo(25 + pIdx),
        updatedAt: hoursAgo(pIdx * 3 + i),
      });
    }
  });
  return chapters;
}

export function generateMockChapterContents(chapters: Chapter[]): Record<string, ChapterContent> {
  const contents: Record<string, ChapterContent> = {};
  const sampleTexts = [
    `<h2>序章</h2><p>夜幕低垂，星光在遥远的宇宙深处闪烁。人类文明已经走过了数千年的历程，从最初的洞穴壁画，到如今的星际远航，每一步都承载着无尽的梦想与勇气。</p><p>公元2387年，"星尘号"旗舰缓缓驶离地球轨道，这是人类历史上规模最大的一次深空探索任务。船员们来自不同的国家和文化背景，但他们心中都怀揣着同一个信念——在浩瀚的宇宙中，找到人类的未来。</p><blockquote>"我们选择登月，不是因为它容易，而是因为它困难。" —— 约翰·肯尼迪</blockquote><p>舰桥上，舰长林远望着窗外蔚蓝色的地球，眼中闪过一丝复杂的情感。这或许是他最后一次看到这颗美丽的星球了。</p><ul><li>任务目标：探索仙女座方向的未知星域</li><li>预计航程：127个地球年</li><li>船员总数：2,847人</li></ul>`,
    `<h2>风起</h2><p>伦敦的雾总是带着一种特殊的味道，那是煤炭燃烧与泰晤士河潮湿气息混合而成的独特气息。1897年的秋天，雾气格外浓重，整座城市仿佛被笼罩在一层灰色的纱帐之中。</p><p>爱德华·格雷警探站在苏格兰场的办公室窗前，手里握着一份刚送来的案卷。三天之内，三起离奇的失踪案，受害者之间毫无关联，作案现场没有留下任何线索。这绝不是普通的刑事案件。</p><p>他点燃了烟斗，深深吸了一口。烟雾在空气中缓缓散开，与窗外的雾气遥相呼应。直觉告诉他，这场迷雾的背后，隐藏着一个足以撼动整个大英帝国的惊天秘密。</p>`,
    `<h2>相遇</h2><p>少年背着简陋的行囊，站在巍峨的山门前。传说中，这里是上古时期神人共居之地，也是《山海经》原稿的最后归宿。</p><p>"你终于来了。"一个苍老而平和的声音从山门后传来。</p><p>少年握紧了胸前的玉佩，那是父亲临终前交给他的唯一遗物。玉佩上繁复的纹路，正与山门两侧的浮雕隐隐呼应。</p>`,
  ];

  chapters.forEach((ch, idx) => {
    const text = sampleTexts[idx % sampleTexts.length];
    const plainText = text.replace(/<[^>]+>/g, '');
    contents[ch.id] = {
      chapterId: ch.id,
      content: text,
      wordCount: plainText.length,
      lastSavedAt: ch.updatedAt,
    };
  });
  return contents;
}

export function generateMockVersions(chapters: Chapter[]): VersionHistory[] {
  const versions: VersionHistory[] = [];
  const authors = [
    { name: '林清羽', avatar: 'LQ' },
    { name: '苏墨白', avatar: 'SM' },
    { name: '叶知秋', avatar: 'YZ' },
  ];

  chapters.slice(0, 3).forEach((ch) => {
    for (let i = 0; i < 3; i++) {
      const author = authors[i % authors.length];
      versions.push({
        id: uuidv4(),
        chapterId: ch.id,
        content: ch.id + '_v' + i,
        snapshotName: `草稿 v${i + 1}`,
        createdAt: hoursAgo((i + 1) * 4),
        authorName: author.name,
        authorAvatar: author.avatar,
      });
    }
  });
  return versions;
}

export function generateMockComments(chapters: Chapter[]): Comment[] {
  const comments: Comment[] = [];
  const authors = [
    { name: '林清羽', avatar: 'LQ' },
    { name: '苏墨白', avatar: 'SM' },
  ];

  const texts = [
    '这段场景描写很棒，很有画面感！',
    '建议在对话部分增加一些肢体语言的描述',
    '时间线需要再确认一下，好像前后有些不一致',
    '非常感动，读到这里眼眶湿润了',
    '这里的转折略显突兀，可以加一些过渡',
  ];

  chapters.slice(0, 2).forEach((ch) => {
    for (let i = 0; i < 3; i++) {
      const author = authors[i % authors.length];
      const parentId = i > 1 ? comments[comments.length - 2].id : null;
      comments.push({
        id: uuidv4(),
        chapterId: ch.id,
        text: texts[i % texts.length],
        authorName: author.name,
        authorAvatar: author.avatar,
        createdAt: hoursAgo(i + 1),
        parentCommentId: parentId,
        startOffset: 20 * i,
        endOffset: 50 + 20 * i,
        resolved: i === 0,
      });
    }
  });
  return comments;
}

export interface MockDataBundle {
  projects: Project[];
  chapters: Chapter[];
  chapterContents: Record<string, ChapterContent>;
  versionHistories: VersionHistory[];
  comments: Comment[];
}

export function generateFullMockData(): MockDataBundle {
  const projects = generateMockProjects();
  const projectIds = projects.map(p => p.id);
  const chapters = generateMockChapters(projectIds);
  const chapterContents = generateMockChapterContents(chapters);
  const versionHistories = generateMockVersions(chapters);
  const comments = generateMockComments(chapters);

  return { projects, chapters, chapterContents, versionHistories, comments };
}
