import { useState, useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { Expense, Activity, Participant } from '@/types';
import { useStore } from '@/store/useStore';
import ParticipantAvatar from './ParticipantAvatar';

interface ExpenseCardProps {
  expense: Expense;
  activity: Activity;
}

interface SplitDetail {
  participant: Participant;
  amount: number;
  isPayer: boolean;
  owes: number;
}

const splitTypeLabels: Record<Expense['splitType'], string> = {
  equal: '均摊',
  custom: '自定义',
  full: '全包',
};

const splitTypeColors: Record<Expense['splitType'], string> = {
  equal: 'bg-green-100 text-green-700',
  custom: 'bg-blue-100 text-blue-700',
  full: 'bg-amber-100 text-amber-700',
};

export default function ExpenseCard({ expense, activity }: ExpenseCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDescription, setEditDescription] = useState(expense.description);
  const [editAmount, setEditAmount] = useState(expense.amount.toString());
  const [editPayerId, setEditPayerId] = useState(expense.payerId);
  const [editSplitType, setEditSplitType] = useState<Expense['splitType']>(expense.splitType);
  const [editParticipants, setEditParticipants] = useState<string[]>(expense.participants);
  const [editCustomRatios, setEditCustomRatios] = useState<Record<string, number>>(
    expense.customRatios || {}
  );

  const { updateExpense, deleteExpense } = useStore();

  const payer = useMemo(
    () => activity.participants.find(p => p.id === expense.payerId),
    [activity.participants, expense.payerId]
  );

  const splitDetails = useMemo((): SplitDetail[] => {
    const details: SplitDetail[] = [];
    const participantCount = expense.participants.length;

    if (participantCount === 0) return details;

    for (const participantId of expense.participants) {
      const participant = activity.participants.find(p => p.id === participantId);
      if (!participant) continue;

      let amount = 0;
      const isPayer = participantId === expense.payerId;

      switch (expense.splitType) {
        case 'equal':
          amount = expense.amount / participantCount;
          break;
        case 'custom': {
          const ratio = expense.customRatios?.[participantId] || 0;
          const totalRatio = Object.values(expense.customRatios || {}).reduce((a, b) => a + b, 0);
          amount = totalRatio > 0 ? (expense.amount * ratio) / totalRatio : 0;
          break;
        }
        case 'full':
          amount = isPayer ? expense.amount : 0;
          break;
      }

      const owes = isPayer ? expense.amount - amount : -amount;

      details.push({
        participant,
        amount: Math.round(amount * 100) / 100,
        isPayer,
        owes: Math.round(owes * 100) / 100,
      });
    }

    return details;
  }, [expense, activity.participants]);

  const editSplitDetails = useMemo((): SplitDetail[] => {
    const details: SplitDetail[] = [];
    const amount = parseFloat(editAmount) || 0;
    const participantCount = editParticipants.length;

    if (participantCount === 0 || amount <= 0) return details;

    for (const participantId of editParticipants) {
      const participant = activity.participants.find(p => p.id === participantId);
      if (!participant) continue;

      let share = 0;
      const isPayer = participantId === editPayerId;

      switch (editSplitType) {
        case 'equal':
          share = amount / participantCount;
          break;
        case 'custom': {
          const ratio = editCustomRatios[participantId] || 0;
          const totalRatio = Object.values(editCustomRatios).reduce((a, b) => a + b, 0);
          share = totalRatio > 0 ? (amount * ratio) / totalRatio : 0;
          break;
        }
        case 'full':
          share = isPayer ? amount : 0;
          break;
      }

      const owes = isPayer ? amount - share : -share;

      details.push({
        participant,
        amount: Math.round(share * 100) / 100,
        isPayer,
        owes: Math.round(owes * 100) / 100,
      });
    }

    return details;
  }, [editAmount, editSplitType, editParticipants, editPayerId, editCustomRatios, activity.participants]);

  useEffect(() => {
    if (editSplitType === 'custom' && editParticipants.length > 0) {
      const newRatios: Record<string, number> = {};
      for (const pid of editParticipants) {
        newRatios[pid] = editCustomRatios[pid] ?? 1;
      }
      for (const key of Object.keys(editCustomRatios)) {
        if (!editParticipants.includes(key)) {
          delete newRatios[key];
        }
      }
      if (Object.keys(newRatios).length !== Object.keys(editCustomRatios).length ||
          Object.entries(newRatios).some(([k, v]) => editCustomRatios[k] !== v)) {
        setEditCustomRatios(newRatios);
      }
    }
  }, [editSplitType, editParticipants]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEditSubmit = () => {
    const amount = parseFloat(editAmount);
    if (!editDescription.trim() || isNaN(amount) || amount <= 0 || !editPayerId) {
      return;
    }

    updateExpense(activity.id, expense.id, {
      description: editDescription.trim(),
      amount,
      payerId: editPayerId,
      splitType: editSplitType,
      participants: editParticipants,
      customRatios: editSplitType === 'custom' ? editCustomRatios : undefined,
    });

    setIsEditModalOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm(`确定要删除「${expense.description}」吗？`)) {
      deleteExpense(activity.id, expense.id);
    }
  };

  const toggleParticipant = (participantId: string) => {
    setEditParticipants(prev =>
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const handleRatioChange = (participantId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditCustomRatios(prev => ({
      ...prev,
      [participantId]: Math.max(0, numValue),
    }));
  };

  return (
    <>
      <div className={cn('expense-card')} style={{ borderRadius: '12px' }}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <ParticipantAvatar participant={payer} size="md" isPayer />
            <div>
              <h3 className="font-semibold text-lg" style={{ color: '#4A3B32' }}>
                {expense.description}
              </h3>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full mt-1 inline-block',
                  splitTypeColors[expense.splitType]
                )}
              >
                {splitTypeLabels[expense.splitType]}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold" style={{ color: '#D4A574' }}>
              ¥{expense.amount.toFixed(2)}
            </div>
            <div className="text-xs opacity-70" style={{ color: '#4A3B32' }}>
              {formatDate(expense.timestamp)}
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          {splitDetails.map(detail => (
            <div
              key={detail.participant.id}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <ParticipantAvatar participant={detail.participant} size="sm" isPayer={detail.isPayer} />
                <span style={{ color: '#4A3B32' }}>{detail.participant.name}</span>
                {detail.isPayer && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                    付款
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span style={{ color: '#4A3B32' }}>
                  分摊: ¥{detail.amount.toFixed(2)}
                </span>
                <span
                  className={cn(
                    'font-medium',
                    detail.owes > 0 ? 'text-green-600' : detail.owes < 0 ? 'text-red-500' : 'text-gray-400'
                  )}
                >
                  {detail.owes > 0 ? `+¥${detail.owes.toFixed(2)}` :
                   detail.owes < 0 ? `-¥${Math.abs(detail.owes).toFixed(2)}` :
                   '¥0.00'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: '#E0D5C1' }}>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-3 py-1.5 text-sm rounded-lg transition-colors"
            style={{ backgroundColor: '#F7F1E3', color: '#4A3B32' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E8E0D0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F7F1E3'}
          >
            编辑
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm rounded-lg text-white transition-colors"
            style={{ backgroundColor: '#FF6B6B' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FF5252'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FF6B6B'}
          >
            删除
          </button>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsEditModalOpen(false)}>
          <div
            className="glass-card w-full max-w-md mx-4 p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
            style={{ borderRadius: '12px' }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: '#4A3B32' }}>
              编辑支出
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#4A3B32' }}>
                  描述
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E0D5C1', backgroundColor: '#F7F1E3' }}
                  placeholder="晚餐、打车..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#4A3B32' }}>
                  金额 (¥)
                </label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E0D5C1', backgroundColor: '#F7F1E3' }}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#4A3B32' }}>
                  付款人
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {activity.participants.map(participant => (
                    <button
                      key={participant.id}
                      onClick={() => setEditPayerId(participant.id)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
                        editPayerId === participant.id ? 'ring-2' : 'opacity-60 hover:opacity-100'
                      )}
                      style={{
                        backgroundColor: '#F7F1E3',
                      }}
                      data-ring-color="#D4A574"
                    >
                      <ParticipantAvatar
                        participant={participant}
                        size="sm"
                        isPayer={editPayerId === participant.id}
                      />
                      <span className="text-xs truncate w-full text-center" style={{ color: '#4A3B32' }}>
                        {participant.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#4A3B32' }}>
                  分摊方式
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['equal', 'custom', 'full'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setEditSplitType(type)}
                      className={cn(
                        'py-2 px-3 rounded-lg text-sm font-medium transition-all',
                        editSplitType === type
                          ? 'text-white'
                          : 'bg-transparent border hover:bg-gray-50'
                      )}
                      style={{
                        backgroundColor: editSplitType === type ? '#D4A574' : 'transparent',
                        borderColor: '#E0D5C1',
                        color: editSplitType === type ? 'white' : '#4A3B32',
                      }}
                    >
                      {splitTypeLabels[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#4A3B32' }}>
                  参与人员
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                  {activity.participants.map(participant => (
                    <label
                      key={participant.id}
                      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer"
                      style={{ backgroundColor: '#F7F1E3' }}
                    >
                      <input
                        type="checkbox"
                        checked={editParticipants.includes(participant.id)}
                        onChange={() => toggleParticipant(participant.id)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: '#D4A574' }}
                      />
                      <ParticipantAvatar participant={participant} size="sm" />
                      <span className="flex-1 text-sm" style={{ color: '#4A3B32' }}>
                        {participant.name}
                      </span>
                      {editSplitType === 'custom' && editParticipants.includes(participant.id) && (
                        <input
                          type="number"
                          value={editCustomRatios[participant.id] || 0}
                          onChange={e => handleRatioChange(participant.id, e.target.value)}
                          className="w-16 px-2 py-1 text-sm text-center rounded border"
                          style={{ borderColor: '#E0D5C1', backgroundColor: 'white' }}
                          min="0"
                        />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {editSplitDetails.length > 0 && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#F7F1E3' }}>
                  <h4 className="text-sm font-medium mb-2" style={{ color: '#4A3B32' }}>
                    实时预览
                  </h4>
                  <div className="space-y-1.5">
                    {editSplitDetails.map(detail => (
                      <div
                        key={detail.participant.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span style={{ color: '#4A3B32' }}>{detail.participant.name}</span>
                        <span
                          className={cn(
                            'font-medium',
                            detail.owes > 0 ? 'text-green-600' : detail.owes < 0 ? 'text-red-500' : 'text-gray-400'
                          )}
                        >
                          ¥{detail.amount.toFixed(2)}
                          {detail.owes !== 0 && (
                            <span className="text-xs ml-1 opacity-70">
                              ({detail.owes > 0 ? '+' : ''}¥{detail.owes.toFixed(2)})
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#F7F1E3', color: '#4A3B32' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E8E0D0'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F7F1E3'}
              >
                取消
              </button>
              <button
                onClick={handleEditSubmit}
                className="flex-1 py-2.5 rounded-lg font-medium text-white transition-colors"
                style={{ backgroundColor: '#D4A574' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#C19A6B'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#D4A574'}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
