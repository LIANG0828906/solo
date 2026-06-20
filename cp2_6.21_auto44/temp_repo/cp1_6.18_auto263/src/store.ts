import { create } from 'zustand';
import type { DesignStore, ClaspType, EngravingFont, BillItem } from './types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BELT_Y,
  CM_TO_PX_RATIO,
  CLASP_INFO
} from './types';

const CLASP_PRICE_MAP: Record<ClaspType, number> = {
  silver: 15,
  gold: 30,
  copper: 20
};

const ENGRAVING_FEE = 10;
const LEATHER_PRICE_PER_SQ_CM = 0.05;

function calcBill(
  beltLength: number,
  beltWidth: number,
  claspType: ClaspType,
  engravingText: string
): { bill: BillItem[]; totalPrice: number } {
  const bill: BillItem[] = [];

  const widthCm = beltWidth / 10;
  const areaCm2 = beltLength * widthCm;
  const leatherTotal = parseFloat((areaCm2 * LEATHER_PRICE_PER_SQ_CM).toFixed(2));
  bill.push({
    name: '皮料',
    quantity: parseFloat(areaCm2.toFixed(1)),
    unit: 'cm²',
    unitPrice: LEATHER_PRICE_PER_SQ_CM,
    total: leatherTotal
  });

  const claspInfo = CLASP_INFO.find(c => c.type === claspType) || CLASP_INFO[0];
  const claspPrice = CLASP_PRICE_MAP[claspType] || 15;
  bill.push({
    name: claspInfo.name,
    quantity: 1,
    unit: '个',
    unitPrice: claspPrice,
    total: claspPrice
  });

  if (engravingText && engravingText.trim().length > 0) {
    bill.push({
      name: '刻字加工费',
      quantity: 1,
      unit: '次',
      unitPrice: ENGRAVING_FEE,
      total: ENGRAVING_FEE
    });
  }

  const totalPrice = bill.reduce((sum, item) => sum + item.total, 0);
  return { bill, totalPrice: parseFloat(totalPrice.toFixed(2)) };
}

export const useDesignStore = create<DesignStore>((set, get) => {
  const initialLength = 100;
  const initialWidth = 40;
  const initialBeltPx = initialLength * CM_TO_PX_RATIO;
  const initialX = (CANVAS_WIDTH - initialBeltPx) / 2 + initialBeltPx / 2;
  const initialY = BELT_Y;

  const initial = calcBill(initialLength, initialWidth, 'silver', '');

  return {
    leatherColor: '#8B4513',
    claspType: 'silver',
    beltLength: initialLength,
    beltWidth: initialWidth,
    engravingText: '',
    engravingFont: 'KaiTi',
    engravingX: initialX,
    engravingY: initialY,
    fontSize: 24,
    bill: initial.bill,
    totalPrice: initial.totalPrice,

    setColor: (color: string) => set({ leatherColor: color }),

    setClasp: (clasp: ClaspType) => {
      const { beltLength, beltWidth, engravingText } = get();
      const { bill, totalPrice } = calcBill(beltLength, beltWidth, clasp, engravingText);
      set({ claspType: clasp, bill, totalPrice });
    },

    setBeltLength: (length: number) => {
      const { beltWidth, claspType, engravingText, engravingX, engravingY } = get();
      const { bill, totalPrice } = calcBill(length, beltWidth, claspType, engravingText);
      const beltPx = length * CM_TO_PX_RATIO;
      const beltStartX = (CANVAS_WIDTH - beltPx) / 2;
      const beltEndX = beltStartX + beltPx;
      let newX = engravingX;
      let newY = engravingY;
      if (newX < beltStartX + 20) newX = beltStartX + 20;
      if (newX > beltEndX - 20) newX = beltEndX - 20;
      if (Math.abs(newY - BELT_Y) > beltWidth / 2 - 4) {
        newY = BELT_Y;
      }
      set({ beltLength: length, engravingX: newX, engravingY: newY, bill, totalPrice });
    },

    setText: (text: string) => {
      let limited = text;
      let chineseCount = 0;
      let englishCount = 0;
      for (const ch of text) {
        if (/[\u4e00-\u9fa5]/.test(ch)) {
          chineseCount++;
        } else {
          englishCount++;
        }
      }
      if (chineseCount > 4 || englishCount > 8) {
        let c = 0, e = 0;
        limited = '';
        for (const ch of text) {
          if (/[\u4e00-\u9fa5]/.test(ch)) {
            if (c < 4) { limited += ch; c++; }
          } else {
            if (e < 8) { limited += ch; e++; }
          }
        }
      }
      const { beltLength, beltWidth, claspType } = get();
      const { bill, totalPrice } = calcBill(beltLength, beltWidth, claspType, limited);
      set({ engravingText: limited, bill, totalPrice });
    },

    setFont: (font: EngravingFont) => set({ engravingFont: font }),

    setTextPosition: (x: number, y: number) => {
      const { beltLength, beltWidth } = get();
      const beltPx = beltLength * CM_TO_PX_RATIO;
      const beltStartX = (CANVAS_WIDTH - beltPx) / 2;
      const beltEndX = beltStartX + beltPx;
      const beltTop = BELT_Y - beltWidth / 2;
      const beltBottom = BELT_Y + beltWidth / 2;
      const clampedX = Math.max(beltStartX + 10, Math.min(beltEndX - 10, x));
      const clampedY = Math.max(beltTop + 4, Math.min(beltBottom - 4, y));
      set({ engravingX: clampedX, engravingY: clampedY });
    },

    setFontSize: (size: number) => set({ fontSize: size }),

    calculateBill: () => {
      const { beltLength, beltWidth, claspType, engravingText } = get();
      const { bill, totalPrice } = calcBill(beltLength, beltWidth, claspType, engravingText);
      set({ bill, totalPrice });
    },

    loadDesign: (design: Partial<DesignStore>) => {
      set(state => ({ ...state, ...design }));
      const { beltLength, beltWidth, claspType, engravingText } = get();
      const { bill, totalPrice } = calcBill(beltLength, beltWidth, claspType, engravingText);
      set({ bill, totalPrice });
    }
  };
});

export { CANVAS_WIDTH, CANVAS_HEIGHT, BELT_Y, CM_TO_PX_RATIO };
