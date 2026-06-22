import type { Project, Activity, Comment, Like } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { ProjectDB, ActivityDB, CommentDB, LikeDB } from './db';

function generatePlaceholderImage(text: string, bgColor: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#16a085;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#g)"/>
      <text x="400" y="300" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="48" font-family="Arial" font-weight="bold">${text}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

function minutesAgo(minutes: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutes);
  return d.toISOString();
}

export async function seedMockDataIfEmpty() {
  const existingProjects = await ProjectDB.getAll();
  if (existingProjects.length > 0) return;

  const img1 = generatePlaceholderImage('改造前', '#27AE60');
  const img2 = generatePlaceholderImage('改造后', '#3498DB');
  const img3 = generatePlaceholderImage('鸟瞰', '#E74C3C');
  const img4 = generatePlaceholderImage('夜景', '#F39C12');

  const projects: Project[] = [
    {
      id: uuidv4(),
      title: '社区花园改造计划',
      description: '将小区东南角废弃空地改造成共享社区花园，增加绿植座椅，为居民提供休闲社交空间。通过居民议事会共同参与设计，打造绿色邻里纽带。',
      images: [img1, img2, img3],
      author: '李四',
      createdAt: minutesAgo(120),
      updatedAt: minutesAgo(120),
    },
    {
      id: uuidv4(),
      title: '休憩长椅焕新项目',
      description: '更换小区内老化的公共座椅，选用环保防腐木材，增设靠背和扶手，为老年人和儿童提供舒适休息场所。',
      images: [img2, img4],
      author: '王五',
      createdAt: minutesAgo(60),
      updatedAt: minutesAgo(60),
    },
    {
      id: uuidv4(),
      title: '儿童游乐区安全升级',
      description: '铺设橡胶安全地垫，更换老旧游乐设施，增加防护围栏，打造安全有趣的儿童活动天地。',
      images: [img3, img1, img4, img2],
      author: '赵六',
      createdAt: minutesAgo(30),
      updatedAt: minutesAgo(30),
    },
  ];

  for (const p of projects) {
    await ProjectDB.add(p);
  }

  const likes: Like[] = [
    {
      id: uuidv4(),
      projectId: projects[0].id,
      user: '张三',
      createdAt: minutesAgo(90),
    },
    {
      id: uuidv4(),
      projectId: projects[0].id,
      user: '王五',
      createdAt: minutesAgo(80),
    },
    {
      id: uuidv4(),
      projectId: projects[1].id,
      user: '张三',
      createdAt: minutesAgo(45),
    },
  ];
  for (const l of likes) {
    await LikeDB.add(l);
  }

  const comments: Comment[] = [
    {
      id: uuidv4(),
      projectId: projects[0].id,
      user: '张三',
      content: '这个花园改造得太棒了！周末可以带孩子来玩。',
      createdAt: minutesAgo(70),
    },
    {
      id: uuidv4(),
      projectId: projects[1].id,
      user: '李四',
      content: '很不错的设计！建议再增加一些遮阳设施。',
      createdAt: minutesAgo(25),
    },
  ];
  for (const c of comments) {
    await CommentDB.add(c);
  }

  const activities: Activity[] = [
    {
      id: uuidv4(),
      type: 'like',
      projectId: projects[1].id,
      projectTitle: projects[1].title,
      user: '张三',
      createdAt: minutesAgo(45),
    },
    {
      id: uuidv4(),
      type: 'comment',
      projectId: projects[1].id,
      projectTitle: projects[1].title,
      user: '李四',
      content: '很不错的设计！',
      createdAt: minutesAgo(25),
    },
    {
      id: uuidv4(),
      type: 'like',
      projectId: projects[0].id,
      projectTitle: projects[0].title,
      user: '张三',
      createdAt: minutesAgo(90),
    },
    {
      id: uuidv4(),
      type: 'comment',
      projectId: projects[0].id,
      projectTitle: projects[0].title,
      user: '张三',
      content: '这个花园改造得太棒了',
      createdAt: minutesAgo(70),
    },
    {
      id: uuidv4(),
      type: 'like',
      projectId: projects[0].id,
      projectTitle: projects[0].title,
      user: '王五',
      createdAt: minutesAgo(80),
    },
  ];
  for (const a of activities) {
    await ActivityDB.add(a);
  }
}
