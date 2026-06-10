import { create } from 'zustand';

export type MarketTrend = '旺' | '平' | '淡';
export type FatLevel = '上' | '中' | '下';

export interface CattleEvaluation {
  backFat: FatLevel;
  teethAge: number;
  legStrength: number;
  totalScore: number;
  basePrice: number;
}

export interface Cattle {
  id: number;
  evaluation: CattleEvaluation | null;
  isSold: boolean;
  showRedRibbon: boolean;
}

export interface CoinSlot {
  id: 'sellMoney' | 'buyMoney' | 'agentFee' | 'taxFee';
  label: string;
  amount: number;
  filled: boolean;
}

export interface MarketState {
  marketTrend: MarketTrend;
  trendLastUpdate: number;
  cattle: Cattle[];
  farmerPrice: number;
  shopkeeperPrice: number;
  gapPercentage: number;
  bambooLeftX: number;
  bambooRightX: number;
  isDraggingBamboo: 'left' | 'right' | null;
  dealCompleted: boolean;
  showDealPanel: boolean;
  showSettlement: boolean;
  transactionAmount: number;
  agentFee: number;
  taxFee: number;
  coinSlots: CoinSlot[];
  selectedCattleId: number | null;
  showEvaluationPopup: boolean;
  evaluationPopupPos: { x: number; y: number };
  evaluationPart: string | null;
  goldParticles: boolean;
  soundEnabled: boolean;

  setMarketTrend: (trend: MarketTrend) => void;
  evaluateCattle: (cattleId: number, part: string) => void;
  setFarmerPrice: (price: number) => void;
  setShopkeeperPrice: (price: number) => void;
  setBambooPosition: (side: 'left' | 'right', x: number) => void;
  setDraggingBamboo: (side: 'left' | 'right' | null) => void;
  checkDeal: () => void;
  completeDeal: () => void;
  setShowSettlement: (show: boolean) => void;
  fillCoinSlot: (slotId: string) => boolean;
  resetCoinSlot: (slotId: string) => void;
  setSelectedCattle: (id: number | null) => void;
  setShowEvaluationPopup: (show: boolean, pos?: { x: number; y: number }, part?: string) => void;
  triggerGoldParticles: () => void;
  resetMarket: () => void;
  adjustPricesForTrend: () => void;
}

const generateEvaluation = (): CattleEvaluation => {
  const fatLevels: FatLevel[] = ['上', '中', '下'];
  const backFat = fatLevels[Math.floor(Math.random() * 3)];
  const teethAge = Math.floor(Math.random() * 5) + 2;
  const legStrength = Math.floor(Math.random() * 30) + 70;
  
  const backScore = backFat === '上' ? 35 : backFat === '中' ? 25 : 15;
  const ageScore = teethAge <= 4 ? 30 : teethAge <= 6 ? 20 : 10;
  const legScore = Math.floor(legStrength / 10) * 3.5;
  const totalScore = Math.min(100, Math.round(backScore + ageScore + legScore));
  
  return {
    backFat,
    teethAge,
    legStrength,
    totalScore,
    basePrice: 100 + totalScore * 0.5
  };
};

const calculateGap = (a: number, b: number): number => {
  const avg = (a + b) / 2;
  return Math.abs(a - b) / avg * 100;
};

