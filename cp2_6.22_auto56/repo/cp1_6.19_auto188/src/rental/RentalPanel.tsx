import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { RentalItem, VoucherData } from '../equipment/types';

interface RentalPanelProps {
  items: RentalItem[];
  totalAmount: number;
  onRemoveItem: (itemId: string) => void;
  onGenerateVoucher: (name: string, phone: string) => VoucherData | null;
  voucher: VoucherData | null;
  onCloseVoucher: () => void;
}

function BarcodeDisplay({ id, digits }: { id: string; digits: string }) {
  const bars: boolean[] = [];
  for (let i = 0; i < 60; i++) {
    bars.push(((i * 7 + parseInt(digits[i % digits.length] || '0', 10) * 3) % 5) > 1);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '8px 12px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #D6CFB8',
          borderRadius: 8,
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, color: '#2E3A22' }}>*</span>
        <div style={{ display: 'flex', alignItems: 'flex-end', height: 52 }}>
          {bars.map((b, i) => (
            <div
              key={i}
              style={{
                width: b ? 2 : 1,
                height: b ? 48 : 36,
                backgroundColor: '#2E3A22',
                opacity: b ? 1 : 0.55,
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, color: '#2E3A22' }}>*</span>
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 4, color: '#2E5A28' }}>
          *{id}*
        </div>
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: '#B0A896', letterSpacing: 1.5 }}>
        {digits}
      </div>
    </div>
  );
}

