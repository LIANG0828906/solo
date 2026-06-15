import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTavernStore } from '../store';

const OrderPanel: React.FC = () => {
  const {
    drinks,
    vessels,
    shichens,
    selectedDrink,
    selectedVessel,
    selectedShichen,
    quantity,
    ivoryChips,
    silkBolts,
    customerName,
    lastBill,
    errorMessage,
    setSelectedDrink,
    setSelectedVessel,
    setSelectedShichen,
    setQuantity,
    setIvoryChips,
    setSilkBolts,
    setCustomerName,
    submitOrder,
    clearBill
  } = useTavernStore();

  const totalPayment = ivoryChips * 5 + silkBolts * 500;

  const selectedDrinkObj = drinks.find(d => d.id === selectedDrink);
  const selectedVesselObj = vessels.find(v => v.id === selectedVessel);
  const selectedShichenObj = shichens.find(s => s.id === selectedShichen);

  let estimatedTotal = 0;
  if (selectedDrinkObj && selectedVesselObj && selectedShichenObj) {
    const base = selectedDrinkObj.price * quantity;
    const vessel = selectedVesselObj.price * quantity;
    const subtotal = base + vessel;
    estimatedTotal = Math.round(subtotal * (1 + selectedShichenObj.priceModifier));
  }

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad)
    };
  }

  function describeSector(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
  }

  const ShichenClock = () => {
    const cx = 110, cy = 110, r = 100;
    const sectorAngle = 30;

    return (
      <div className="shichen-clock">
        <svg viewBox="0 0 220 220">
          <circle cx={cx} cy={cy} r={r + 10} fill="none" stroke="#c9a84c" strokeWidth="2" />
          {shichens.map((s, i) => {
            const startAngle = i * sectorAngle - 90;
            const endAngle = startAngle + sectorAngle;
            const isSelected = s.id === selectedShichen;
            const labelPos = polarToCartesian(cx, cy, r - 20, startAngle + sectorAngle / 2);
            
            return (
              <g key={s.id}>
                <path
                  d={describeSector(cx, cy, r, startAngle, endAngle)}
                  fill={isSelected ? '#c9a84c' : (i % 2 === 0 ? '#fff8e7' : '#f5e6c4')}
                  stroke="#c9a84c"
                  strokeWidth="1"
                  className={`shichen-sector ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedShichen(s.id)}
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fontWeight={isSelected ? '700' : '500'}
                  fill={isSelected ? '#722f37' : '#333'}
                  style={{ pointerEvents: 'none' }}
                >
                  {s.name.charAt(0)}
                </text>
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r="15" fill="#722f37" />
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fill="#c9a84c" fontWeight="600">时辰</text>
        </svg>
      </div>
    );
  };

  return (
    <div>
      <div className="column-title">酒博士点单</div>

      <div className="section-title">客官大名</div>
      <input
        type="text"
        className="input-field"
        placeholder="留个名儿吧（留空则随机）"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
      />

      <div className="section-title">选酒</div>
      <div className="drinks-grid">
        {drinks.map((drink) => {
          const isDisabled = drink.stock <= 0;
          const isSelected = drink.id === selectedDrink;
          const lowStock = drink.stock > 0 && drink.stock < 10;
          
          return (
            <div
              key={drink.id}
              className={`drink-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => !isDisabled && setSelectedDrink(drink.id)}
            >
              <div className="drink-name">{drink.name}</div>
              <div className="drink-price">{drink.price}文/{drink.unit}</div>
              <div className="drink-stock">库存：{drink.stock}{drink.unit}</div>
              {lowStock && <div className="stock-warning">⚠️ 库存告急</div>}
              {isDisabled && <div className="stock-warning">已售罄</div>}
            </div>
          );
        })}
      </div>

      <div className="section-title">选时辰</div>
      <ShichenClock />
      {selectedShichenObj && (
        <div style={{ textAlign: 'center', marginTop: '8px', color: '#666' }}>
          {selectedShichenObj.name} ({selectedShichenObj.hourRange})
          {selectedShichenObj.priceModifier !== 0 && (
            <span style={{ color: selectedShichenObj.priceModifier > 0 ? '#c0392b' : '#2e7d32', marginLeft: '8px' }}>
              {selectedShichenObj.priceModifier > 0 ? '+' : ''}{(selectedShichenObj.priceModifier * 100).toFixed(0)}%
            </span>
          )}
        </div>
      )}

      <div className="section-title">选器皿</div>
      <div className="vessels-grid">
        {vessels.map((vessel) => (
          <div
            key={vessel.id}
            className={`vessel-card ${vessel.id === selectedVessel ? 'selected' : ''}`}
            onClick={() => setSelectedVessel(vessel.id)}
          >
            <div className="vessel-name">{vessel.name}</div>
            <div className="vessel-price">+{vessel.price}文</div>
          </div>
        ))}
      </div>

      <div className="section-title">数量</div>
      <div className="quantity-input">
        <button onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))}>-</button>
        <input
          type="number"
          min="0.5"
          step="0.5"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
        />
        <button onClick={() => setQuantity(quantity + 0.5)}>+</button>
        {selectedDrinkObj && <span style={{ color: '#666' }}>{selectedDrinkObj.unit}</span>}
      </div>

      {estimatedTotal > 0 && (
        <div style={{ padding: '12px', background: '#f5e6c4', borderRadius: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#722f37', fontWeight: 600 }}>预估合计</span>
            <span style={{ color: '#c9a84c', fontWeight: 700, fontSize: '1.2rem' }}>{estimatedTotal}文</span>
          </div>
        </div>
      )}

      <div className="payment-section">
        <div className="section-title">支付方式</div>
        <div className="payment-option">
          <label>🦷 象牙筹签 (5文/根)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={ivoryChips}
            onChange={(e) => setIvoryChips(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
          />
          <span className="payment-value">{ivoryChips * 5}文</span>
        </div>
        <div className="payment-option">
          <label>🧵 绢帛 (500文/匹)</label>
          <input
            type="number"
            min="0"
            max="10"
            value={silkBolts}
            onChange={(e) => setSilkBolts(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
          />
          <span className="payment-value">{silkBolts * 500}文</span>
        </div>
        <div style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
          已付：<span style={{ color: '#c9a84c' }}>{totalPayment}文</span>
          {estimatedTotal > 0 && (
            <span style={{ marginLeft: '12px', color: totalPayment >= estimatedTotal ? '#2e7d32' : '#c0392b' }}>
              {totalPayment >= estimatedTotal ? '✓ 足够' : `还差 ${estimatedTotal - totalPayment}文`}
            </span>
          )}
        </div>
      </div>

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="error-message"
        >
          {errorMessage}
        </motion.div>
      )}

      <button
        className="btn"
        onClick={submitOrder}
        disabled={!selectedDrink || !selectedVessel || !selectedShichen || quantity <= 0 || totalPayment <= 0}
      >
        下单结账
      </button>

      <AnimatePresence>
        {lastBill && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bill-panel"
          >
            <div className="bill-title">📜 酒单明细</div>
            <div className="bill-row">
              <span>客人</span>
              <span style={{ fontWeight: 600 }}>{customerName || '客官'}</span>
            </div>
            <div className="bill-row">
              <span>{lastBill.drinkName} × {lastBill.quantity}{lastBill.unit}</span>
              <span>{lastBill.basePrice}文</span>
            </div>
            <div className="bill-row">
              <span>{lastBill.vesselName} × {lastBill.quantity}</span>
              <span>{lastBill.vesselPrice * lastBill.quantity}文</span>
            </div>
            <div className="bill-row">
              <span>小计</span>
              <span>{lastBill.subtotal}文</span>
            </div>
            <div className="bill-row">
              <span>{lastBill.shichenName}浮动</span>
              <span>{lastBill.priceModifier >= 0 ? '+' : ''}{(lastBill.priceModifier * 100).toFixed(0)}%</span>
            </div>
            <div className="bill-row bill-total">
              <span>应收合计</span>
              <span>{lastBill.totalPrice}文</span>
            </div>
            <div className="bill-row">
              <span>支付</span>
              <span>{lastBill.payment.totalPaid}文</span>
            </div>
            <div className="bill-change">
              <div style={{ fontWeight: 600, color: '#722f37', marginBottom: '8px' }}>找零</div>
              {lastBill.change.silkBolts > 0 && (
                <div className="change-row">
                  <span>绢帛</span>
                  <span>{lastBill.change.silkBolts}匹 ({lastBill.change.silkBolts * 500}文)</span>
                </div>
              )}
              {lastBill.change.ivoryChips > 0 && (
                <div className="change-row">
                  <span>象牙筹签</span>
                  <span>{lastBill.change.ivoryChips}根 ({lastBill.change.ivoryChips * 5}文)</span>
                </div>
              )}
              {lastBill.change.cash > 0 && (
                <div className="change-row">
                  <span>现金</span>
                  <span>{lastBill.change.cash}文</span>
                </div>
              )}
              <div className="change-row" style={{ fontWeight: 600, marginTop: '4px' }}>
                <span>实找</span>
                <span>{lastBill.change.totalChange}文</span>
              </div>
            </div>
            <div className="bill-row" style={{ marginTop: '12px' }}>
              <span>本单利润</span>
              <span className="profit-positive">+{lastBill.profit}文</span>
            </div>
            <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={clearBill}>
              继续点单
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderPanel;