export const useMarketStore = create<MarketState>((set, get) => ({
  marketTrend: '平',
  trendLastUpdate: Date.now(),
  cattle: [
    { id: 1, evaluation: null, isSold: false, showRedRibbon: false },
    { id: 2, evaluation: null, isSold: false, showRedRibbon: false },
    { id: 3, evaluation: null, isSold: false, showRedRibbon: false }
  ],
  farmerPrice: 130,
  shopkeeperPrice: 120,
  gapPercentage: calculateGap(130, 120),
  bambooLeftX: 20,
  bambooRightX: 80,
  isDraggingBamboo: null,
  dealCompleted: false,
  showDealPanel: true,
  showSettlement: false,
  transactionAmount: 0,
  agentFee: 0,
  taxFee: 0,
  coinSlots: [
    { id: 'sellMoney', label: '卖钱', amount: 0, filled: false },
    { id: 'buyMoney', label: '买钱', amount: 0, filled: false },
    { id: 'agentFee', label: '牙钱', amount: 0, filled: false },
    { id: 'taxFee', label: '税钱', amount: 0, filled: false }
  ],
  selectedCattleId: null,
  showEvaluationPopup: false,
  evaluationPopupPos: { x: 0, y: 0 },
  evaluationPart: null,
  goldParticles: false,
  soundEnabled: true,

  setMarketTrend: (trend) => {
    set({ marketTrend: trend, trendLastUpdate: Date.now() });
    get().adjustPricesForTrend();
  },

  adjustPricesForTrend: () => {
    const { marketTrend, farmerPrice, shopkeeperPrice } = get();
    let newFarmer = farmerPrice;
    let newShopkeeper = shopkeeperPrice;
    
    if (marketTrend === '旺') {
      newShopkeeper = Math.round(shopkeeperPrice * 1.15);
    } else if (marketTrend === '淡') {
      newFarmer = Math.round(farmerPrice * 0.9);
    }
    
    set({
      farmerPrice: newFarmer,
      shopkeeperPrice: newShopkeeper,
      gapPercentage: calculateGap(newFarmer, newShopkeeper)
    });
  },

  evaluateCattle: (cattleId, _part) => {
    const { cattle } = get();
    const cow = cattle.find(c => c.id === cattleId);
    if (!cow) return;
    
    if (!cow.evaluation) {
      const evaluation = generateEvaluation();
      set({
        cattle: cattle.map(c => 
          c.id === cattleId 
            ? { ...c, evaluation }
            : c
        ),
        farmerPrice: Math.max(get().farmerPrice, evaluation.basePrice)
      });
    }
  },

  setFarmerPrice: (price) => {
    const { shopkeeperPrice } = get();
    set({
      farmerPrice: price,
      gapPercentage: calculateGap(price, shopkeeperPrice)
    });
  },

  setShopkeeperPrice: (price) => {
    const { farmerPrice } = get();
    set({
      shopkeeperPrice: price,
      gapPercentage: calculateGap(farmerPrice, price)
    });
  },

  setBambooPosition: (side, x) => {
    const { bambooLeftX, bambooRightX, farmerPrice, shopkeeperPrice } = get();
    const clampedX = Math.max(10, Math.min(90, x));
    
    let newLeft = bambooLeftX;
    let newRight = bambooRightX;
    
    if (side === 'left') {
      newLeft = Math.min(clampedX, bambooRightX - 5);
    } else {
      newRight = Math.max(clampedX, bambooLeftX + 5);
    }
    
    const totalRange = 80;
    const leftPos = (newLeft - 10) / totalRange;
    const rightPos = (90 - newRight) / totalRange;
    
    const minPrice = Math.min(farmerPrice, shopkeeperPrice);
    const maxPrice = Math.max(farmerPrice, shopkeeperPrice);
    const priceRange = maxPrice - minPrice;
    
    let newFarmer = farmerPrice;
    let newShopkeeper = shopkeeperPrice;
    
    if (farmerPrice > shopkeeperPrice) {
      newFarmer = Math.round(maxPrice - leftPos * priceRange * 0.5);
      newShopkeeper = Math.round(minPrice + rightPos * priceRange * 0.5);
    } else {
      newFarmer = Math.round(minPrice + leftPos * priceRange * 0.5);
      newShopkeeper = Math.round(maxPrice - rightPos * priceRange * 0.5);
    }
    
    set({
      bambooLeftX: newLeft,
      bambooRightX: newRight,
      farmerPrice: newFarmer,
      shopkeeperPrice: newShopkeeper,
      gapPercentage: calculateGap(newFarmer, newShopkeeper)
    });
  },

  setDraggingBamboo: (side) => set({ isDraggingBamboo: side }),

  checkDeal: () => {
    const { gapPercentage } = get();
    return gapPercentage <= 5;
  },

  completeDeal: () => {
    const { farmerPrice, shopkeeperPrice, cattle } = get();
    const transactionAmount = Math.round((farmerPrice + shopkeeperPrice) / 2);
    const agentFee = Math.round(transactionAmount * 0.03);
    const taxFee = Math.round(transactionAmount * 0.02);
    
    const unsoldCattle = cattle.find(c => !c.isSold);
    
    set({
      transactionAmount,
      agentFee,
      taxFee,
      dealCompleted: true,
      showSettlement: true,
      cattle: cattle.map(c => 
        c.id === unsoldCattle?.id 
          ? { ...c, isSold: true, showRedRibbon: true }
          : c
      ),
      coinSlots: [
        { id: 'sellMoney', label: '卖钱', amount: transactionAmount, filled: false },
        { id: 'buyMoney', label: '买钱', amount: transactionAmount, filled: false },
        { id: 'agentFee', label: '牙钱', amount: agentFee, filled: false },
        { id: 'taxFee', label: '税钱', amount: taxFee, filled: false }
      ]
    });
  },

  setShowSettlement: (show) => set({ showSettlement: show }),

  fillCoinSlot: (slotId) => {
    const { coinSlots } = get();
    const slot = coinSlots.find(s => s.id === slotId);
    if (!slot || slot.filled) return false;
    
    set({
      coinSlots: coinSlots.map(s => 
        s.id === slotId ? { ...s, filled: true } : s
      )
    });
    return true;
  },

  resetCoinSlot: (slotId) => {
    set({
      coinSlots: get().coinSlots.map(s => 
        s.id === slotId ? { ...s, filled: false } : s
      )
    });
  },

  setSelectedCattle: (id) => set({ selectedCattleId: id }),

  setShowEvaluationPopup: (show, pos, part) => set({
    showEvaluationPopup: show,
    evaluationPopupPos: pos || { x: 0, y: 0 },
    evaluationPart: part || null
  }),

  triggerGoldParticles: () => {
    set({ goldParticles: true });
    setTimeout(() => set({ goldParticles: false }), 2000);
  },

  resetMarket: () => {
    set({
      dealCompleted: false,
      showSettlement: false,
      bambooLeftX: 20,
      bambooRightX: 80,
      coinSlots: [
        { id: 'sellMoney', label: '卖钱', amount: 0, filled: false },
        { id: 'buyMoney', label: '买钱', amount: 0, filled: false },
        { id: 'agentFee', label: '牙钱', amount: 0, filled: false },
        { id: 'taxFee', label: '税钱', amount: 0, filled: false }
      ]
    });
  }
}));
