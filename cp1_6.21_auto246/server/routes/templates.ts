import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Template } from '../types';

const router = Router();

const templatesStore = new Map<string, Template>();

const presetTemplates: Omit<Template, 'id'>[] = [
  {
    name: '登录页',
    description: '简洁美观的用户登录页面模板，支持邮箱/密码登录和第三方登录',
    category: '认证',
    thumbnail: 'login',
    schema: {
      title: { type: 'string', label: '页面标题' },
      logo: { type: 'string', label: 'Logo地址' },
      fields: {
        type: 'array',
        items: { name: 'string', type: 'string', placeholder: 'string' }
      }
    },
    defaultData: {
      title: '欢迎回来',
      logo: '',
      fields: [
        { name: 'email', type: 'email', placeholder: '请输入邮箱' },
        { name: 'password', type: 'password', placeholder: '请输入密码' }
      ],
      showSocialLogin: true,
      socialProviders: ['google', 'github']
    }
  },
  {
    name: '个人资料',
    description: '用户个人信息展示页面，包含头像、简介和社交链接',
    category: '用户',
    thumbnail: 'profile',
    schema: {
      avatar: { type: 'string', label: '头像地址' },
      name: { type: 'string', label: '用户名称' },
      bio: { type: 'string', label: '个人简介' },
      socialLinks: {
        type: 'array',
        items: { platform: 'string', url: 'string' }
      }
    },
    defaultData: {
      avatar: '',
      name: '张三',
      bio: '全栈开发工程师，热爱开源和技术分享',
      socialLinks: [
        { platform: 'github', url: 'https://github.com' },
        { platform: 'twitter', url: 'https://twitter.com' },
        { platform: 'linkedin', url: 'https://linkedin.com' }
      ],
      stats: [
        { label: '项目', value: 42 },
        { label: '粉丝', value: 1280 },
        { label: '关注', value: 256 }
      ]
    }
  },
  {
    name: '商品详情',
    description: '电商商品详情页模板，包含图片轮播、价格和购买按钮',
    category: '电商',
    thumbnail: 'product',
    schema: {
      images: { type: 'array', items: 'string' },
      title: { type: 'string', label: '商品标题' },
      price: { type: 'number', label: '商品价格' },
      originalPrice: { type: 'number', label: '原价' }
    },
    defaultData: {
      images: ['', '', ''],
      title: '高品质无线蓝牙耳机',
      price: 299,
      originalPrice: 499,
      description: '主动降噪，续航30小时，IPX5防水',
      specs: [
        { label: '蓝牙版本', value: '5.3' },
        { label: '续航时间', value: '30小时' },
        { label: '防水等级', value: 'IPX5' }
      ],
      inStock: true,
      rating: 4.8,
      reviewCount: 2156
    }
  },
  {
    name: '仪表盘',
    description: '数据管理仪表盘，包含统计卡片、图表和数据表格',
    category: '管理',
    thumbnail: 'dashboard',
    schema: {
      title: { type: 'string', label: '仪表盘标题' },
      statsCards: {
        type: 'array',
        items: { label: 'string', value: 'number', trend: 'number' }
      }
    },
    defaultData: {
      title: '运营数据总览',
      statsCards: [
        { label: '总用户', value: 12560, trend: 12.5 },
        { label: '今日订单', value: 856, trend: -3.2 },
        { label: '营收', value: 89600, trend: 24.8 },
        { label: '转化率', value: 3.6, trend: 1.2 }
      ],
      chartType: 'line',
      recentOrders: [
        { id: 'ORD001', customer: '李四', amount: 599, status: '已完成' },
        { id: 'ORD002', customer: '王五', amount: 1299, status: '配送中' },
        { id: 'ORD003', customer: '赵六', amount: 299, status: '待发货' }
      ]
    }
  },
  {
    name: '博客',
    description: '文章详情页模板，支持富文本内容、标签和评论区',
    category: '内容',
    thumbnail: 'blog',
    schema: {
      title: { type: 'string', label: '文章标题' },
      author: { type: 'string', label: '作者名称' },
      cover: { type: 'string', label: '封面图片' },
      tags: { type: 'array', items: 'string' }
    },
    defaultData: {
      title: '深入浅出 React 18 新特性',
      author: '前端技术周刊',
      cover: '',
      publishDate: '2024-01-15',
      readTime: 8,
      tags: ['React', '前端', 'JavaScript'],
      content: '## React 18 带来了什么\n\nReact 18 引入了并发渲染、自动批处理、Suspense SSR 等重要特性...',
      comments: [
        { id: '1', author: '读者A', content: '写得非常详细，受益匪浅！', time: '2小时前' },
        { id: '2', author: '读者B', content: '期待下一篇关于 Suspense 的文章', time: '5小时前' }
      ]
    }
  }
];

presetTemplates.forEach((tpl) => {
  const id = uuidv4();
  templatesStore.set(id, { id, ...tpl });
});

router.get('/', (_req, res) => {
  const templates = Array.from(templatesStore.values());
  res.json({ code: 0, data: templates, message: 'success' });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const template = templatesStore.get(id);
  if (!template) {
    res.status(404).json({ code: 404, data: null, message: '模板不存在' });
    return;
  }
  res.json({ code: 0, data: template, message: 'success' });
});

export default router;
