import { create } from 'zustand';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import type {
  SandboxState,
  ComponentInstance,
  ComponentType,
  ComponentProps,
} from '../../types';
import { interactionLogger } from '../../moduleC/logger/InteractionLogger';
import { useMockStore } from '../../moduleB/store/mockStore';

interface SandboxStore extends SandboxState {
  selectComponent: (id: string | null) => void;
  updateComponentProps: (id: string, props: Partial<ComponentProps>) => void;
  addComponent: (type: ComponentType, props?: ComponentProps) => void;
  removeComponent: (id: string) => void;
  reorderComponents: (fromIndex: number, toIndex: number) => void;
  setDraggingComponent: (id: string | null) => void;
  setState: (state: SandboxState) => void;
}

const createInitialComponents = (): ComponentInstance[] => {
  const mockState = useMockStore.getState();
  return [
    {
      id: uuidv4(),
      type: 'input',
      props: {
        placeholder: mockState.getDataByKey('inputPlaceholder') || '请输入内容',
        value: '',
        disabled: false,
      },
    },
    {
      id: uuidv4(),
      type: 'button',
      props: {
        text: mockState.getDataByKey('buttonText') || '提交',
        disabled: false,
        variant: 'primary',
      },
    },
    {
      id: uuidv4(),
      type: 'switch',
      props: {
        checked: false,
        label: '启用功能',
        disabled: false,
      },
    },
    {
      id: uuidv4(),
      type: 'table',
      props: {
        dataKey: 'tableData',
        columns: ['id', 'name', 'age', 'department'],
      },
      mockDataKey: 'tableData',
    },
  ];
};

export const useSandboxStore = create<SandboxStore>((set) => ({
  components: createInitialComponents(),
  selectedComponentId: null,
  draggingComponentId: null,

  selectComponent: (id) => {
    set(
      produce((state: SandboxState) => {
        state.selectedComponentId = id;
      })
    );
    if (id) {
      interactionLogger.log('component_select', { componentId: id });
    }
  },

  updateComponentProps: (id, props) => {
    set(
      produce((state: SandboxState) => {
        const component = state.components.find((c) => c.id === id);
        if (component) {
          Object.assign(component.props, props);
        }
      })
    );
    interactionLogger.log('prop_change', { componentId: id, props });
  },

  addComponent: (type, props = {}) => {
    set(
      produce((state: SandboxState) => {
        state.components.push({
          id: uuidv4(),
          type,
          props,
        });
      })
    );
  },

  removeComponent: (id) => {
    set(
      produce((state: SandboxState) => {
        state.components = state.components.filter((c) => c.id !== id);
        if (state.selectedComponentId === id) {
          state.selectedComponentId = null;
        }
      })
    );
  },

  reorderComponents: (fromIndex, toIndex) => {
    set(
      produce((state: SandboxState) => {
        const [removed] = state.components.splice(fromIndex, 1);
        state.components.splice(toIndex, 0, removed);
      })
    );
    interactionLogger.log('component_reorder', { fromIndex, toIndex });
  },

  setDraggingComponent: (id) => {
    set(
      produce((state: SandboxState) => {
        state.draggingComponentId = id;
      })
    );
    if (id) {
      interactionLogger.log('component_drag_start', { componentId: id });
    }
  },

  setState: (newState) => {
    set(newState);
  },
}));
