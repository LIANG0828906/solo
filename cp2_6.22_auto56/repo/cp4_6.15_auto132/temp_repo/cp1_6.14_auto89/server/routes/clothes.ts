// ============================================================
// 衣物 CRUD 路由
// 数据流向：客户端请求 → 认证中间件 → 数据库操作 → 返回结果
// 调用关系：server/index.ts 中注册，依赖 server/middleware/auth.ts 和 server/db.ts
// ============================================================

import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import authMiddleware from '../middleware/auth.js';
import type { Cloth, ClothCategory, ClothStyle, ClothSeason } from '../../src/types/index.js';

const router = Router();

// ESM 模式下获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 上传目录路径
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// 确保上传目录存在
async function ensureUploadsDir(): Promise<void> {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

// multer 存储配置（内存存储，方便 sharp 处理）
const storage = multer.memoryStorage();

// multer 配置
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  },
});

/**
 * 处理并压缩图片
 * 使用 sharp 将图片压缩到 400x400
 * 
 * @param buffer 图片缓冲区
 * @param filename 保存的文件名
 * @returns 保存后的图片 URL 路径
 */
async function processImage(buffer: Buffer, filename: string): Promise<string> {
  await ensureUploadsDir();

  const outputPath = path.join(UPLOADS_DIR, filename);

  // 使用 sharp 压缩图片到 400x400
  await sharp(buffer)
    .resize(400, 400, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 80 })
    .toFile(outputPath);

  // 返回可访问的 URL 路径
  return `/uploads/${filename}`;
}

/**
 * 获取当前用户所有衣物
 * GET /api/clothes
 * 
 * 需要认证
 * 
 * 查询参数：
 * - category: 可选，按分类筛选
 * 
 * 响应：
 * - success: 是否成功
 * - data: 衣物数组（按 order 排序）
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { category } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: '用户未认证',
      });
      return;
    }

    // 读取数据库
    await db.read();

    // 过滤当前用户的衣物
    let clothes = db.data.clothes.filter(c => c.userId === userId);

    // 按分类筛选
    if (category && typeof category === 'string') {
      clothes = clothes.filter(c => c.category === category);
    }

    // 按 order 排序
    clothes.sort((a, b) => a.order - b.order);

    res.json({
      success: true,
      data: clothes,
    });
  } catch (error) {
    console.error('Get clothes error:', error);
    res.status(500).json({
      success: false,
      error: '获取衣物列表失败',
    });
  }
});

/**
 * 创建新衣物
 * POST /api/clothes
 * 
 * 需要认证
 * 
 * 请求体（multipart/form-data）：
 * - image: 图片文件
 * - name: 衣物名称
 * - category: 衣物分类
 * - styles: 风格标签（JSON 字符串数组）
 * - seasons: 季节标签（JSON 字符串数组）
 * 
 * 响应：
 * - success: 是否成功
 * - data: 新创建的衣物对象
 */
router.post('/', authMiddleware, upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: '用户未认证',
      });
      return;
    }

    const { name, category, styles, seasons } = req.body;

    // 参数验证
    if (!name || !category) {
      res.status(400).json({
        success: false,
        error: '衣物名称和分类不能为空',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: '请上传衣物图片',
      });
      return;
    }

    // 解析 styles 和 seasons
    let stylesArray: ClothStyle[] = [];
    let seasonsArray: ClothSeason[] = [];

    try {
      if (styles) {
        stylesArray = typeof styles === 'string' ? JSON.parse(styles) : styles;
      }
      if (seasons) {
        seasonsArray = typeof seasons === 'string' ? JSON.parse(seasons) : seasons;
      }
    } catch {
      res.status(400).json({
        success: false,
        error: '风格或季节参数格式错误',
      });
      return;
    }

    // 读取数据库
    await db.read();

    // 计算当前用户衣物数量作为 order
    const userClothes = db.data.clothes.filter(c => c.userId === userId);
    const nextOrder = userClothes.length;

    // 处理图片
    const imageFilename = `${uuidv4()}.jpg`;
    const imageUrl = await processImage(req.file.buffer, imageFilename);

    // 创建新衣物
    const newCloth: Cloth = {
      id: uuidv4(),
      userId,
      name,
      category: category as ClothCategory,
      imageUrl,
      styles: stylesArray,
      seasons: seasonsArray,
      order: nextOrder,
      createdAt: new Date().toISOString(),
    };

    // 保存到数据库
    db.data.clothes.push(newCloth);
    await db.write();

    res.status(201).json({
      success: true,
      data: newCloth,
    });
  } catch (error) {
    console.error('Create cloth error:', error);
    res.status(500).json({
      success: false,
      error: '创建衣物失败',
    });
  }
});

