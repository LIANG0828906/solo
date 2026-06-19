import { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, GripVertical, Circle, Square, ListOrdered, Star, AlertCircle } from 'lucide-react';
import type { Vote, VoteType, CreateVoteRequest, UpdateVoteRequest } from '@/types';
import { VOTE_TYPE_LABELS, MAX_SCORE_DEFAULT } from '@/utils/constants';
import { useKanbanStore } from '@/store/kanbanStore';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

interface VoteCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  editVote?: Vote | null;
}

// 表单错误类型
interface FormErrors {
  title?: string;
  options?: string;
  deadline?: string;
  maxVoters?: string;
  maxScore?: string;
}

// 根据投票类型获取对应图标组件
const getTypeIcon = (type: VoteType) => {
  switch (type) {
    case 'single':
      return Circle;
    case 'multiple':
      return Square;
    case 'rank':
      return ListOrdered;
    case 'score':
      return Star;
    default:
      return Circle;
  }
};

export default function VoteCreator({ isOpen, onClose, editVote }: VoteCreatorProps) {
  const { createVote, updateVote } = useKanbanStore();

  // 表单状态
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<VoteType>('single');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [maxVoters, setMaxVoters] = useState<number>(50);
  const [maxScore, setMaxScore] = useState<number>(MAX_SCORE_DEFAULT);
  const [errors, setErrors] = useState<FormErrors>({});

  // 拖拽相关状态
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // 计算默认截止时间（7天后）
  const getDefaultDeadline = () => {
    return dayjs().add(7, 'day').format('YYYY-MM-DDTHH:mm');
  };

  // 打开时初始化表单
  useEffect(() => {
    if (isOpen) {
      if (editVote) {
        // 编辑模式
        setTitle(editVote.title);
        setDescription(editVote.description);
        setType(editVote.type);
        setOptions(editVote.options.map((o) => o.text));
        setIsAnonymous(editVote.isAnonymous);
        setDeadline(dayjs(editVote.deadline).format('YYYY-MM-DDTHH:mm'));
        setMaxVoters(editVote.maxVoters);
        setMaxScore(editVote.maxScore || MAX_SCORE_DEFAULT);
      } else {
        // 创建模式
        setTitle('');
        setDescription('');
        setType('single');
        setOptions(['', '']);
        setIsAnonymous(false);
        setDeadline(getDefaultDeadline());
        setMaxVoters(50);
        setMaxScore(MAX_SCORE_DEFAULT);
      }
      setErrors({});
    }
  }, [isOpen, editVote]);

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = '请输入投票标题';
    }

    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      newErrors.options = '至少需要2个有效选项';
    }

    if (!deadline) {
      newErrors.deadline = '请选择截止时间';
    } else if (dayjs(deadline).isBefore(dayjs())) {
      newErrors.deadline = '截止时间必须晚于当前时间';
    }

    if (maxVoters <= 0) {
      newErrors.maxVoters = '最大投票人数必须大于0';
    }

    if (type === 'score' && (maxScore < 0 || maxScore > 10)) {
      newErrors.maxScore = '最大评分必须在0-10之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) return;

    const validOptions = options.filter((o) => o.trim());

    if (editVote) {
      // 编辑模式
      const updateData: UpdateVoteRequest = {
        title: title.trim(),
        description: description.trim(),
        type,
        options: validOptions,
        isAnonymous,
        deadline: new Date(deadline).toISOString(),
        maxVoters,
        maxScore: type === 'score' ? maxScore : undefined,
      };
      await updateVote(editVote.id, updateData);
    } else {
      // 创建模式
      const createData: CreateVoteRequest = {
        title: title.trim(),
        description: description.trim(),
        type,
        options: validOptions,
        isAnonymous,
        deadline: new Date(deadline).toISOString(),
        maxVoters,
        maxScore: type === 'score' ? maxScore : undefined,
      };
      await createVote(createData);
    }

    onClose();
  };

  // 添加选项
  const addOption = () => {
    setOptions([...options, '']);
  };

  // 删除选项
  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  // 更新选项
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // 拖拽开始
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  // 拖拽经过
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const newOptions = [...options];
    const dragItem = newOptions[dragIndex];
    newOptions.splice(dragIndex, 1);
    newOptions.splice(index, 0, dragItem);
    setOptions(newOptions);
    setDragIndex(index);
  };

  // 拖拽结束
  const handleDragEnd = () => {
    setDragIndex(null);
  };

  if (!isOpen) return null;

  const voteTypes: VoteType[] = ['single', 'multiple', 'rank', 'score'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1f36] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white text-lg font-semibold">
            {editVote ? '编辑投票' : '创建投票'}
          </h2>
          <button
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              标题 <span className="text-[#ff7b54]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: undefined });
              }}
              placeholder="请输入投票标题"
              className={cn(
                'w-full px-4 py-2.5 bg-[#2a2f4a] border rounded-lg text-white placeholder-gray-500 text-sm transition-all duration-200 outline-none',
                errors.title
                  ? 'border-[#f44336] focus:border-[#f44336]'
                  : 'border-white/10 focus:border-[#4a90d9]'
              )}
            />
            {errors.title && (
              <p className="mt-1.5 text-xs text-[#f44336] flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.title}
              </p>
            )}
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入投票描述（可选）"
              rows={3}
              className="w-full px-4 py-2.5 bg-[#2a2f4a] border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm transition-all duration-200 outline-none focus:border-[#4a90d9] resize-none"
            />
          </div>

          {/* 投票类型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">投票类型</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {voteTypes.map((voteType) => {
                const Icon = getTypeIcon(voteType);
                const isSelected = type === voteType;
                return (
                  <button
                    key={voteType}
                    type="button"
                    onClick={() => setType(voteType)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 p-4 rounded-lg border transition-all duration-200',
                      isSelected
                        ? 'bg-[#4a90d9]/20 border-[#4a90d9] text-[#4a90d9]'
                        : 'bg-[#2a2f4a] border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                    )}
                  >
                    <Icon size={22} />
                    <span className="text-xs font-medium">
                      {VOTE_TYPE_LABELS[voteType]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 选项列表 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                选项 <span className="text-[#ff7b54]">*</span>
              </label>
              {type === 'rank' && (
                <span className="text-xs text-gray-500">拖拽排序</span>
              )}
            </div>

            <div className="space-y-2">
              {options.map((option, index) => {
                const Icon = getTypeIcon(type);
                return (
                  <div
                    key={index}
                    draggable={type === 'rank'}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'flex items-center gap-2 p-2 bg-[#2a2f4a] rounded-lg border transition-all duration-200',
                      dragIndex === index
                        ? 'border-[#4a90d9] opacity-60'
                        : 'border-white/10'
                    )}
                  >
                    {type === 'rank' && (
                      <div className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-white transition-colors px-1">
                        <GripVertical size={18} />
                      </div>
                    )}
                    <div className="text-[#4a90d9]">
                      <Icon size={16} />
                    </div>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`选项 ${index + 1}`}
                      className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none py-1.5"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      disabled={options.length <= 2}
                      className={cn(
                        'p-1.5 rounded transition-all duration-200',
                        options.length <= 2
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-gray-500 hover:text-[#ff7b54] hover:bg-white/10'
                      )}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            {errors.options && (
              <p className="mt-1.5 text-xs text-[#f44336] flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.options}
              </p>
            )}

            <button
              type="button"
              onClick={addOption}
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-2.5 border border-dashed border-white/15 rounded-lg text-gray-400 hover:text-white hover:border-[#4a90d9] hover:bg-[#4a90d9]/10 transition-all duration-200 text-sm"
            >
              <Plus size={16} />
              添加选项
            </button>
          </div>

          {/* 评分类型 - 最大分数 */}
          {type === 'score' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
              最大分数</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={maxScore}
                  onChange={(e) => {
                    setMaxScore(Number(e.target.value));
                    if (errors.maxScore) setErrors({ ...errors, maxScore: undefined });
                  }}
                  className="flex-1 accent-[#4a90d9]"
                />
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                  className={cn(
                    'w-20 px-3 py-2 bg-[#2a2f4a] border rounded-lg text-white text-sm text-center transition-all duration-200 outline-none',
                    errors.maxScore
                      ? 'border-[#f44336] focus:border-[#f44336]'
                      : 'border-white/10 focus:border-[#4a90d9]'
                  )}
                />
              </div>
              {errors.maxScore && (
                <p className="mt-1.5 text-xs text-[#f44336] flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.maxScore}
                </p>
              )}
            </div>
          )}

          {/* 匿名开关和截止时间 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 是否匿名 */}
            <div className="flex items-center justify-between p-4 bg-[#2a2f4a] rounded-lg border border-white/10">
              <div>
                <p className="text-sm font-medium text-white">匿名投票</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  投票者身份不公开</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-all duration-200',
                  isAnonymous ? 'bg-[#4a90d9]' : 'bg-white/15'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200',
                    isAnonymous ? 'left-[22px]' : 'left-0.5'
                  )}
                />
              </button>
            </div>

            {/* 截止时间 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                截止时间 <span className="text-[#ff7b54]">*</span>
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => {
                  setDeadline(e.target.value);
                  if (errors.deadline) setErrors({ ...errors, deadline: undefined });
                }}
                className={cn(
                  'w-full px-4 py-2.5 bg-[#2a2f4a] border rounded-lg text-white text-sm transition-all duration-200 outline-none',
                  errors.deadline
                    ? 'border-[#f44336] focus:border-[#f44336]'
                    : 'border-white/10 focus:border-[#4a90d9]'
                )}
              />
              {errors.deadline && (
                <p className="mt-1.5 text-xs text-[#f44336] flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.deadline}
                </p>
              )}
            </div>
          </div>

          {/* 最大投票人数 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              最大投票人数 <span className="text-[#ff7b54]">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={maxVoters}
              onChange={(e) => {
                setMaxVoters(Number(e.target.value));
                if (errors.maxVoters) setErrors({ ...errors, maxVoters: undefined });
              }}
              placeholder="请输入最大投票人数"
              className={cn(
                'w-full px-4 py-2.5 bg-[#2a2f4a] border rounded-lg text-white placeholder-gray-500 text-sm transition-all duration-200 outline-none',
                errors.maxVoters
                  ? 'border-[#f44336] focus:border-[#f44336]'
                  : 'border-white/10 focus:border-[#4a90d9]'
              )}
            />
            {errors.maxVoters && (
              <p className="mt-1.5 text-xs text-[#f44336] flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.maxVoters}
              </p>
            )}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-gray-300 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 text-sm text-white bg-[#4a90d9] hover:bg-[#5ba0e9] rounded-lg transition-all duration-200 font-medium"
          >
            {editVote ? '保存修改' : '创建投票'}
          </button>
        </div>
      </div>
    </div>
  );
}
