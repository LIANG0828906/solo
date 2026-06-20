import { get, set, createStore } from 'idb-keyval'
import { v4 as uuidv4 } from 'uuid'
import { formatISO, addDays } from 'date-fns'
import {
  Exhibition,
  Artwork,
  ArtworkStatus,
  MilestoneType,
  Milestone,
  Task,
  TransferType
} from '../types'

const customStore = createStore('curator-studio-db', 'curator-studio-store')

export const dbGet = async <T>(key: string): Promise<T | undefined> => {
  return get<T>(key, customStore)
}

export const dbSet = async <T>(key: string, value: T): Promise<void> => {
  return set(key, value, customStore)
}

const createSampleTasks = (titles: string[]): Task[] => {
  return titles.map((title, idx) => ({
    id: uuidv4(),
    title,
    completed: idx === 0,
    order: idx
  }))
}

const createSampleMilestones = (): Milestone[] => {
  return [
    {
      id: uuidv4(),
      type: MilestoneType.PREPARATION,
      title: '筹备阶段',
      week: 1,
      tasks: createSampleTasks(['确认策展主题与概念', '拟定艺术家名单', '制定预算方案', '联系场地租赁'])
    },
    {
      id: uuidv4(),
      type: MilestoneType.PREPARATION,
      title: '作品征集',
      week: 2,
      tasks: createSampleTasks(['发送艺术家邀请函', '确认参展作品清单', '作品运输保险洽谈', '拟定展陈方案初稿'])
    },
    {
      id: uuidv4(),
      type: MilestoneType.INSTALLATION,
      title: '布展准备',
      week: 4,
      tasks: createSampleTasks(['场地测量与动线规划', '灯光与设备调试', '作品运输到场', '作品标签与墙贴制作'])
    },
    {
      id: uuidv4(),
      type: MilestoneType.INSTALLATION,
      title: '现场布展',
      week: 5,
      tasks: createSampleTasks(['作品上墙与陈列', '灯光微调', '完成标签粘贴', '导览手册印刷'])
    },
    {
      id: uuidv4(),
      type: MilestoneType.OPENING,
      title: '开幕活动',
      week: 6,
      tasks: createSampleTasks(['媒体邀请函发送', '开幕酒会筹备', '艺术家导览安排', '开幕现场摄影记录'])
    },
    {
      id: uuidv4(),
      type: MilestoneType.EXHIBITION,
      title: '展期运营',
      week: 8,
      tasks: createSampleTasks(['日常展览维护', '公共教育活动', '学术对谈安排', '观众反馈收集'])
    },
    {
      id: uuidv4(),
      type: MilestoneType.TEARDOWN,
      title: '撤展与收尾',
      week: 12,
      tasks: createSampleTasks(['作品清点与下架', '作品包装运输', '场地恢复验收', '展览报告归档'])
    }
  ]
}

const createSampleArtworks = (): Artwork[] => {
  const now = new Date()
  return [
    {
      id: uuidv4(),
      name: '霓虹都市·雨夜',
      artist: '林野',
      year: 2024,
      material: '布面丙烯 · LED灯带',
      status: ArtworkStatus.IN_STOCK,
      transferRecords: [],
      createdAt: formatISO(now)
    },
    {
      id: uuidv4(),
      name: '数据迷宫 No.7',
      artist: '陈启明',
      year: 2023,
      material: '数码微喷 · 铝合金装框',
      status: ArtworkStatus.ON_EXHIBITION,
      transferRecords: [
        {
          id: uuidv4(),
          artworkId: '',
          type: TransferType.LEND,
          date: formatISO(addDays(now, -30)),
          institution: '上海当代艺术博物馆',
          expectedReturnDate: formatISO(addDays(now, 60)),
          notes: '参加"新媒体艺术三年展"',
          returned: false
        }
      ],
      createdAt: formatISO(addDays(now, -90))
    },
    {
      id: uuidv4(),
      name: '空山新雨',
      artist: '苏慕白',
      year: 2022,
      material: '纸本水墨 · 矿物质颜料',
      status: ArtworkStatus.LENT_OUT,
      transferRecords: [
        {
          id: uuidv4(),
          artworkId: '',
          type: TransferType.LEND,
          date: formatISO(addDays(now, -15)),
          institution: '苏州博物馆现代艺术厅',
          expectedReturnDate: formatISO(addDays(now, 45)),
          notes: '水墨当代性研究展',
          returned: false
        }
      ],
      createdAt: formatISO(addDays(now, -180))
    },
    {
      id: uuidv4(),
      name: '机械心脏',
      artist: '王磊',
      year: 2024,
      material: '综合材料 · 机械装置',
      status: ArtworkStatus.IN_STOCK,
      transferRecords: [],
      createdAt: formatISO(addDays(now, -20))
    },
    {
      id: uuidv4(),
      name: '记忆碎片 · 童年',
      artist: '张雨晴',
      year: 2023,
      material: '摄影 · 银盐纸基',
      status: ArtworkStatus.DAMAGED,
      transferRecords: [
        {
          id: uuidv4(),
          artworkId: '',
          type: TransferType.LEND,
          date: formatISO(addDays(now, -60)),
          institution: '北京今日美术馆',
          expectedReturnDate: formatISO(addDays(now, -10)),
          notes: '青年摄影群展',
          returned: true
        },
        {
          id: uuidv4(),
          artworkId: '',
          type: TransferType.RETURN,
          date: formatISO(addDays(now, -8)),
          institution: '北京今日美术馆',
          notes: '归还时发现画框轻微磕碰，待修复',
          returned: true
        }
      ],
      createdAt: formatISO(addDays(now, -200))
    },
    {
      id: uuidv4(),
      name: '赛博桃花源',
      artist: '林野',
      year: 2024,
      material: '布面综合材料',
      status: ArtworkStatus.IN_STOCK,
      transferRecords: [],
      createdAt: formatISO(addDays(now, -5))
    }
  ].map(a => ({
    ...a,
    transferRecords: a.transferRecords.map(r => ({ ...r, artworkId: a.id }))
  }))
}

const createSampleExhibitions = (): Exhibition[] => {
  const now = new Date()
  return [
    {
      id: uuidv4(),
      title: '赛博朋克重生',
      description: '探索数字时代下人类与科技边界的当代艺术展，汇集12位艺术家的新媒体与绘画作品。',
      startDate: formatISO(addDays(now, 30)),
      endDate: formatISO(addDays(now, 90)),
      milestones: createSampleMilestones(),
      createdAt: formatISO(addDays(now, -10))
    },
    {
      id: uuidv4(),
      title: '水墨新浪潮',
      description: '传统水墨语言的当代表达，呈现8位中青年艺术家在媒介与观念上的实验探索。',
      startDate: formatISO(addDays(now, 120)),
      endDate: formatISO(addDays(now, 180)),
      milestones: createSampleMilestones().slice(0, 4),
      createdAt: formatISO(addDays(now, -3))
    }
  ]
}

export const initializeSampleData = async (): Promise<void> => {
  const existingExhibitions = await dbGet<Exhibition[]>('exhibitions')
  const existingArtworks = await dbGet<Artwork[]>('artworks')

  if (!existingExhibitions || existingExhibitions.length === 0) {
    await dbSet('exhibitions', createSampleExhibitions())
  }
  if (!existingArtworks || existingArtworks.length === 0) {
    await dbSet('artworks', createSampleArtworks())
  }
}
