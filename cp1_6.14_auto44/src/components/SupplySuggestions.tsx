import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import moment from 'moment';
import { suggestionApi, locationApi } from '../api';
import { ToastContext } from '../App';
import type { SupplySuggestion, StorageLocation } from '../types';

interface SupplySuggestionsProps {
  family: { id: string; name: string; location: string };
}

const SupplySuggestions: React.FC<SupplySuggestionsProps> = ({ family }) => {
  const showToast = useContext(ToastContext);
  const [searchParams, setSearchParams] = useSearchParams();

  const [suggestions, setSuggestions] = useState<SupplySuggestion[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [purchasingIds, setPurchasingIds] = useState<Set<string>>(new Set());

  const searchQuery = searchParams.get('search') || '';
  const filterLocation = searchParams.get('locationId') || '';

  const loadData = useCallback(async () => {
    try {
      const [suggestionsData, locationsData] = await Promise.all([
        suggestionApi.getAll(family.id),
        locationApi.getAll(family.id),
      ]);
      setSuggestions(suggestionsData);
      setLocations(locationsData);
    } catch {
      showToast('加载数据失败', 'error');
    }
  }, [family.id, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateSearchParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const filteredSuggestions = useMemo(() => {
    let result = suggestions;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => s.itemName.toLowerCase().includes(q));
    }
    if (filterLocation) {
      result = result.filter((s) => s.storageLocationId === filterLocation);
    }
    return result;
  }, [suggestions, searchQuery, filterLocation]);

  const getLocationName = (id: string) => {
    return locations.find((l) => l.id === id)?.name || '未知位置';
  };

  const getLocationColor = (id: string) => {
    return locations.find((l) => l.id === id)?.color || '#4caf50';
  };

  const handlePurchase = async (suggestion: SupplySuggestion) => {
    setPurchasingIds((prev) => new Set(prev).add(suggestion.itemId));
    try {
      await suggestionApi.purchase(family.id, suggestion.itemId, suggestion.suggestedQuantity);
      showToast(`已采购 ${suggestion.itemName} ${suggestion.suggestedQuantity} ${suggestion.unit}`);
      loadData();
    } catch {
      showToast('采购操作失败', 'error');
    } finally {
      setPurchasingIds((prev) => {
        const next = new Set(prev);
        next.delete(suggestion.itemId);
        return next;
      });
    }
  };

  return (
    <div>
      <h2 className="section-title">🛒 补给建议</h2>

      <div className="toolbar">
        <input
          className="search-box"
          placeholder="🔍 搜索物品名称..."
          value={searchQuery}
          onChange={(e) => updateSearchParam('search', e.target.value)}
        />
        <select
          className="filter-select"
          value={filterLocation}
          onChange={(e) => updateSearchParam('locationId', e.target.value)}
        >
          <option value="">所有位置</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {filteredSuggestions.length === 0 ? (
        <div className="empty-list">
          {suggestions.length === 0
            ? '暂无补给建议，库存状态良好 🎉'
            : '没有找到匹配的补给建议'}
        </div>
      ) : (
        <div className="suggestions-list">
          {filteredSuggestions.map((suggestion) => {
            const isPurchasing = purchasingIds.has(suggestion.itemId);
            return (
              <div key={suggestion.itemId} className="suggestion-card">
                <div
                  style={{
                    width: 6,
                    height: 60,
                    borderRadius: 3,
                    backgroundColor: getLocationColor(suggestion.storageLocationId),
                    flexShrink: 0,
                  }}
                />
                <div className="suggestion-info">
                  <div className="suggestion-name">{suggestion.itemName}</div>
                  <div className="suggestion-details">
                    <span>
                      当前: <strong>{suggestion.currentQuantity}</strong> {suggestion.unit}
                    </span>
                    <span>
                      建议购买: <strong style={{ color: '#2e7d32' }}>{suggestion.suggestedQuantity}</strong> {suggestion.unit}
                    </span>
                    <span style={{ color: '#888' }}>
                      📍 {getLocationName(suggestion.storageLocationId)}
                    </span>
                  </div>
                  <div className="suggestion-reason">{suggestion.reason}</div>
                </div>
                <button
                  className="btn btn-success"
                  disabled={isPurchasing}
                  onClick={() => handlePurchase(suggestion)}
                  style={{
                    flexShrink: 0,
                    minWidth: 100,
                    opacity: isPurchasing ? 0.6 : 1,
                  }}
                >
                  {isPurchasing ? '处理中...' : '✓ 已采购'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupplySuggestions;
