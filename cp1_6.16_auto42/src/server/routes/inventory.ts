import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { InventoryItem, InventoryLog, Notification, ApiResponse } from '../../client/types';
import { mockInventory, mockInventoryLogs, mockNotifications } from '../data/mockData';

const router = Router();

let inventory: InventoryItem[] = [...mockInventory];
let inventoryLogs: InventoryLog[] = [...mockInventoryLogs];
let notifications: Notification[] = [...mockNotifications];

const nameIndex: Map<string, InventoryItem[]> = new Map();
const categoryIndex: Map<string, InventoryItem[]> = new Map();

const buildIndexes = () => {
  nameIndex.clear();
  categoryIndex.clear();

  for (const item of inventory) {
    const nameKey = item.name.toLowerCase();
    if (!nameIndex.has(nameKey)) {
      nameIndex.set(nameKey, []);
    }
    nameIndex.get(nameKey)!.push(item);

    if (!categoryIndex.has(item.category)) {
      categoryIndex.set(item.category, []);
    }
    categoryIndex.get(item.category)!.push(item);
  }
};

buildIndexes();

const checkLowStockAndNotify = (item: InventoryItem, broadcast?: (message: { type: string; payload: Notification }) => void) => {
  if (item.quantity <= item.threshold) {
    const existingNotification = notifications.find(
      n => n.type === 'low_stock' && n.message.includes(item.name) && !n.read
    );

    if (!existingNotification) {
      const adminUser = 'admin';
      const newNotification: Notification = {
        id: uuidv4(),
        userId: adminUser,
        type: 'low_stock',
        message: `库存预警：${item.name}库存不足（剩余${item.quantity}${item.unit}）`,
        read: false,
        createdAt: new Date().toISOString()
      };
      notifications.push(newNotification);

      if (broadcast) {
        broadcast({
          type: 'notification',
          payload: newNotification
        });
      }
    }
  }
};

type BroadcastFunction = (message: { type: string; payload: Notification }) => void;

export default (broadcast?: BroadcastFunction) => {
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    const { category, name } = req.query;

    let result: InventoryItem[] = [...inventory];

    if (category) {
      const categoryItems = categoryIndex.get(category as string);
      result = categoryItems ? [...categoryItems] : [];
    }

    if (name) {
      const searchName = (name as string).toLowerCase();
      if (category) {
        result = result.filter(item => item.name.toLowerCase().includes(searchName));
      } else {
        const matchedItems: InventoryItem[] = [];
        for (const [key, items] of nameIndex.entries()) {
          if (key.includes(searchName)) {
            matchedItems.push(...items);
          }
        }
        const uniqueItems = Array.from(new Map(matchedItems.map(item => [item.id, item])).values());
        result = uniqueItems;
      }
    }

    const response: ApiResponse<InventoryItem[]> = {
      success: true,
      data: result
    };

    res.status(200).json(response);
  });

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, category, quantity, unit, expiryDate, supplier, threshold, operatorId } = req.body;

      if (!name || !category || !quantity || !unit || !threshold) {
        const response: ApiResponse = {
          success: false,
          error: '缺少必要参数'
        };
        res.status(400).json(response);
        return;
      }

      let existingItem = inventory.find(item => item.name === name && item.category === category);

      if (existingItem) {
        existingItem.quantity += quantity;
        if (expiryDate) existingItem.expiryDate = expiryDate;
        if (supplier) existingItem.supplier = supplier;

        const log: InventoryLog = {
          id: uuidv4(),
          itemId: existingItem.id,
          type: 'inbound',
          quantity,
          purpose: supplier ? `供应商：${supplier}` : undefined,
          operatorId: operatorId || 'system',
          createdAt: new Date().toISOString()
        };
        inventoryLogs.push(log);

        buildIndexes();
        checkLowStockAndNotify(existingItem, broadcast);

        const response: ApiResponse<InventoryItem> = {
          success: true,
          data: existingItem,
          message: '物资入库成功'
        };
        res.status(200).json(response);
      } else {
        const newItem: InventoryItem = {
          id: uuidv4(),
          name,
          category,
          quantity,
          unit,
          expiryDate,
          supplier,
          threshold,
          createdAt: new Date().toISOString()
        };
        inventory.push(newItem);

        const log: InventoryLog = {
          id: uuidv4(),
          itemId: newItem.id,
          type: 'inbound',
          quantity,
          purpose: supplier ? `供应商：${supplier}` : undefined,
          operatorId: operatorId || 'system',
          createdAt: new Date().toISOString()
        };
        inventoryLogs.push(log);

        buildIndexes();
        checkLowStockAndNotify(newItem, broadcast);

        const response: ApiResponse<InventoryItem> = {
          success: true,
          data: newItem,
          message: '物资创建并入库成功'
        };
        res.status(201).json(response);
      }
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: '服务器内部错误'
      };
      res.status(500).json(response);
    }
  });

  router.put('/:id/outbound', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { quantity, purpose, receiver, operatorId } = req.body;

      if (!quantity || quantity <= 0) {
        const response: ApiResponse = {
          success: false,
          error: '请提供有效的出库数量'
        };
        res.status(400).json(response);
        return;
      }

      const item = inventory.find(i => i.id === id);

      if (!item) {
        const response: ApiResponse = {
          success: false,
          error: '物资不存在'
        };
        res.status(404).json(response);
        return;
      }

      if (item.quantity < quantity) {
        const response: ApiResponse = {
          success: false,
          error: `库存不足，当前库存：${item.quantity}${item.unit}`
        };
        res.status(400).json(response);
        return;
      }

      item.quantity -= quantity;

      const log: InventoryLog = {
        id: uuidv4(),
        itemId: item.id,
        type: 'outbound',
        quantity,
        purpose,
        receiver,
        operatorId: operatorId || 'system',
        createdAt: new Date().toISOString()
      };
      inventoryLogs.push(log);

      buildIndexes();
      checkLowStockAndNotify(item, broadcast);

      const response: ApiResponse<InventoryItem> = {
        success: true,
        data: item,
        message: '物资出库成功'
      };
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: '服务器内部错误'
      };
      res.status(500).json(response);
    }
  });

  router.put('/:id/threshold', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { threshold } = req.body;

      if (threshold === undefined || threshold < 0) {
        const response: ApiResponse = {
          success: false,
          error: '请提供有效的阈值'
        };
        res.status(400).json(response);
        return;
      }

      const item = inventory.find(i => i.id === id);

      if (!item) {
        const response: ApiResponse = {
          success: false,
          error: '物资不存在'
        };
        res.status(404).json(response);
        return;
      }

      item.threshold = threshold;

      buildIndexes();
      checkLowStockAndNotify(item, broadcast);

      const response: ApiResponse<InventoryItem> = {
        success: true,
        data: item,
        message: '库存阈值设置成功'
      };
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: '服务器内部错误'
      };
      res.status(500).json(response);
    }
  });

  return router;
};