/**
 * 更新衣物信息
 * PUT /api/clothes/:id
 * 
 * 需要认证
 * 
 * 请求体（multipart/form-data，可选）：
 * - image: 图片文件（可选）
 * - name: 衣物名称
 * - category: 衣物分类
 * - styles: 风格标签（JSON 字符串数组）
 * - seasons: 季节标签（JSON 字符串数组）
 * 
 * 响应：
 * - success: 是否成功
 * - data: 更新后的衣物对象
 */
router.put('/:id', authMiddleware, upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: '用户未认证',
      });
      return;
    }

    // 读取数据库
    await db.read();

    // 查找衣物
    const clothIndex = db.data.clothes.findIndex(c => c.id === id);
    if (clothIndex === -1) {
      res.status(404).json({
        success: false,
        error: '衣物不存在',
      });
      return;
    }

    const cloth = db.data.clothes[clothIndex];

    // 验证权限
    if (cloth.userId !== userId) {
      res.status(403).json({
        success: false,
        error: '无权限修改此衣物',
      });
      return;
    }

    const { name, category, styles, seasons } = req.body;

    // 更新字段
    if (name !== undefined) cloth.name = name;
    if (category !== undefined) cloth.category = category as ClothCategory;

    // 解析 styles 和 seasons
    if (styles !== undefined) {
      try {
        cloth.styles = typeof styles === 'string' ? JSON.parse(styles) : styles;
      } catch {
        res.status(400).json({
          success: false,
          error: '风格参数格式错误',
        });
        return;
      }
    }

    if (seasons !== undefined) {
      try {
        cloth.seasons = typeof seasons === 'string' ? JSON.parse(seasons) : seasons;
      } catch {
        res.status(400).json({
          success: false,
          error: '季节参数格式错误',
        });
        return;
      }
    }

    // 更新图片
    if (req.file) {
      // 删除旧图片
      const oldImagePath = path.join(UPLOADS_DIR, path.basename(cloth.imageUrl));
      try {
        await fs.unlink(oldImagePath);
      } catch {
        // 忽略删除失败
      }

      // 处理新图片
      const imageFilename = `${uuidv4()}.jpg`;
      cloth.imageUrl = await processImage(req.file.buffer, imageFilename);
    }

    // 保存到数据库
    await db.write();

    res.json({
      success: true,
      data: cloth,
    });
  } catch (error) {
    console.error('Update cloth error:', error);
    res.status(500).json({
      success: false,
      error: '更新衣物失败',
    });
  }
});

/**
 * 删除衣物
 * DELETE /api/clothes/:id
 * 
 * 需要认证
 * 
 * 响应：
 * - success: 是否成功
 * - data: { message }
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: '用户未认证',
      });
      return;
    }

    // 读取数据库
    await db.read();

    // 查找衣物
    const clothIndex = db.data.clothes.findIndex(c => c.id === id);
    if (clothIndex === -1) {
      res.status(404).json({
        success: false,
        error: '衣物不存在',
      });
      return;
    }

    const cloth = db.data.clothes[clothIndex];

    // 验证权限
    if (cloth.userId !== userId) {
      res.status(403).json({
        success: false,
        error: '无权限删除此衣物',
      });
      return;
    }

    // 删除图片文件
    const imagePath = path.join(UPLOADS_DIR, path.basename(cloth.imageUrl));
    try {
      await fs.unlink(imagePath);
    } catch {
      // 忽略删除失败
    }

    // 从数据库中删除
    db.data.clothes.splice(clothIndex, 1);

    // 更新 order（重新排序）
    const userClothes = db.data.clothes.filter(c => c.userId === userId);
    userClothes.sort((a, b) => a.order - b.order);
    userClothes.forEach((c, index) => {
      c.order = index;
    });

    // 保存到数据库
    await db.write();

    res.json({
      success: true,
      data: { message: '删除成功' },
    });
  } catch (error) {
    console.error('Delete cloth error:', error);
    res.status(500).json({
      success: false,
      error: '删除衣物失败',
    });
  }
});

/**
 * 拖拽排序
 * PATCH /api/clothes/reorder
 * 
 * 需要认证
 * 
 * 请求体：
 * - order: 衣物 ID 数组（按新顺序排列）
 * 
 * 响应：
 * - success: 是否成功
 * - data: { message }
 */
router.patch('/reorder', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { order } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: '用户未认证',
      });
      return;
    }

    if (!Array.isArray(order)) {
      res.status(400).json({
        success: false,
        error: '排序数据格式错误',
      });
      return;
    }

    // 读取数据库
    await db.read();

    // 更新每件衣物的 order
    order.forEach((clothId: string, index: number) => {
      const cloth = db.data.clothes.find(c => c.id === clothId);
      if (cloth && cloth.userId === userId) {
        cloth.order = index;
      }
    });

    // 保存到数据库
    await db.write();

    res.json({
      success: true,
      data: { message: '排序更新成功' },
    });
  } catch (error) {
    console.error('Reorder clothes error:', error);
    res.status(500).json({
      success: false,
      error: '排序更新失败',
    });
  }
});

export default router;
