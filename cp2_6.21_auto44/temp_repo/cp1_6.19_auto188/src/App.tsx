import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import EquipmentCard from './equipment/EquipmentCard';
import type { Equipment, EquipmentCategory, DateRange } from './equipment/types';
import { useRental } from './rental/hooks';
import RentalPanel from './rental/RentalPanel';

const CATEGORIES: EquipmentCategory[] = ['露营', '徒步', '攀岩', '水上', '冬季'];

function makeRentalRates(...nums: number[]): number[] {
  while (nums.length < 7) nums.push(0.5);
  return nums.slice(0, 7).map(n => Math.max(0, Math.min(1, n)));
}

const MOCK_EQUIPMENTS: Equipment[] = [
  { id: 'c001', name: '三人双层防风帐篷', category: '露营', basePrice: 58, stock: 12, description: '专业防水防风，适宜3-4人家庭露营', rentalRateLast7Days: makeRentalRates(0.22, 0.18, 0.25, 0.30, 0.28, 0.20, 0.24) },
  { id: 'c002', name: '羽绒睡袋 -10℃', category: '露营', basePrice: 32, stock: 18, description: '高品质鹅绒填充，舒适温度-10℃', rentalRateLast7Days: makeRentalRates(0.60, 0.65, 0.70, 0.72, 0.68, 0.58, 0.62) },
  { id: 'c003', name: '自动充气防潮垫', category: '露营', basePrice: 18, stock: 24, description: '快速充气，加厚5cm舒适睡眠', rentalRateLast7Days: makeRentalRates(0.15, 0.20, 0.22, 0.25, 0.18, 0.28, 0.20) },
  { id: 'c004', name: 'LED露营灯（含电池）', category: '露营', basePrice: 12, stock: 30, description: '三档调光，续航12小时', rentalRateLast7Days: makeRentalRates(0.45, 0.48, 0.50, 0.52, 0.46, 0.44, 0.50) },
  { id: 'c005', name: '便携式户外桌椅套装', category: '露营', basePrice: 28, stock: 15, description: '铝合金折叠桌+4椅，承重120kg', rentalRateLast7Days: makeRentalRates(0.80, 0.85, 0.78, 0.72, 0.82, 0.76, 0.80) },
  { id: 'h001', name: '碳素登山杖（对）', category: '徒步', basePrice: 22, stock: 20, description: '碳纤维超轻3节可调节，减震系统', rentalRateLast7Days: makeRentalRates(0.35, 0.40, 0.38, 0.42, 0.36, 0.44, 0.40) },
  { id: 'h002', name: '专业徒步背包 65L', category: '徒步', basePrice: 38, stock: 16, description: '人体工学背负系统，防水面料', rentalRateLast7Days: makeRentalRates(0.55, 0.58, 0.62, 0.60, 0.56, 0.64, 0.58) },
  { id: 'h003', name: '高帮防水徒步鞋', category: '徒步', basePrice: 42, stock: 22, description: 'Vibram大底，Gore-Tex防水透气', rentalRateLast7Days: makeRentalRates(0.72, 0.76, 0.70, 0.82, 0.78, 0.74, 0.80) },
  { id: 'h004', name: '速干透气户外衣裤套装', category: '徒步', basePrice: 25, stock: 28, description: '防晒UPF50+，四向弹力速干', rentalRateLast7Days: makeRentalRates(0.28, 0.26, 0.30, 0.32, 0.28, 0.24, 0.26) },
  { id: 'h005', name: '户外多功能登山包 40L', category: '徒步', basePrice: 28, stock: 18, description: '多隔层设计，自带防雨罩', rentalRateLast7Days: makeRentalRates(0.40, 0.42, 0.45, 0.38, 0.44, 0.46, 0.42) },
  { id: 'r001', name: '攀岩安全 harness', category: '攀岩', basePrice: 45, stock: 10, description: 'UIAA认证，全身可调安全腰带', rentalRateLast7Days: makeRentalRates(0.18, 0.22, 0.20, 0.25, 0.16, 0.24, 0.20) },
  { id: 'r002', name: '专业攀岩主绳 60m', category: '攀岩', basePrice: 55, stock: 8, description: '10.5mm动力绳，UIAA双认证', rentalRateLast7Days: makeRentalRates(0.25, 0.28, 0.22, 0.20, 0.26, 0.24, 0.22) },
  { id: 'r003', name: '攀岩头盔（轻量款）', category: '攀岩', basePrice: 18, stock: 14, description: '聚碳酸酯外壳，通风设计', rentalRateLast7Days: makeRentalRates(0.12, 0.15, 0.18, 0.14, 0.16, 0.20, 0.18) },
  { id: 'r004', name: '快挂扁带套装（12个）', category: '攀岩', basePrice: 32, stock: 10, description: '铝合金D型锁+尼龙扁带', rentalRateLast7Days: makeRentalRates(0.30, 0.28, 0.32, 0.35, 0.30, 0.26, 0.28) },
  { id: 'r005', name: '攀岩镁粉袋+镁粉球', category: '攀岩', basePrice: 10, stock: 40, description: '防滑镁粉，舒适绒面粉袋', rentalRateLast7Days: makeRentalRates(0.50, 0.52, 0.48, 0.54, 0.50, 0.46, 0.48) },
  { id: 'w001', name: '成人专业救生衣', category: '水上', basePrice: 20, stock: 25, description: '浮力100N，CE认证，多调节带', rentalRateLast7Days: makeRentalRates(0.82, 0.86, 0.80, 0.78, 0.84, 0.88, 0.82) },
  { id: 'w002', name: '双人充气皮划艇', category: '水上', basePrice: 88, stock: 6, description: 'PVC加厚，含双桨+气泵', rentalRateLast7Days: makeRentalRates(0.65, 0.70, 0.72, 0.68, 0.74, 0.66, 0.70) },
  { id: 'w003', name: '防水手机袋+防水腰包', category: '水上', basePrice: 8, stock: 50, description: 'IPX8级防水，触屏可用', rentalRateLast7Days: makeRentalRates(0.38, 0.42, 0.40, 0.45, 0.36, 0.44, 0.40) },
  { id: 'w004', name: '潜水浮潜三宝套装', category: '水上', basePrice: 35, stock: 16, description: '防雾面镜+干式呼吸管+脚蹼', rentalRateLast7Days: makeRentalRates(0.50, 0.54, 0.48, 0.52, 0.56, 0.46, 0.50) },
  { id: 'w005', name: 'SUP站立式桨板', category: '水上', basePrice: 68, stock: 8, description: '充气式3.2m，含桨+脚绳+背包', rentalRateLast7Days: makeRentalRates(0.74, 0.78, 0.72, 0.76, 0.80, 0.70, 0.74) },
  { id: 's001', name: '全地域滑雪板（含雪鞋）', category: '冬季', basePrice: 98, stock: 14, description: '入门到进阶全能板，可调固定器', rentalRateLast7Days: makeRentalRates(0.86, 0.88, 0.82, 0.90, 0.84, 0.86, 0.88) },
  { id: 's002', name: '专业滑雪服套装', category: '冬季', basePrice: 58, stock: 18, description: '20K防水透气，夹棉保暖', rentalRateLast7Days: makeRentalRates(0.72, 0.76, 0.70, 0.74, 0.78, 0.68, 0.72) },
  { id: 's003', name: '滑雪头盔+护目镜', category: '冬季', basePrice: 35, stock: 22, description: '双认证头盔+双层防雾镜片', rentalRateLast7Days: makeRentalRates(0.60, 0.64, 0.58, 0.62, 0.66, 0.56, 0.60) },
  { id: 's004', name: '雪地徒步冰爪（对）', category: '冬季', basePrice: 25, stock: 16, description: '不锈钢14齿，防滑耐磨', rentalRateLast7Days: makeRentalRates(0.22, 0.26, 0.20, 0.24, 0.28, 0.18, 0.22) },
  { id: 's005', name: '羽绒防寒保暖外套', category: '冬季', basePrice: 48, stock: 20, description: '800蓬鹅绒，-20℃保暖', rentalRateLast7Days: makeRentalRates(0.66, 0.70, 0.64, 0.68, 0.72, 0.62, 0.66) },
];

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      style={{
        width: 280,
        height: 340,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #EFEADB',
      }}
    >
      <div
        style={{
          height: 130,
          backgroundColor: '#E0D8C8',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      <div style={{ padding: 16 }}>
        <div style={{ height: 16, width: '70%', backgroundColor: '#E0D8C8', borderRadius: 4, marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 12, width: '90%', backgroundColor: '#E0D8C8', borderRadius: 4, marginBottom: 16, animation: 'pulse 1.5s ease-in-out infinite 0.2s' }} />
        <div style={{ height: 22, width: '40%', backgroundColor: '#E0D8C8', borderRadius: 4, marginBottom: 18, animation: 'pulse 1.5s ease-in-out infinite 0.4s' }} />
        <div style={{ height: 36, width: '100%', backgroundColor: '#E0D8C8', borderRadius: 8, marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite 0.6s' }} />
        <div style={{ height: 36, width: '100%', backgroundColor: '#E0D8C8', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite 0.8s' }} />
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
    </motion.div>
  );
}

export default function App() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | '全部'>('全部');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const rental = useRental();

  useEffect(() => {
    const timer = setTimeout(() => {
      setEquipments(MOCK_EQUIPMENTS);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredEquipments = useMemo(() => {
    let list = equipments;
    if (selectedCategory !== '全部') {
      list = list.filter(e => e.category === selectedCategory);
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      list = list.filter(e =>
        e.name.toLowerCase().includes(kw) ||
        (e.description && e.description.toLowerCase().includes(kw)) ||
        e.category.toLowerCase().includes(kw)
      );
    }
    return list;
  }, [equipments, selectedCategory, searchKeyword]);

  const handleAddToTrip = (equipment: Equipment, dateRange: DateRange): boolean => {
    return rental.addItem(equipment, dateRange);
  };

  const handleSearch = () => {
    setSearchKeyword(searchInput);
  };

  const handleSearchKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F1E1' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: 54,
          backgroundColor: '#2E5A28',
          color: '#FFFFFF',
          boxShadow: '0 2px 12px rgba(46, 90, 40, 0.3)',
        }}
      >
        <div
          className="top-bar-inner"
          style={{
            maxWidth: 1520,
            height: '100%',
            margin: '0 auto',
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #8BC34A 0%, #CDDC39 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18l9-12 9 12" />
                <path d="M9 18h6" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 0.5 }}>野趣户外</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 13, opacity: 0.9 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              全国配送
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8v4l3 3" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              24小时客服
            </div>
          </div>
        </div>
      </div>

      <div
        className="main-layout"
        style={{
          maxWidth: 1520,
          margin: '0 auto',
          padding: '26px 32px 48px',
          display: 'flex',
          gap: 32,
          alignItems: 'flex-start',
        }}
      >
        <div className="content-area" style={{ width: 1120, flexShrink: 0 }}>
          <div
            className="header-row"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: 20,
              gap: 20,
            }}
          >
            <div
              className="search-box"
              style={{
                width: 300,
                height: 42,
                backgroundColor: '#E8E4D7',
                borderRadius: 21,
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px 0 18px',
                border: '1.5px solid transparent',
                transition: 'border-color 0.2s ease',
              }}
              onFocusCapture={() => {
                const el = document.querySelector('.search-box') as HTMLElement;
                if (el) el.style.borderColor = '#2E5A28';
              }}
              onBlurCapture={() => {
                const el = document.querySelector('.search-box') as HTMLElement;
                if (el) el.style.borderColor = 'transparent';
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8B8574"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ cursor: 'pointer', flexShrink: 0 }}
                onClick={handleSearch}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeydown}
                placeholder="搜索装备名称、描述..."
                style={{
                  flex: 1,
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  marginLeft: 10,
                  fontSize: 14,
                  color: '#2E3A22',
                }}
              />
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#2E3A22', marginBottom: 2 }}>
                探索户外装备
              </div>
              <div style={{ fontSize: 12, color: '#8B8574' }}>
                共 {equipments.length} 件装备 · 精选品质 · 动态定价
              </div>
            </div>
          </div>

          <div
            className="category-tabs"
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: 22,
            }}
          >
            {(['全部', ...CATEGORIES] as const).map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '8px 22px',
                    borderRadius: 20,
                    border: 'none',
                    backgroundColor: active ? '#2E5A28' : '#E8E4D7',
                    color: active ? '#FFFFFF' : '#6B6456',
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      const t = e.currentTarget as HTMLButtonElement;
                      t.style.backgroundColor = '#D6CFB8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      const t = e.currentTarget as HTMLButtonElement;
                      t.style.backgroundColor = '#E8E4D7';
                    }
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div
            className="equipment-grid"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 20,
              justifyContent: 'flex-start',
              minHeight: 340,
            }}
          >
            {loading ? (
              Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} delay={i * 0.08} />)
            ) : filteredEquipments.length === 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key="no-match"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: '100%',
                    padding: '80px 20px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#D6CFB8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                  <div style={{ fontSize: 18, color: '#B0A896', fontWeight: 500 }}>
                    无匹配装备
                  </div>
                  <div style={{ fontSize: 13, color: '#B0A896' }}>
                    试试其他关键词或切换分类
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              filteredEquipments.map((eq, idx) => (
                <EquipmentCard
                  key={eq.id}
                  equipment={eq}
                  index={idx}
                  onAddToTrip={handleAddToTrip}
                />
              ))
            )}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 340 }}>
          <RentalPanel
            items={rental.items}
            totalAmount={rental.totalAmount}
            onRemoveItem={rental.removeItem}
            onGenerateVoucher={rental.generateVoucher}
            voucher={rental.voucher}
            onCloseVoucher={rental.closeVoucher}
          />
        </div>
      </div>
    </div>
  );
}
