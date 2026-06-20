import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { TimelineEvent, TimelineState } from '@/types';

const initialEvents: TimelineEvent[] = [
  {
    id: uuidv4(),
    date: '2020-09-01',
    title: '踏入大学校园',
    summary: '怀揣着对未来的憧憬，我踏入了大学校门，开始了全新的学习生活。',
    description: '那天阳光明媚，我拖着行李箱，带着父母的期望，走进了梦寐以求的大学校园。一切都是那么新鲜，新的同学、新的老师、新的环境。我在心里暗暗发誓，一定要珍惜这四年时光，努力学习，不断成长。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=university%20campus%20gate%20with%20students%20sunny%20day&image_size=square',
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 6,
  },
  {
    id: uuidv4(),
    date: '2022-06-15',
    title: '第一次实习',
    summary: '获得了第一份实习机会，在一家科技公司担任前端开发实习生。',
    description: '经过层层面试，我终于获得了第一份实习工作。作为前端开发实习生，我参与了公司官网的重构项目。虽然刚开始遇到了很多困难，但在同事们的帮助下，我快速成长，学到了很多实用的技术和工作方法。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20office%20desk%20with%20laptop%20code%20on%20screen&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=team%20meeting%20brainstorming%20whiteboard&image_size=square',
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 4,
  },
  {
    id: uuidv4(),
    date: '2023-08-20',
    title: '毕业旅行',
    summary: '和朋友们一起去云南旅行，度过了难忘的两周时光。',
    description: '大学毕业前夕，我和三位最好的朋友一起去了云南。我们走遍了大理、丽江、香格里拉，在洱海边骑行，在古城漫步，在玉龙雪山下合影。这次旅行不仅让我领略了祖国的大好河山，更让我收获了珍贵的友谊回忆。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=erhai%20lake%20yunnan%20china%20scenic%20view&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ancient%20town%20lijiang%20china%20traditional%20architecture&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=jade%20dragon%20snow%20mountain%20yunnan&image_size=square',
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 3,
  },
  {
    id: uuidv4(),
    date: '2024-03-10',
    title: '正式入职',
    summary: '毕业后正式入职心仪的互联网公司，成为一名前端工程师。',
    description: '经过激烈的校招竞争，我顺利拿到了心仪公司的offer。3月10日是我正式入职的日子，我怀着激动又紧张的心情走进了公司大楼。新的征程开始了，我要在这里实现自己的职业理想。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=software%20engineer%20working%20modern%20tech%20office&image_size=square',
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 2,
  },
  {
    id: uuidv4(),
    date: '2025-12-25',
    title: '项目上线',
    summary: '负责的核心项目成功上线，获得公司年度最佳项目奖。',
    description: '经过半年的艰苦奋斗，我作为技术负责人带领团队完成了公司核心业务系统的重构。项目在圣诞节当天成功上线，用户反馈非常好，我们也因此获得了公司年度最佳项目奖。这一刻，所有的付出都值得了。',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=team%20celebrating%20project%20launch%20office%20confetti&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=award%20trophy%20ceremony%20success&image_size=square',
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 180,
  },
  {
    id: uuidv4(),
    date: '2026-06-18',
    title: '晋升高级工程师',
    summary: '工作两年后顺利晋升为高级前端工程师。',
    description: '今天是值得纪念的一天，公司正式通知我晋升为高级前端工程师。回顾这两年的成长，从一个懵懂的新人到能够独立负责复杂项目，付出的汗水和努力都得到了回报。感谢所有帮助过我的人，这是一个新的起点，我会继续加油！',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=career%20promotion%20celebration%20professional&image_size=square',
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
];

export const useTimelineStore = create<TimelineState>((set) => ({
  events: initialEvents,
  expandedIds: new Set<string>(),

  addEvent: (event) =>
    set((state) => ({
      events: [
        ...state.events,
        {
          ...event,
          id: uuidv4(),
          createdAt: Date.now(),
        },
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    })),

  toggleExpand: (id) =>
    set((state) => {
      const newExpandedIds = new Set(state.expandedIds);
      if (newExpandedIds.has(id)) {
        newExpandedIds.delete(id);
      } else {
        newExpandedIds.add(id);
      }
      return { expandedIds: newExpandedIds };
    }),
}));
