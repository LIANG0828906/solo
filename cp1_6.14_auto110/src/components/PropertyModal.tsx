import React, { useState, useEffect } from 'react';
import { TreeNodeData, NodeType, ConditionOperator, ActionType } from '@/types/behaviorTree';

type ConditionType = 'playerDistance' | 'health' | 'hasCover';

interface ConditionProperties {
  conditionType: ConditionType;
  operator: ConditionOperator;
  threshold: number;
}

interface ActionProperties {
  actionType: ActionType;
  speed?: number;
}

type NodeProperties = ConditionProperties | ActionProperties;

interface SaveProperties {
  label: string;
  [key: string]: unknown;
}

function isConditionType(value: unknown): value is ConditionType {
  return value === 'playerDistance' || value === 'health' || value === 'hasCover';
}

function isConditionOperator(value: unknown): value is ConditionOperator {
  return value === 'lt' || value === 'lte' || value === 'gt' || value === 'gte' || value === 'eq';
}

function isActionType(value: unknown): value is ActionType {
  return value === 'move' || value === 'attack' || value === 'hide' || value === 'idle';
}

interface PropertyModalProps {
  node: TreeNodeData | null;
  onClose: () => void;
  onSave: (id: string, properties: SaveProperties) => void;
}

interface SelectOption<T> {
  value: T;
  label: string;
}

const conditionTypeOptions: SelectOption<ConditionType>[] = [
  { value: 'playerDistance', label: '玩家距离' },
  { value: 'health', label: '生命值' },
  { value: 'hasCover', label: '是否有掩体' },
];

const operatorOptions: SelectOption<ConditionOperator>[] = [
  { value: 'lt', label: '小于' },
  { value: 'lte', label: '小于等于' },
  { value: 'gt', label: '大于' },
  { value: 'gte', label: '大于等于' },
  { value: 'eq', label: '等于' },
];

const actionTypeOptions: SelectOption<ActionType>[] = [
  { value: 'move', label: '移动' },
  { value: 'attack', label: '攻击' },
  { value: 'hide', label: '躲藏' },
  { value: 'idle', label: '待机' },
];

const nodeTypeLabels: Record<NodeType, string> = {
  selector: '选择器',
  sequence: '顺序器',
  condition: '条件节点',
  action: '动作节点',
};

export default function PropertyModal({ node, onClose, onSave }: PropertyModalProps) {
  const [label, setLabel] = useState<string>('');
  const [conditionType, setConditionType] = useState<ConditionType>('playerDistance');
  const [operator, setOperator] = useState<ConditionOperator>('lt');
  const [threshold, setThreshold] = useState<number>(0);
  const [actionType, setActionType] = useState<ActionType>('idle');
  const [speed, setSpeed] = useState<number | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (node) {
      setLabel(node.label || '');
      if (node.type === 'condition') {
        const propConditionType = node.properties.conditionType;
        const propOperator = node.properties.operator;
        const propThreshold = node.properties.threshold;
        
        setConditionType(isConditionType(propConditionType) ? propConditionType : 'playerDistance');
        setOperator(isConditionOperator(propOperator) ? propOperator : 'lt');
        setThreshold(typeof propThreshold === 'number' ? propThreshold : 0);
      } else if (node.type === 'action') {
        const propActionType = node.properties.actionType;
        const propSpeed = node.properties.speed;
        
        setActionType(isActionType(propActionType) ? propActionType : 'idle');
        setSpeed(typeof propSpeed === 'number' ? propSpeed : undefined);
      }
    }
  }, [node]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!label.trim()) {
      newErrors.label = '名称不能为空';
    }
    
    if (node?.type === 'condition') {
      if (!conditionType) {
        newErrors.conditionType = '条件类型不能为空';
      }
      if (!operator) {
        newErrors.operator = '操作符不能为空';
      }
      if (threshold === undefined || threshold === null) {
        newErrors.threshold = '阈值不能为空';
      }
    }
    
    if (node?.type === 'action') {
      if (!actionType) {
        newErrors.actionType = '动作类型不能为空';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!node || !validate()) return;

    const properties: SaveProperties = { label };
    
    if (node.type === 'condition') {
      properties.conditionType = conditionType;
      properties.operator = operator;
      properties.threshold = threshold;
    } else if (node.type === 'action') {
      properties.actionType = actionType;
      if (speed !== undefined) {
        properties.speed = speed;
      }
    }
    
    onSave(node.id, properties);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!node) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-bg-secondary border border-gray-700 rounded-lg shadow-2xl w-full max-w-md animate-expand">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-text-primary">
            {nodeTypeLabels[node.type]} - {label || '未命名'}
          </h2>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={`w-full px-3 py-2 bg-bg-primary border ${errors.label ? 'border-red-500' : 'border-gray-600'} rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="请输入节点名称"
            />
            {errors.label && <p className="mt-1 text-sm text-red-500">{errors.label}</p>}
          </div>

          {node.type === 'condition' && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  条件类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={conditionType}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isConditionType(value)) {
                      setConditionType(value);
                    }
                  }}
                  className={`w-full px-3 py-2 bg-bg-primary border ${errors.conditionType ? 'border-red-500' : 'border-gray-600'} rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  {conditionTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.conditionType && <p className="mt-1 text-sm text-red-500">{errors.conditionType}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  操作符 <span className="text-red-500">*</span>
                </label>
                <select
                  value={operator}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isConditionOperator(value)) {
                      setOperator(value);
                    }
                  }}
                  className={`w-full px-3 py-2 bg-bg-primary border ${errors.operator ? 'border-red-500' : 'border-gray-600'} rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  {operatorOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.operator && <p className="mt-1 text-sm text-red-500">{errors.operator}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  阈值 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className={`w-full px-3 py-2 bg-bg-primary border ${errors.threshold ? 'border-red-500' : 'border-gray-600'} rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="请输入阈值"
                />
                {errors.threshold && <p className="mt-1 text-sm text-red-500">{errors.threshold}</p>}
              </div>
            </>
          )}

          {node.type === 'action' && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  动作类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={actionType}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isActionType(value)) {
                      setActionType(value);
                    }
                  }}
                  className={`w-full px-3 py-2 bg-bg-primary border ${errors.actionType ? 'border-red-500' : 'border-gray-600'} rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  {actionTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.actionType && <p className="mt-1 text-sm text-red-500">{errors.actionType}</p>}
              </div>

              {actionType === 'move' && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    速度 (可选)
                  </label>
                  <input
                    type="number"
                    value={speed ?? ''}
                    onChange={(e) => setSpeed(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-bg-primary border border-gray-600 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入移动速度"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-text-primary rounded-md transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
