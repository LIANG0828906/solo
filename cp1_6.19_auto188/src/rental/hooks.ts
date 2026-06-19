import { useState, useMemo, useCallback } from 'react';
import type { Equipment, DateRange, RentalItem, VoucherData } from '../equipment/types';

function calculateDays(dateRange: DateRange): number {
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

function calculateDynamicCoefficient(rentalRateLast7Days: number[]): { rate: number; coeff: 0.8 | 1.0 | 1.2 } {
  const avg = rentalRateLast7Days.reduce((a, b) => a + b, 0) / rentalRateLast7Days.length;
  let coeff: 0.8 | 1.0 | 1.2 = 1.0;
  if (avg < 0.3) coeff = 0.8;
  else if (avg > 0.7) coeff = 1.2;
  return { rate: avg, coeff };
}

function generateBarcodeId(): { id: string; digits: string } {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  let digits = '';
  for (let i = 0; i < 8; i++) {
    const ch = chars[Math.floor(Math.random() * chars.length)];
    id += ch;
    if (/[0-9]/.test(ch)) {
      digits += ch;
    } else {
      digits += (ch.charCodeAt(0) - 55).toString();
    }
  }
  return { id, digits };
}

export function useRental() {
  const [items, setItems] = useState<RentalItem[]>([]);
  const [voucher, setVoucher] = useState<VoucherData | null>(null);

  const addItem = useCallback((equipment: Equipment, dateRange: DateRange): boolean => {
    const days = calculateDays(dateRange);
    if (days <= 0 || equipment.stock <= 0) return false;
    const { rate, coeff } = calculateDynamicCoefficient(equipment.rentalRateLast7Days);
    const unitPrice = Math.round(equipment.basePrice * coeff * 100) / 100;
    const totalPrice = Math.round(unitPrice * days * 100) / 100;

    const rentalItem: RentalItem = {
      id: `${equipment.id}-${Date.now()}`,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      basePrice: equipment.basePrice,
      dateRange,
      days,
      rentalRate: rate,
      dynamicCoefficient: coeff,
      unitPrice,
      totalPrice,
    };
    setItems(prev => [...prev, rentalItem]);
    return true;
  }, []);

  const removeItem = useCallback((rentalItemId: string) => {
    setItems(prev => prev.filter(i => i.id !== rentalItemId));
  }, []);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [items]);

  const generateVoucher = useCallback((customerName: string, customerPhone: string): VoucherData | null => {
    if (items.length === 0) return null;
    const { id, digits } = generateBarcodeId();
    const startDate = items.reduce((min, cur) => (cur.dateRange.startDate < min ? cur.dateRange.startDate : min), items[0].dateRange.startDate);
    const endDate = items.reduce((max, cur) => (cur.dateRange.endDate > max ? cur.dateRange.endDate : max), items[0].dateRange.endDate);
    const data: VoucherData = {
      id,
      barcodeDigits: digits,
      customerName,
      customerPhone,
      items: [...items],
      startDate,
      endDate,
      totalAmount: Math.round(totalAmount * 100) / 100,
      createdAt: new Date().toISOString(),
    };
    setVoucher(data);
    return data;
  }, [items, totalAmount]);

  const closeVoucher = useCallback(() => {
    setVoucher(null);
  }, []);

  const checkAvailability = useCallback((equipment: Equipment, _dateRange: DateRange): boolean => {
    return equipment.stock > 0;
  }, []);

  return {
    items,
    addItem,
    removeItem,
    totalAmount,
    generateVoucher,
    voucher,
    closeVoucher,
    checkAvailability,
  };
}