export default function RentalPanel({
  items,
  totalAmount,
  onRemoveItem,
  onGenerateVoucher,
  voucher,
  onCloseVoucher,
}: RentalPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [formErr, setFormErr] = useState('');

  const handleSubmit = () => {
    if (!customerName.trim()) {
      setFormErr('请填写姓名');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(customerPhone.trim())) {
      setFormErr('请填写正确的11位手机号');
      return;
    }
    setFormErr('');
    onGenerateVoucher(customerName.trim(), customerPhone.trim());
    setShowForm(false);
  };

  const handleOpenForm = () => {
    if (items.length === 0) return;
    setShowForm(true);
    setFormErr('');
  };

  return (
    <>
      <div
        style={{
          width: 340,
          backgroundColor: '#FFFFFF',
          border: '1px solid #D6CFB8',
          borderRadius: 16,
          position: 'sticky',
          top: 80,
          alignSelf: 'flex-start',
          maxHeight: 'calc(100vh - 100px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 16px rgba(46, 90, 40, 0.08)',
        }}
        className="rental-panel"
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E8E4D7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E5A28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#2E3A22' }}>我的行程</div>
          </div>
          <div
            style={{
              padding: '2px 10px',
              backgroundColor: items.length > 0 ? '#E2EAD8' : '#F4F1E1',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              color: '#2E5A28',
            }}
          >
            {items.length} 件
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {items.length === 0 ? (
            <div
              style={{
                padding: '40px 16px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D6CFB8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              <div style={{ fontSize: 13, color: '#B0A896' }}>暂无装备，从左侧添加吧</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: 8 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{
                      padding: '12px',
                      backgroundColor: '#FAF8F1',
                      borderRadius: 10,
                      border: '1px solid #EFEADB',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#2E3A22', marginBottom: 4 }}>
                          {item.equipmentName}
                        </div>
                        <div style={{ fontSize: 11, color: '#8B8574' }}>
                          {item.dateRange.startDate} ~ {item.dateRange.endDate}
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          border: 'none',
                          backgroundColor: '#F4F1E1',
                          color: '#B0A896',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          flexShrink: 0,
                          marginLeft: 8,
                        }}
                        onMouseEnter={(e) => {
                          const t = e.currentTarget as HTMLButtonElement;
                          t.style.backgroundColor = '#E8D8D8';
                          t.style.color = '#A0522D';
                        }}
                        onMouseLeave={(e) => {
                          const t = e.currentTarget as HTMLButtonElement;
                          t.style.backgroundColor = '#F4F1E1';
                          t.style.color = '#B0A896';
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', backgroundColor: '#F0E6D2', color: '#8B6914', borderRadius: 6 }}>
                          {item.days}天
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            backgroundColor:
                              item.dynamicCoefficient === 0.8 ? '#E8F0DB' :
                              item.dynamicCoefficient === 1.2 ? '#F0DFD2' : '#E8E4D7',
                            color:
                              item.dynamicCoefficient === 0.8 ? '#3F6B2B' :
                              item.dynamicCoefficient === 1.2 ? '#8B5A2B' : '#6B6456',
                            borderRadius: 6,
                          }}
                        >
                          {item.dynamicCoefficient === 0.8 ? '特惠×0.8' :
                           item.dynamicCoefficient === 1.2 ? '旺季×1.2' : '标准价'}
                        </span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#2E5A28' }}>
                        ¥{item.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #E8E4D7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: '#6B6456' }}>合计金额</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#2E5A28' }}>
                ¥{totalAmount.toFixed(2)}
              </div>
            </div>
            <button
              onClick={handleOpenForm}
              style={{
                height: 48,
                width: '100%',
                backgroundColor: '#2E5A28',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1E3E1A'; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2E5A28'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2E5A28'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              生成凭证
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: '#00000066',
                zIndex: 99,
              }}
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 420,
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: '32px',
                zIndex: 100,
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              }}
            >
              <button
                onClick={() => setShowForm(false)}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  border: 'none',
                  backgroundColor: '#E8E4D7',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#D6CFB8'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E8E4D7'; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B6456" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#2E3A22', marginBottom: 4 }}>填写租借信息</div>
                <div style={{ fontSize: 12, color: '#B0A896' }}>请填写您的联系信息以生成电子凭证</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6B6456', marginBottom: 6, fontWeight: 500 }}>
                    姓名
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="请输入您的姓名"
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 14px',
                      backgroundColor: '#F4F1E1',
                      border: '1.5px solid transparent',
                      borderRadius: 10,
                      fontSize: 14,
                      color: '#2E3A22',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = '#2E5A28'; }}
                    onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = 'transparent'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6B6456', marginBottom: 6, fontWeight: 500 }}>
                    联系电话
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="请输入11位手机号"
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 14px',
                      backgroundColor: '#F4F1E1',
                      border: '1.5px solid transparent',
                      borderRadius: 10,
                      fontSize: 14,
                      color: '#2E3A22',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = '#2E5A28'; }}
                    onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = 'transparent'; }}
                  />
                </div>
                {formErr && (
                  <div style={{ fontSize: 12, color: '#C0392B', padding: '8px 12px', backgroundColor: '#FCE8E6', borderRadius: 8 }}>
                    {formErr}
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  style={{
                    height: 46,
                    width: '100%',
                    backgroundColor: '#2E5A28',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    marginTop: 4,
                  }}
                  onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1E3E1A'; }}
                  onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2E5A28'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2E5A28'; }}
                >
                  确认并生成凭证
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {voucher && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: '#00000066',
                zIndex: 99,
              }}
              onClick={onCloseVoucher}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 560,
                height: 400,
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: '28px 32px',
                zIndex: 100,
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
              }}
            >
              <button
                onClick={onCloseVoucher}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  border: 'none',
                  backgroundColor: '#E8E4D7',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#B0A896'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E8E4D7'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6456" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    background: 'linear-gradient(135deg, #2E5A28 0%, #4A8B3F 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#2E3A22' }}>电子租借凭证</div>
                  <div style={{ fontSize: 11, color: '#B0A896' }}>Wild Outdoor Rental Voucher</div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px 24px',
                  padding: '14px 16px',
                  backgroundColor: '#FAF8F1',
                  borderRadius: 12,
                  marginBottom: 14,
                }}
              >
                <div>
                  <div style={{ fontSize: 10, color: '#B0A896', marginBottom: 2 }}>租借人</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2E3A22' }}>{voucher.customerName}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#B0A896', marginBottom: 2 }}>联系电话</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2E3A22' }}>{voucher.customerPhone}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#B0A896', marginBottom: 2 }}>租借开始</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2E3A22' }}>{voucher.startDate}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#B0A896', marginBottom: 2 }}>租借结束</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2E3A22' }}>{voucher.endDate}</div>
                </div>
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#F4F1E1',
                  borderRadius: 10,
                  marginBottom: 14,
                  flex: 1,
                  overflow: 'hidden',
                }}
              >
                <div style={{ fontSize: 10, color: '#B0A896', marginBottom: 6 }}>装备清单 ({voucher.items.length}件)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 60, overflowY: 'auto' }}>
                  {voucher.items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4A4536' }}>
                      <span>· {it.equipmentName} × {it.days}天</span>
                      <span style={{ fontWeight: 600, color: '#2E5A28' }}>¥{it.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <BarcodeDisplay id={voucher.id} digits={voucher.barcodeDigits} />
                <div style={{ textAlign: 'right', paddingLeft: 20, borderLeft: '1px dashed #D6CFB8' }}>
                  <div style={{ fontSize: 11, color: '#B0A896', marginBottom: 2 }}>应付总额</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#2E5A28' }}>
                    ¥{voucher.totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
