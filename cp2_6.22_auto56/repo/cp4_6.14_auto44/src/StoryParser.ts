import { v4 as uuidv4 } from 'uuid';
import {
  UserStory,
  WireframePage,
  WireframeElement,
  PageType,
  ElementType,
} from './types';
import { generateStoryId, generatePageId, generateElementId } from './store/useStore';

interface ParsedStory {
  stories: UserStory[];
  pages: WireframePage[];
}

const STORY_PATTERNS = [
  /作为[一|名|个](?<role>[^，,]+?)[，,]\s*我希望(?:能够|可以|想|要)(?<action>[^，,。.!！]+?)[，,。.!！]*(?:以(?:便|以|为了)(?<expected>[^。.!！]+)?/u,
  /As\s+an?\s+(?<role>[^,]+?),?\s*I\s+want\s+(?<action>[^.,!?]+?)[.,!?]*(?:so\s+that\s+(?<expected>[^.!?]+)?/i,
];

const FEATURE_KEYWORDS: Record<string, string[]> = {
  login: ['登录', 'login', 'signin', 'sign in', '登录系统', '访问系统'],
  home: ['首页', 'home', '仪表盘', 'dashboard', '概览', 'overview'],
  settings: ['设置', 'settings', 'profile', '个人资料', '修改资料', '用户权限'],
  list: ['列表', 'list', '记录', 'records', '历史', 'history', 'activity'],
  detail: ['详情', 'detail', '查看', 'view', '管理', 'manage'],
};

const PAGE_TITLES: Record<PageType, string> = {
  home: '首页',
  login: '登录页',
  settings: '设置页',
  list: '列表页',
  detail: '详情页',
};

function detectPageType(action: string, expected: string): PageType {
  const text = `${action} ${expected}`.toLowerCase();
  
  for (const [type, keywords] of Object.entries(FEATURE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return type as PageType;
      }
    }
  }
  
  return 'home';
}

function extractFeaturePoints(action: string, expected: string): string[] {
  const points: string[] = [];
  
  if (/登录|login|signin/i.test(action)) points.push('用户认证');
  if (/密码|password/i.test(action)) points.push('密码管理');
  if (/邮箱|email/i.test(action)) points.push('邮箱验证');
  if (/重置|reset/i.test(action)) points.push('密码重置');
  if (/仪表盘|dashboard|概览|overview/i.test(action)) points.push('数据展示');
  if (/记录|record|历史|history/i.test(action)) points.push('历史记录');
  if (/个人资料|profile/i.test(action)) points.push('个人信息');
  if (/权限|permission|role/i.test(action)) points.push('权限管理');
  if (/管理|manage/i.test(action)) points.push('管理功能');
  if (/查看|view|浏览|browse/i.test(action)) points.push('信息浏览');
  
  if (points.length === 0) {
    points.push('核心功能');
  }
  
  return points;
}

function generatePageElements(type: PageType, featurePoints: string[]): WireframeElement[] {
  const elements: WireframeElement[] = [];
  
  elements.push({
    id: generateElementId(),
    type: 'nav',
    x: 0,
    y: 0,
    width: 100,
    height: 40,
    label: PAGE_TITLES[type],
  });

  elements.push({
    id: generateElementId(),
    type: 'title',
    x: 20,
    y: 60,
    width: 60,
    height: 32,
    label: PAGE_TITLES[type],
  });

  if (type === 'login') {
    elements.push(
      { id: generateElementId(), type: 'input', x: 20, y: 110, width: 60, height: 40, label: '邮箱输入' },
      { id: generateElementId(), type: 'input', x: 20, y: 160, width: 60, height: 40, label: '密码输入' },
      { id: generateElementId(), type: 'button', x: 20, y: 220, width: 60, height: 40, label: '登录按钮' },
      { id: generateElementId(), type: 'text', x: 20, y: 280, width: 60, height: 24, label: '忘记密码？' }
    );
  } else if (type === 'home') {
    elements.push(
      { id: generateElementId(), type: 'text', x: 20, y: 110, width: 35, height: 80, label: '统计卡片1' },
      { id: generateElementId(), type: 'text', x: 60, y: 110, width: 35, height: 80, label: '统计卡片2' },
      { id: generateElementId(), type: 'text', x: 20, y: 210, width: 75, height: 60, label: '活动列表' },
      { id: generateElementId(), type: 'button', x: 20, y: 290, width: 30, height: 40, label: '查看更多' }
    );
  } else if (type === 'settings') {
    elements.push(
      { id: generateElementId(), type: 'input', x: 20, y: 110, width: 60, height: 40, label: '用户名' },
      { id: generateElementId(), type: 'input', x: 20, y: 160, width: 60, height: 40, label: '邮箱' },
      { id: generateElementId(), type: 'button', x: 20, y: 220, width: 60, height: 40, label: '保存修改' },
      { id: generateElementId(), type: 'text', x: 20, y: 280, width: 60, height: 24, label: '通知设置' }
    );
  } else if (type === 'list') {
    elements.push(
      { id: generateElementId(), type: 'text', x: 20, y: 110, width: 75, height: 28, label: '列表项1' },
      { id: generateElementId(), type: 'text', x: 20, y: 150, width: 75, height: 28, label: '列表项2' },
      { id: generateElementId(), type: 'text', x: 20, y: 190, width: 75, height: 28, label: '列表项3' },
      { id: generateElementId(), type: 'button', x: 20, y: 250, width: 30, height: 40, label: '新建' }
    );
  } else {
    elements.push(
      { id: generateElementId(), type: 'text', x: 20, y: 110, width: 75, height: 100, label: '详情内容' },
      { id: generateElementId(), type: 'button', x: 20, y: 240, width: 30, height: 40, label: '编辑' },
      { id: generateElementId(), type: 'button', x: 55, y: 240, width: 30, height: 40, label: '返回' }
    );
  }

  return elements;
}

export function parseUserStories(markdown: string): ParsedStory {
  const stories: UserStory[] = [];
  const pageMap = new Map<PageType, { points: string[]; stories: string[] }>();
  
  const lines = markdown.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    
    let match: RegExpMatchArray | null = null;
    for (const pattern of STORY_PATTERNS) {
      match = trimmedLine.match(pattern);
      if (match) break;
    }
    
    if (match && match.groups) {
      const { role = '', action = '', expected = '' } = match.groups;
      
      const cleanRole = role.trim();
      const cleanAction = action.trim();
      const cleanExpected = expected.trim();
      
      const featurePoints = extractFeaturePoints(cleanAction, cleanExpected);
      const pageType = detectPageType(cleanAction, cleanExpected);
      
      const story: UserStory = {
        id: generateStoryId(),
        role: cleanRole,
        action: cleanAction,
        expectedResult: cleanExpected,
        featurePoints,
      };
      
      stories.push(story);
      
      if (!pageMap.has(pageType)) {
        pageMap.set(pageType, { points: [], stories: [] });
      }
      
      const pageData = pageMap.get(pageType)!;
      pageData.points.push(...featurePoints);
      pageData.stories.push(story.id);
    }
  }
  
  const pages: WireframePage[] = [];
  for (const [type, data] of pageMap) {
    const uniquePoints = Array.from(new Set(data.points));
    pages.push({
      id: generatePageId(),
      title: PAGE_TITLES[type],
      type,
      elements: generatePageElements(type, uniquePoints),
    });
  }
  
  return { stories, pages };
}

export function validateParseAccuracy(stories: UserStory[]): number {
  if (stories.length === 0) return 0;
  
  let validCount = 0;
  for (const story of stories) {
    if (story.role && story.action && story.featurePoints.length > 0) {
      validCount++;
    }
  }
  
  return Math.round((validCount / stories.length) * 100);
}
