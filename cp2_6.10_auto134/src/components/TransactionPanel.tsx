import React, { useState, useEffect, useMemo } from 'react';
import { useLedgerStore } from '../store';
import { calculateTax, convertFromCopper } from '../utils';
import type { Transaction } from '../types';

const TransactionPanel: React.FC = () => {
  const {
    selectedGoodsId,
    goods,
    currencyRates,
    taxRate,
    addTransaction,
    isLowStock,
    getSafeStock,
  } = useLedgerStore();

  const [buyerName, setBuyerName] = useState('');
  const [buyerOrigin, setBuyerOrigin] = useState<'波斯' | '大食' | '拜占庭' | '大唐'>('波斯');
  const [quantity, setQuantity] = useState(1);
  const [currency, setCurrency] = useState<'铜钱' | '波斯银币' | '拜占庭金币'>('铜钱');
  const [animKey, setAnimKey] = useState(0);

  const selectedGoods = useMemo(
    () => goods.find((g) => g.id === selectedGoodsId) || null,
    [goods, selectedGoodsId]
  );

  useEffect(() => {
    setAnimKey((prev) => prev + 1);
  }, [currency]);

  const totalPrice = useMemo(() => {
    if (!selectedGoods) return 0;
    return selectedGoods.unitPrice * quantity;
  }, [selectedGoods, quantity]);

  const tax = useMemo(() => calculateTax(totalPrice, taxRate), [totalPrice, taxRate]);

  const currencyAmount = useMemo(() => {
    const rate = currencyRates[currency].rate;
    return convertFromCopper(totalPrice, rate);
  }, [totalPrice, currency, currencyRates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoods || !buyerName.trim() || quantity <= 0 || quantity > selectedGoods.stock) {
      return;
    }

    const txData: Omit<Transaction, 'id' | 'timestamp' | 'timeStr' | 'tax'> = {
      goodsId: selectedGoods.id,
      goodsName: selectedGoods.name,
      buyerName: buyerName.trim(),
      buyerOrigin,
      quantity,
      unitPrice: selectedGoods.unitPrice,
      totalPrice,
      currency,
      currencyAmount,
    };

    await addTransaction(txData);
    setBuyerName('');
    setQuantity(1);
  };

  if (!selectedGoods) {
    return (
      <div className="transaction-panel">
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p>请从左侧选择货物开始记账</p>
        </div>
      </div>
    );
  }

  const isLow = isLowStock(selectedGoods);
  const safeStock = getSafeStock(selectedGoods);

  return (
    <div className="transaction-panel">
      <h2 className="panel-title">交易记账</h2>
      
      <div style={{ 
        padding: '12px', 
        background: isLow ? 'rgba(255, 127, 0, 0.1)' : '#f5e6ca',
        border: `1.5px solid ${isLow ? '#ff7f00' : '#d4a24e'}`,
        borderRadius: '6px',
        marginBottom: '16px'
      }}>
        <p style={{ fontFamily: 'FangSong', fontSize: '14px', color: isLow ? '#ff7f00' : '#666' }}>
          当前货物: <strong style={{ color: '#1a1a1a' }}>{selectedGoods.name}</strong>
        </p>
        <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
          库存: {selectedGoods.stock}{selectedGoods.unit} | 
          安全库存: {safeStock}{selectedGoods.unit} | 
          单价: {selectedGoods.unitPrice}文/{selectedGoods.unit}
          {isLow && <span style={{ color: '#ff7f00', marginLeft: '8px' }}>⚠库存不足</span>}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>买家姓名</label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="请输入买家姓名"
              required
            />
          </div>
          <div className="form-group">
            <label>买家来源</label>
            <select
              value={buyerOrigin}
              onChange={(e) => setBuyerOrigin(e.target.value as any)}
            >
              <option value="波斯">波斯</option>
              <option value="大食">大食</option>
              <option value="拜占庭">拜占庭</option>
              <option value="大唐">大唐</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>购买数量 ({selectedGoods.unit})</label>
            <input
              type="number"
              min="1"
              max={selectedGoods.stock}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(selectedGoods.stock, parseInt(e.target.value) || 1)))}
              required
            />
          </div>
          <div className="form-group">
            <label>结算币种</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
            >
              <option value="铜钱">铜钱 (1文)</option>
              <option value="波斯银币">波斯银币 (1银币 = 80文)</option>
              <option value="拜占庭金币">拜占庭金币 (1金币 = 420文)</option>
            </select>
          </div>
        </div>

        <div className="price-display" key={animKey}>
          <div className="price-row">
            <span className="price-label">单价 × 数量</span>
            <span className="price-value">
              {selectedGoods.unitPrice}文 × {quantity}{selectedGoods.unit}
            </span>
          </div>
          <div className="price-row">
            <span className="price-label">商品总价</span>
            <span className="price-value">{totalPrice}文</span>
          </div>
          <div className="price-row">
            <span className="price-label">市舶使抽税 (2%)</span>
            <span className="price-value tax">-{tax}文</span>
          </div>
          <div className="price-row">
            <span className="price-label">实收总计</span>
            <span className="price-value total">{totalPrice}文</span>
          </div>
          {currency !== '铜钱' && (
            <div className="currency-convert">
              折合{currencyRates[currency].symbol}: {currencyAmount} {currencyRates[currency].symbol}
              ({currency} × {currencyRates[currency].rate}文)
            </div>
          )}
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={!buyerName.trim() || quantity <= 0 || quantity > selectedGoods.stock}
        >
          记入账簿
        </button>
      </form>
    </div>
  );
};

export default TransactionPanel;
