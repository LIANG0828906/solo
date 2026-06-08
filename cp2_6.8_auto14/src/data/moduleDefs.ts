export interface ModuleStyle {
  backgroundColor: string;
  fontSize: number;
  borderRadius: number;
  padding: number;
}

export interface ModuleDef {
  type: string;
  name: string;
  icon: string;
  description: string;
  defaultStyle: ModuleStyle;
}

export const moduleDefs: ModuleDef[] = [
  {
    type: 'article-list',
    name: '文章列表',
    icon: '📄',
    description: '展示最新博客文章列表',
    defaultStyle: {
      backgroundColor: '#ffffff',
      fontSize: 14,
      borderRadius: 8,
      padding: 16,
    },
  },
  {
    type: 'profile',
    name: '个人简介',
    icon: '👤',
    description: '展示博主头像和简介信息',
    defaultStyle: {
      backgroundColor: '#ffffff',
      fontSize: 14,
      borderRadius: 8,
      padding: 16,
    },
  },
  {
    type: 'tag-cloud',
    name: '标签云',
    icon: '🏷️',
    description: '展示所有博客标签',
    defaultStyle: {
      backgroundColor: '#ffffff',
      fontSize: 14,
      borderRadius: 8,
      padding: 16,
    },
  },
  {
    type: 'archive-calendar',
    name: '归档日历',
    icon: '📅',
    description: '按时间归档的文章日历',
    defaultStyle: {
      backgroundColor: '#ffffff',
      fontSize: 14,
      borderRadius: 8,
      padding: 16,
    },
  },
  {
    type: 'social-links',
    name: '社交媒体',
    icon: '🔗',
    description: '展示社交媒体链接',
    defaultStyle: {
      backgroundColor: '#ffffff',
      fontSize: 14,
      borderRadius: 8,
      padding: 16,
    },
  },
  {
    type: 'recent-comments',
    name: '最近评论',
    icon: '💬',
    description: '展示最新访客评论',
    defaultStyle: {
      backgroundColor: '#ffffff',
      fontSize: 14,
      borderRadius: 8,
      padding: 16,
    },
  },
];

export const getModuleDef = (type: string): ModuleDef | undefined => {
  return moduleDefs.find((m) => m.type === type);
};
