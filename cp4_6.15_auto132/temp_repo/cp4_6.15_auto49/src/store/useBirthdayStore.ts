/**
 * useBirthdayStore - Zustand 全局状态管理
 *
 * 职责：
 *   管理生日提醒应用的全局状态，包括生日记录（Person）、提醒配置（Reminder）、
 *   以及各种 UI 弹窗的开关状态。所有状态变更都会自动持久化到 localStorage，
 *   确保刷新页面后数据不丢失。
 *
 * 状态（State）：
 *   - people: Person[]              所有生日记录列表
 *   - reminders: Reminder[]          提醒配置列表
 *   - selectedPerson: Person | null  当前选中的生日记录（用于弹窗展示）
 *   - isGiftModalOpen: boolean       礼物推荐弹窗开关
 *   - isAddModalOpen: boolean        新增生日弹窗开关
 *   - isEditModalOpen: boolean       编辑生日弹窗开关
 *   - newestPersonId: string | null  最新添加的记录ID（用于新卡片动画）
 *
 * Actions（操作方法）：
 *   - 增删改查：addPerson、updatePerson、deletePerson、selectPerson
 *   - 弹窗控制：openGiftModal、closeGiftModal、openAddModal、closeAddModal、
 *               openEditModal、closeEditModal
 *   - 数据持久化：saveToStorage、loadFromStorage
 *   - 其他：exportToJSON（导出数据）、clearNewestPersonId（清除新卡片标记）
 *
 * 数据流向：
 *   React 组件
 *     → 调用 Store Action（如 addPerson）
 *     → 更新 Store 内部状态（set()）
 *     → 自动触发 saveToStorage() 持久化到 localStorage
 *     → Zustand 通知所有订阅该状态的组件重新渲染
 *
 * 持久化：
 *   使用 localStorage key: 'birthday-reminder-data'
 *   存储结构：{ people: Person[], reminders: Reminder[] }
 */
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Person, Reminder } from '@/types';
import { hashStringToColor } from '@/utils/colorUtils';

interface BirthdayState {
  people: Person[];
  reminders: Reminder[];
  selectedPerson: Person | null;
  isGiftModalOpen: boolean;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  newestPersonId: string | null;

  addPerson: (person: Omit<Person, 'id' | 'createdAt' | 'avatarColor'>) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  selectPerson: (person: Person | null) => void;
  openGiftModal: (person: Person) => void;
  closeGiftModal: () => void;
  openAddModal: () => void;
  closeAddModal: () => void;
  openEditModal: (person: Person) => void;
  closeEditModal: () => void;
  exportToJSON: () => void;
  loadFromStorage: () => void;
  clearNewestPersonId: () => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'birthday-reminder-data';

export const useBirthdayStore = create<BirthdayState>((set, get) => ({
  people: [],
  reminders: [],
  selectedPerson: null,
  isGiftModalOpen: false,
  isAddModalOpen: false,
  isEditModalOpen: false,
  newestPersonId: null,

  /**
   * 新增一条生日记录
   * 自动生成唯一ID、创建时间戳和头像颜色
   * 同时设置 newestPersonId 用于触发新卡片滑入动画
   * 操作完成后自动持久化到 localStorage
   * @param personData - 除 id/createdAt/avatarColor 外的 Person 字段
   */
  addPerson: (personData) => {
    const newPerson: Person = {
      ...personData,
      id: uuidv4(),
      createdAt: Date.now(),
      avatarColor: hashStringToColor(personData.name),
    };

    set((state) => ({
      people: [...state.people, newPerson],
      newestPersonId: newPerson.id,
    }));

    get().saveToStorage();
  },

  /**
   * 更新指定ID的生日记录
   * 使用不可变方式（map + 对象展开）更新数组中的对应项
   * 操作完成后自动持久化到 localStorage
   * @param id - 要更新的记录ID
   * @param updates - 要更新的字段（Partial<Person>）
   */
  updatePerson: (id, updates) => {
    set((state) => ({
      people: state.people.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
    get().saveToStorage();
  },

  /**
   * 删除指定ID的生日记录
   * 使用 filter 过滤掉对应ID的记录
   * 操作完成后自动持久化到 localStorage
   * @param id - 要删除的记录ID
   */
  deletePerson: (id) => {
    set((state) => ({
      people: state.people.filter((p) => p.id !== id),
    }));
    get().saveToStorage();
  },

  /**
   * 设置当前选中的生日记录
   * 通常在打开弹窗或查看详情前调用
   * 传入 null 可清除选中状态
   * @param person - 选中的 Person 对象或 null
   */
  selectPerson: (person) => {
    set({ selectedPerson: person });
  },

  /**
   * 打开礼物推荐弹窗
   * 同时设置 selectedPerson 为当前操作的记录
   * @param person - 要推荐礼物的目标人物
   */
  openGiftModal: (person) => {
    set({ selectedPerson: person, isGiftModalOpen: true });
  },

  /**
   * 关闭礼物推荐弹窗
   * 仅关闭弹窗，保留 selectedPerson 状态
   */
  closeGiftModal: () => {
    set({ isGiftModalOpen: false });
  },

  /**
   * 打开新增生日记录弹窗
   */
  openAddModal: () => {
    set({ isAddModalOpen: true });
  },

  /**
   * 关闭新增生日记录弹窗
   */
  closeAddModal: () => {
    set({ isAddModalOpen: false });
  },

  /**
   * 打开编辑生日记录弹窗
   * 同时设置 selectedPerson 为当前编辑的记录
   * @param person - 要编辑的目标人物
   */
  openEditModal: (person) => {
    set({ selectedPerson: person, isEditModalOpen: true });
  },

  /**
   * 关闭编辑生日记录弹窗
   * 仅关闭弹窗，保留 selectedPerson 状态
   */
  closeEditModal: () => {
    set({ isEditModalOpen: false });
  },

  /**
   * 将所有生日数据导出为 JSON 文件并下载
   * 导出内容包括 people、reminders 和导出时间戳
   * 文件名格式：birthday-reminder-{timestamp}.json
   * 使用 Blob + 动态 a 标签实现浏览器端文件下载
   */
  exportToJSON: () => {
    const state = get();
    const data = {
      people: state.people,
      reminders: state.reminders,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `birthday-reminder-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * 从 localStorage 加载持久化数据
   * 应用启动时（App.tsx useEffect）调用一次
   * 解析失败会打印错误但不抛出异常，保证应用正常启动
   */
  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({
          people: data.people || [],
          reminders: data.reminders || [],
        });
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  },

  /**
   * 清除最新添加记录的ID标记
   * 新卡片滑入动画结束后由 BirthdayCard 组件调用
   * 避免同一卡片重复触发动画
   */
  clearNewestPersonId: () => {
    set({ newestPersonId: null });
  },

  /**
   * 将当前状态持久化到 localStorage
   * 每次增删改操作后自动调用（addPerson/updatePerson/deletePerson）
   * 存储内容：people 数组和 reminders 数组
   * 写入失败会打印错误但不抛出异常
   */
  saveToStorage: () => {
    try {
      const state = get();
      const data = {
        people: state.people,
        reminders: state.reminders,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  },
}));
