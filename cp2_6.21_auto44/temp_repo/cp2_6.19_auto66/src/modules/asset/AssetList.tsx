import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Asset } from '@/types';
import { ASSET_TYPE_CONFIG } from '@/types';
import { useAssetStore } from './assetStore';
import {
  calculateReturnRate,
  calculateMarketValue,
  calculateHoldingDays,
  formatCurrency,
  formatPercentage,
} from '@/utils/calculations';
import ConfirmDialog from '@/components/ConfirmDialog';
import AssetEntryForm from './AssetEntryForm';

const AssetList: React.FC = () => {
  const { assets, deleteAsset } = useAssetStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<(Asset & { id: string }) | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; assetId: string; assetName: string }>({
    isOpen: false,
    assetId: '',
    assetName: '',
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedAssets = useMemo(() => {
    return [...assets].sort((a, b) => b.createdAt - a.createdAt);
  }, [assets]);

  const handleCardClick = (assetId: string) => {
    setExpandedId(expandedId === assetId ? null : assetId);
  };

  const handleEdit = (e: React.MouseEvent, asset: Asset) => {
    e.stopPropagation();
    setEditingAsset(asset);
  };

  const handleDeleteClick = (e: React.MouseEvent, asset: Asset) => {
    e.stopPropagation();
    setDeleteDialog({
      isOpen: true,
      assetId: asset.id,
      assetName: asset.name,
    });
  };

  const confirmDelete = () => {
    setDeletingId(deleteDialog.assetId);
    setTimeout(() => {
      deleteAsset(deleteDialog.assetId);
      setDeletingId(null);
      setExpandedId(null);
    }, 200);
    setDeleteDialog({ isOpen: false, assetId: '', assetName: '' });
  };

  const handleEditComplete = () => {
    setEditingAsset(null);
  };

  if (sortedAssets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="text-accent" size={36} />
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">暂无资产记录</h3>
        <p className="text-text-secondary">点击上方表单添加您的第一笔投资资产</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedAssets.map((asset, index) => {
          const returnRate = calculateReturnRate(asset.buyPrice, asset.currentPrice);
          const marketValue = calculateMarketValue(asset.currentPrice, asset.quantity);
          const holdingDays = calculateHoldingDays(asset.buyDate);
          const isExpanded = expandedId === asset.id;
          const isDeleting = deletingId === asset.id;
          const typeConfig = ASSET_TYPE_CONFIG[asset.type];

          return (
            <div
              key={asset.id}
              className={`card card-hover cursor-pointer overflow-hidden relative ${
                isDeleting ? 'animate-zoom-out' : 'animate-fade-in-up'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => handleCardClick(asset.id)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-text-primary text-lg mb-1">
                      {asset.name}
                    </h3>
                    <span className={`type-tag type-tag-${asset.type}`}>
                      {typeConfig.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-text-primary">
                      ¥{formatCurrency(marketValue)}
                    </div>
                    <div
                      className={`flex items-center justify-end gap-1 text-sm font-medium ${
                        returnRate >= 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {returnRate >= 0 ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                      {formatPercentage(returnRate)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Calendar size={14} />
                  <span>持有 {holdingDays} 天</span>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-bg-tertiary">
                  <div className="text-sm text-text-secondary">
                    买入价: ¥{formatCurrency(asset.buyPrice)}
                  </div>
                  <div className="text-sm text-text-secondary">
                    当前价: ¥{formatCurrency(asset.currentPrice)}
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-accent" />
                  ) : (
                    <ChevronDown size={18} className="text-text-secondary" />
                  )}
                </div>
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 bg-bg-tertiary/50 ${
                  isExpanded ? 'max-h-60' : 'max-h-0'
                }`}
              >
                <div className="p-5 border-t border-bg-tertiary animate-slide-up">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-text-secondary mb-1">买入价</div>
                      <div className="text-text-primary font-medium">
                        ¥{formatCurrency(asset.buyPrice)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary mb-1">当前价</div>
                      <div className="text-text-primary font-medium">
                        ¥{formatCurrency(asset.currentPrice)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary mb-1">持有数量</div>
                      <div className="text-text-primary font-medium">
                        {asset.quantity.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary mb-1">买入日期</div>
                      <div className="text-text-primary font-medium">
                        {asset.buyDate}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => handleEdit(e, asset)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all"
                    >
                      <Edit2 size={16} />
                      编辑
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, asset)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-danger/20 text-danger rounded-lg hover:bg-danger/30 transition-all"
                    >
                      <Trash2 size={16} />
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="确认删除"
        message={`确定要删除资产「${deleteDialog.assetName}」吗？此操作不可撤销。`}
        confirmText="确认删除"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, assetId: '', assetName: '' })}
      />

      {editingAsset && (
        <AssetEntryForm editingAsset={editingAsset} onEditComplete={handleEditComplete} />
      )}
    </>
  );
};

export default AssetList;
