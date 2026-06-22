import { create } from 'zustand';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import type { MockState, MockDataItem } from '../../types';
import { interactionLogger } from '../../moduleC/logger/InteractionLogger';

interface MockStore extends MockState {
  addData: (key: string, value: any) => void;
  updateData: (id: string, key: string, value: any) => void;
  deleteData: (id: string) => void;
  getDataByKey: (key: string) => any;
  setState: (state: MockState) => void;
}

const createInitialMockData = (): MockDataItem[] => [
  {
    id: uuidv4(),
    key: 'tableData',
    value: [
      { id: 1, name: '张三', age: 28, department: '技术部' },
      { id: 2, name: '李四', age: 32, department: '产品部' },
      { id: 3, name: '王五', age: 25, department: '设计部' },
      { id: 4, name: '赵六', age: 30, department: '运营部' },
    ],
  },
  {
    id: uuidv4(),
    key: 'buttonText',
    value: '提交',
  },
  {
    id: uuidv4(),
    key: 'inputPlaceholder',
    value: '请输入内容...',
  },
];

export const useMockStore = create<MockStore>((set, get) => ({
  data: createInitialMockData(),

  addData: (key, value) => {
    set(
      produce((state: MockState) => {
        state.data.push({
          id: uuidv4(),
          key,
          value,
        });
      })
    );
    interactionLogger.log('mock_data_add', { key, value });
  },

  updateData: (id, key, value) => {
    set(
      produce((state: MockState) => {
        const item = state.data.find((d) => d.id === id);
        if (item) {
          item.key = key;
          item.value = value;
        }
      })
    );
    interactionLogger.log('mock_data_update', { id, key, value });
  },

  deleteData: (id) => {
    const item = get().data.find((d) => d.id === id);
    set(
      produce((state: MockState) => {
        state.data = state.data.filter((d) => d.id !== id);
      })
    );
    if (item) {
      interactionLogger.log('mock_data_delete', { id, key: item.key });
    }
  },

  getDataByKey: (key) => {
    const item = get().data.find((d) => d.key === key);
    return item ? item.value : undefined;
  },

  setState: (newState) => {
    set(newState);
  },
}));
