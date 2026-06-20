export interface CommentData {
  id: string;
  workId: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface WorkData {
  id: string;
  wallId: string;
  imageUrl: string;
  title: string;
  description: string;
  likes: number;
  liked: boolean;
  comments: CommentData[];
}

export interface GalleryData {
  id: string;
  name: string;
  visitorCount: number;
  workCount: number;
  createdAt: string;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const mockGalleries: GalleryData[] = [
  {
    id: 'g1',
    name: '星际画廊',
    visitorCount: 42,
    workCount: 5,
    createdAt: '2025-01-15',
  },
  {
    id: 'g2',
    name: '数字幻境',
    visitorCount: 28,
    workCount: 3,
    createdAt: '2025-02-20',
  },
];

const mockWorks: WorkData[] = [
  {
    id: 'w1',
    wallId: '3,1',
    imageUrl: 'https://picsum.photos/seed/art1/400/300',
    title: '星际漫步',
    description: '在宇宙的边际，光与影交织成画',
    likes: 15,
    liked: false,
    comments: [
      {
        id: 'c1',
        workId: 'w1',
        username: '星尘旅人',
        content: '令人震撼的作品！',
        createdAt: '2025-03-10 14:30',
      },
    ],
  },
  {
    id: 'w2',
    wallId: '5,1',
    imageUrl: 'https://picsum.photos/seed/art2/400/300',
    title: '量子花园',
    description: '微观世界的秩序与混沌',
    likes: 8,
    liked: false,
    comments: [],
  },
  {
    id: 'w3',
    wallId: '7,1',
    imageUrl: 'https://picsum.photos/seed/art3/400/300',
    title: '深海回响',
    description: '来自深渊的低语',
    likes: 23,
    liked: true,
    comments: [
      {
        id: 'c2',
        workId: 'w3',
        username: '潜行者',
        content: '深蓝色的调子太美了',
        createdAt: '2025-03-12 09:15',
      },
      {
        id: 'c3',
        workId: 'w3',
        username: '海洋之子',
        content: '感受到了大海的力量',
        createdAt: '2025-03-12 16:45',
      },
    ],
  },
];

let commentIdCounter = 100;

export const MockApi = {
  async getGalleries(): Promise<GalleryData[]> {
    await delay(500);
    return [...mockGalleries];
  },

  async getWorksByGallery(_galleryId: string): Promise<WorkData[]> {
    await delay(500);
    return [...mockWorks];
  },

  async postComment(
    workId: string,
    content: string
  ): Promise<CommentData> {
    await delay(500);
    const comment: CommentData = {
      id: `c${++commentIdCounter}`,
      workId,
      username: '访客' + Math.floor(Math.random() * 1000),
      content,
      createdAt: new Date().toLocaleString('zh-CN'),
    };
    const work = mockWorks.find((w) => w.id === workId);
    if (work) work.comments.push(comment);
    return comment;
  },

  async postLike(workId: string): Promise<{ liked: boolean; likes: number }> {
    await delay(300);
    const work = mockWorks.find((w) => w.id === workId);
    if (work) {
      work.liked = !work.liked;
      work.likes += work.liked ? 1 : -1;
      return { liked: work.liked, likes: work.likes };
    }
    return { liked: false, likes: 0 };
  },
};
