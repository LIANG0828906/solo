import { useEffect, useMemo, useRef, useState } from 'react';
import MaterialList from './MaterialList';
import ImageUploader from './ImageUploader';
import type { Work, Material, WorkImage } from '../types';

interface WorksDetailProps {
  work: Work | null;
  onUpdate: (id: string, patch: Partial<Work>) => Promise<Work | null>;
  onDelete?: (id: string) => void;
  onGenerateShare: () => void;
  showToast: (type: 'success' | 'error', msg: string) => void;
  isSaving: boolean;
}

export default function WorksDetail({
  work,
  onUpdate,
  onDelete,
  onGenerateShare,
  showToast,
  isSaving,
}: WorksDetailProps) {
  const [local, setLocal] = useState<Work | null>(work);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setLocal(work);
  }, [work?.id, work?.updatedAt]);

  const cost = useMemo(() => {
    if (!local) return 0;
    return (local.materials || []).reduce(
      (s, m) => s + (Number(m.unitPrice) || 0) * (Number(m.quantity) || 0),
      0,
    );
  }, [local]);
  const profit = local ? Number(local.price || 0) - cost : 0;

  const updateField = <K extends keyof Work>(key: K, val: Work[K]) => {
    if (!local) return;
    setLocal({ ...local, [key]: val });
  };

  const updateMaterials = (materials: Material[]) => updateField('materials', materials);
  const updateImages = (images: WorkImage[]) => updateField('images', images);

  useEffect(() => {
    if (!local || !work) return;
    if (local.updatedAt !== work.updatedAt) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      onUpdate(local.id, {
        name: local.name,
        category: local.category,
        salesChannel: local.salesChannel,
        price: Number(local.price) || 0,
        remark: local.remark,
        size: local.size,
        texture: local.texture,
        materials: local.materials,
        images: local.images,
      })
        .then((r) => {
          if (r) {
            setLocal((prev) => (prev ? { ...prev, updatedAt: r.updatedAt } : prev));
            showToast('success', '保存成功');
          }
        })
        .catch((e) => showToast('error', e?.message || '保存失败'));
    }, 600);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    local?.name,
    local?.category,
    local?.salesChannel,
    local?.price,
    local?.remark,
    local?.size,
    local?.texture,
    local?.materials,
    local?.images,
  ]);

  if (!local) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#64748B] bg-[#0B1222]">
        <div className="text-6xl mb-4 opacity-40">🎨</div>
        <div className="text-base mb-1">选择一件作品查看详情</div>
        <div className="text-xs text-[#475569]">或点击列表区右上角「新建」开始创作</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar bg-[#0B1222]">
      <div className="px-6 py-5 border-b border-[#1E293B] sticky top-0 z-20"
        style={{ background: 'rgba(11,18,34,0.92)', backdropFilter: 'blur(6px)' }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              className="!text-xl !font-semibold input-field !bg-transparent !border-transparent !px-2 focus:!border-[#475569] focus:!bg-[#1E293B]"
              value={local.name}
              placeholder="给这件作品起个名字..."
              onChange={(e) => updateField('name', e.target.value)}
            />
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#94A3B8] px-2">
              <span>
                创建：{new Date(local.createdAt).toLocaleDateString('zh-CN')}
              </span>
              <span>
                更新：{new Date(local.updatedAt).toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {isSaving && <span className="text-[#F59E0B]">保存中...</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {onDelete && (
              <button
                type="button"
                className="btn-secondary !border-[#7F1D1D] !text-[#FCA5A5] hover:!bg-[#3F1A1A]"
                onClick={() => {
                  if (confirm(`确定要删除「${local.name || '该作品'}」吗？`)) {
                    onDelete(local.id);
                  }
                }}
              >
                删除
              </button>
            )}
            <button
              type="button"
              className="btn-primary flex items-center gap-2"
              onClick={onGenerateShare}
            >
              ✨ 生成分享卡
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 rounded-xl p-4"
            style={{ background: 'linear-gradient(135deg, #065F46 0%, #064E3B 100%)' }}
          >
            <div className="text-xs text-[#6EE7B7] mb-1">物料成本</div>
            <div className="mono-font text-[#10B981] text-2xl font-bold">
              ¥{cost.toFixed(2)}
            </div>
          </div>
          <div className="md:col-span-1 rounded-xl p-4"
            style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #3B0764 100%)' }}
          >
            <div className="text-xs text-[#C4B5FD] mb-1">作品定价</div>
            <div className="mono-font text-[#A78BFA] text-2xl font-bold">
              ¥{Number(local.price || 0).toFixed(2)}
            </div>
          </div>
          <div className="md:col-span-1 rounded-xl p-4"
            style={{ background: profit >= 0
              ? 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)'
              : 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)' }}
          >
            <div className={`text-xs mb-1 ${profit >= 0 ? 'text-[#93C5FD]' : 'text-[#FCA5A5]'}`}>
              单件{profit >= 0 ? '利润' : '亏损'}
            </div>
            <div className={`mono-font text-2xl font-bold ${profit >= 0 ? 'text-[#60A5FA]' : 'text-[#F87171]'}`}>
              {profit >= 0 ? '+' : ''}¥{profit.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <section className="rounded-xl border border-[#334155] bg-[#1E293B] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#334155]">
            <span className="text-sm font-semibold text-[#F1F5F9]">基本信息</span>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5">作品分类</label>
              <input
                type="text"
                className="input-field"
                placeholder="如：皮具、陶艺、首饰..."
                value={local.category}
                onChange={(e) => updateField('category', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5">销售渠道</label>
              <input
                type="text"
                className="input-field"
                placeholder="如：淘宝、小红书、线下市集..."
                value={local.salesChannel}
                onChange={(e) => updateField('salesChannel', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5">售价 (¥)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field mono-font"
                value={local.price}
                onChange={(e) => updateField('price', Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5">材质</label>
              <input
                type="text"
                className="input-field"
                placeholder="分享卡显示材质信息"
                value={local.texture || ''}
                onChange={(e) => updateField('texture', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-[#94A3B8] mb-1.5">尺寸</label>
              <input
                type="text"
                className="input-field"
                placeholder="如：12cm x 9.5cm"
                value={local.size || ''}
                onChange={(e) => updateField('size', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-[#94A3B8] mb-1.5">备注</label>
              <textarea
                rows={3}
                className="input-field resize-y"
                placeholder="描述作品特色、工艺、定制信息等"
                value={local.remark}
                onChange={(e) => updateField('remark', e.target.value)}
              />
            </div>
          </div>
        </section>

        <MaterialList
          materials={local.materials || []}
          onChange={updateMaterials}
        />

        <ImageUploader
          images={local.images || []}
          onChange={updateImages}
          maxCount={9}
        />
      </div>
    </div>
  );
}
