import { DOSAGE_CONVERSION } from '../../server/data/medicines';

export const calculateGrams = (liang: number, qian: number, fen: number, li: number): number => {
  return (
    liang * DOSAGE_CONVERSION.LIANG_TO_GRAMS +
    qian * DOSAGE_CONVERSION.QIAN_TO_GRAMS +
    fen * DOSAGE_CONVERSION.FEN_TO_GRAMS +
    li * DOSAGE_CONVERSION.LI_TO_GRAMS
  );
};

export const formatDosageDisplay = (liang: number, qian: number, fen: number, li: number): string => {
  const parts: string[] = [];
  if (liang > 0) parts.push(`${liang}两`);
  if (qian > 0) parts.push(`${qian}钱`);
  if (fen > 0) parts.push(`${fen}分`);
  if (li > 0) parts.push(`${li}厘`);
  return parts.join(' ') || '0';
};

export const calculateTotalGrams = (items: Array<{ dosage: { grams: number } }>): number => {
  return items.reduce((sum, item) => sum + item.dosage.grams, 0);
};
