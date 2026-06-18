'use client';

import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Send } from 'lucide-react';
import { RatingStars } from './RatingStars';
import { FlavorTagPill } from './FlavorTagPill';
import { useUserStore } from '@/store/userStore';
import type { RoastLevel } from '@prisma/client';
import type { FlavorTag, CoffeeRecord } from '@/store/userStore';

const ROAST_OPTIONS: Array<{ value: RoastLevel; label: string; desc: string }> = [
  { value: 'LIGHT', label: '浅焙', desc: '明亮花果酸' },
  { value: 'MEDIUM', label: '中焙', desc: '平衡甜感' },
  { value: 'DARK', label: '深焙', desc: '醇厚浓郁' },
  { value: 'EXTRA_DARK', label: '极深', desc: '烟熏炭烧' },
];

export function CreateRecordModal() {
  const isOpen = useUserStore((s) => s.isCreateModalOpen);
  const closeModal = useUserStore((s) => s.closeCreateModal);
  const addRecord = useUserStore((s) => s.addRecord);
  const availableTags = useUserStore((s) => s.flavorTags);

  const [step, setStep] = useState<'form' | 'submitting' | 'success' | 'error'>('form');
  const [coffeeName, setCoffeeName] = useState('');
  const [roastLevel, setRoastLevel] = useState<RoastLevel>('MEDIUM');
  const [rating, setRating] = useState(4);
  const [notes, setNotes] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setCoffeeName('');
      setRoastLevel('MEDIUM');
      setRating(4);
      setNotes('');
      setSelectedTagIds([]);
      setErrorMsg('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeModal]);

  useEffect(() => {
    if (isOpen && availableTags.length === 0) {
      fetch('/api/flavor-tags')
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            useUserStore.getState().setFlavorTags(d.data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, availableTags.length]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, tagId];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!coffeeName.trim()) {
      setErrorMsg('请输入咖啡名称');
      return;
    }
    if (selectedTagIds.length === 0) {
      setErrorMsg('请至少选择1个风味标签');
      return;
    }

    setStep('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coffeeName,
          roastLevel,
          rating,
          notes: notes || undefined,
          flavorTagIds: selectedTagIds,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const createdRecord: CoffeeRecord = {
          ...data.data,
          createdAt: new Date(data.data.createdAt).toISOString(),
        };
        addRecord(createdRecord);
        setStep('success');
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        setErrorMsg(data.error || '提交失败');
        setStep('error');
        setTimeout(() => setStep('form'), 2000);
      }
    } catch {
      setErrorMsg('网络错误，请稍后重试');
      setStep('error');
      setTimeout(() => setStep('form'), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={closeModal}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto glass-card p-6 md:p-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/20 mb-3">
            <span className="text-yellow-400">☕</span>
            <span className="text-xs font-medium text-yellow-300">新记录</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white">
            记录你的咖啡时光
          </h2>
          <p className="text-sm text-white/50 mt-1">
            保存这一刻的风味与心情
          </p>
        </div>

        {step === 'success' ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-6 shadow-lg shadow-emerald-500/30 animate-pulse-wave">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white mb-2">记录成功！</h3>
            <p className="text-white/60">你的味觉档案又丰富了一点 ✨</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                咖啡名称 <span className="text-orange-400">*</span>
              </label>
              <input
                type="text"
                value={coffeeName}
                onChange={(e) => setCoffeeName(e.target.value)}
                placeholder="例如：埃塞俄比亚 耶加雪菲"
                className="input-field"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">
                烘焙度
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {ROAST_OPTIONS.map((opt) => {
                  const active = roastLevel === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRoastLevel(opt.value)}
                      className={`p-3 rounded-xl text-left transition-all duration-300 border ${
                        active
                          ? 'bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-yellow-400/50 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="font-semibold text-sm mb-0.5">{opt.label}</div>
                      <div className="text-[10px] opacity-70">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-white/80">
                  风味标签
                </label>
                <span className="text-xs text-white/40">
                  已选 {selectedTagIds.length}/3
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTags.length === 0 && (
                  <p className="text-xs text-white/40">加载标签中...</p>
                )}
                {availableTags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);
                  const disabled = !selected && selectedTagIds.length >= 3;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      disabled={disabled}
                      className={`flavor-pill px-4 py-2 transition-all duration-200 border-2 ${
                        selected
                          ? 'border-white/60 scale-105 shadow-lg'
                          : disabled
                          ? 'opacity-30 cursor-not-allowed border-transparent'
                          : 'border-transparent opacity-60 hover:opacity-90'
                      }`}
                      style={{ backgroundColor: tag.color }}
                    >
                      {selected && <Check className="w-3 h-3 inline mr-1" />}
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">
                给它打个分吧
              </label>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <RatingStars value={rating} onChange={setRating} size="lg" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                品鉴笔记 <span className="text-white/40 text-xs">（可选）</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="今天这杯咖啡让你想到了什么？..."
                className="input-field min-h-[90px] resize-none"
                maxLength={200}
              />
              <div className="mt-1 text-right text-[10px] text-white/30">
                {notes.length}/200
              </div>
            </div>

            {errorMsg && step !== 'submitting' && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={step === 'submitting'}
              className="w-full coffee-btn-primary py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
            >
              {step === 'submitting' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  保存味觉记忆
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
