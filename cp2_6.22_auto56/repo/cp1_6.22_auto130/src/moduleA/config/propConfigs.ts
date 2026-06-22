import type { ComponentType, PropEditorConfig } from '../../types';

export const propConfigs: Record<ComponentType, PropEditorConfig[]> = {
  input: [
    { key: 'placeholder', label: '占位文本', type: 'text' },
    { key: 'value', label: '当前值', type: 'text' },
    { key: 'disabled', label: '是否禁用', type: 'boolean' },
  ],
  button: [
    { key: 'text', label: '按钮文字', type: 'text' },
    { key: 'variant', label: '样式类型', type: 'select', options: ['primary', 'secondary', 'danger'] },
    { key: 'disabled', label: '是否禁用', type: 'boolean' },
  ],
  switch: [
    { key: 'label', label: '标签文字', type: 'text' },
    { key: 'checked', label: '是否选中', type: 'boolean' },
    { key: 'disabled', label: '是否禁用', type: 'boolean' },
  ],
  table: [
    { key: 'dataKey', label: '数据Key', type: 'text' },
    { key: 'columns', label: '列配置', type: 'json' },
  ],
};

export const componentTypeLabels: Record<ComponentType, string> = {
  input: '输入框',
  button: '按钮',
  switch: '开关',
  table: '表格',
};
