import { Router, Request, Response } from 'express';
import { store } from '../store';
import type {
  ApiResponse,
  CreateSaleRequest,
  DailySalesData,
  IngredientConsumption,
  ReportData,
  Sale,
  SaleItem,
  TodaySalesSummary,
} from '@shared/types';

const router = Router();

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

router.get('/', (_req: Request, res: Response<ApiResponse<Sale[]>>) => {
  try {
    const sales = store.getSales();
    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取销售记录失败' });
  }
});

router.get('/today', (_req: Request, res: Response<ApiResponse<TodaySalesSummary>>) => {
  try {
    const today = getTodayDateString();
    const todaySales = store.getSalesByDate(today);

    const summary: TodaySalesSummary = {
      totalSales: 0,
      totalCost: 0,
      totalProfit: 0,
      orderCount: todaySales.length,
    };

    for (const sale of todaySales) {
      summary.totalSales += sale.totalAmount;
      summary.totalCost += sale.totalCost;
      summary.totalProfit += sale.totalProfit;
    }

    summary.totalSales = Number(summary.totalSales.toFixed(2));
    summary.totalCost = Number(summary.totalCost.toFixed(2));
    summary.totalProfit = Number(summary.totalProfit.toFixed(2));

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取今日销售统计失败' });
  }
});

router.get('/report/30days', (_req: Request, res: Response<ApiResponse<ReportData>>) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const sales = store.getSalesByDateRange(startStr, endStr);
    const ingredients = store.getIngredients();

    const dailyMap = new Map<string, DailySalesData>();
    const consumptionMap = new Map<string, IngredientConsumption>();

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyMap.set(dateStr, {
        date: dateStr,
        totalSales: 0,
        totalCost: 0,
        totalProfit: 0,
        orderCount: 0,
      });
    }

    for (const sale of sales) {
      const daily = dailyMap.get(sale.saleDate);
      if (daily) {
        daily.totalSales += sale.totalAmount;
        daily.totalCost += sale.totalCost;
        daily.totalProfit += sale.totalProfit;
        daily.orderCount += 1;
      }

      for (const item of sale.items) {
        const drink = store.getDrinkById(item.drinkId);
        if (drink) {
          for (const ing of drink.ingredients) {
            const used = ing.amount * item.quantity;
            const existing = consumptionMap.get(ing.ingredientId);
            if (existing) {
              existing.totalUsed += used;
            } else {
              const ingredient = ingredients.find((i) => i.id === ing.ingredientId);
              consumptionMap.set(ing.ingredientId, {
                ingredientId: ing.ingredientId,
                ingredientName: ing.ingredientName,
                totalUsed: used,
                unit: ingredient?.unit || ing.unit,
              });
            }
          }
        }
      }
    }

    const salesTrend = Array.from(dailyMap.values()).map((d) => ({
      ...d,
      totalSales: Number(d.totalSales.toFixed(2)),
      totalCost: Number(d.totalCost.toFixed(2)),
      totalProfit: Number(d.totalProfit.toFixed(2)),
    }));

    const ingredientRanking = Array.from(consumptionMap.values())
      .sort((a, b) => b.totalUsed - a.totalUsed)
      .map((c) => ({
        ...c,
        totalUsed: Number(c.totalUsed.toFixed(2)),
      }));

    res.json({ success: true, data: { salesTrend, ingredientRanking } });
  } catch (error) {
    res.status(500).json({ success: false, error: '生成报告数据失败' });
  }
});

router.post('/', (req: Request<unknown, unknown, CreateSaleRequest>, res: Response<ApiResponse<Sale>>) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: '销售条目不能为空' });
      return;
    }

    const saleItems: SaleItem[] = [];
    const deductions: { ingredientId: string; amount: number }[] = [];

    for (const item of items) {
      const drink = store.getDrinkById(item.drinkId);
      if (!drink) {
        res.status(404).json({ success: false, error: `饮品不存在: ${item.drinkId}` });
        return;
      }

      for (const ing of drink.ingredients) {
        const ingredient = store.getIngredientById(ing.ingredientId);
        if (!ingredient) {
          res.status(404).json({ success: false, error: `原料不存在: ${ing.ingredientName}` });
          return;
        }
        const requiredAmount = ing.amount * item.quantity;
        if (ingredient.stock < requiredAmount) {
          res.status(400).json({ success: false, error: `${ingredient.name} 库存不足` });
          return;
        }
      }
    }

    for (const item of items) {
      const drink = store.getDrinkById(item.drinkId)!;
      const unitCost = drink.ingredients.reduce(
        (sum, ing) => sum + (store.getIngredientById(ing.ingredientId)?.purchasePrice || 0) * ing.amount,
        0
      );

      saleItems.push({
        drinkId: drink.id,
        drinkName: drink.name,
        quantity: item.quantity,
        unitPrice: drink.price,
        unitCost: Number(unitCost.toFixed(2)),
        subtotal: drink.price * item.quantity,
        totalCost: Number((unitCost * item.quantity).toFixed(2)),
      });

      for (const ing of drink.ingredients) {
        deductions.push({
          ingredientId: ing.ingredientId,
          amount: ing.amount * item.quantity,
        });
      }
    }

    for (const ded of deductions) {
      store.deductStock(ded.ingredientId, ded.amount);
    }

    const totalAmount = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalCost = saleItems.reduce((sum, item) => sum + item.totalCost, 0);

    const newSale = store.addSale({
      items: saleItems,
      totalAmount: Number(totalAmount.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      totalProfit: Number((totalAmount - totalCost).toFixed(2)),
      saleDate: getTodayDateString(),
    });

    res.status(201).json({ success: true, data: newSale });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建销售记录失败' });
  }
});

export default router;
