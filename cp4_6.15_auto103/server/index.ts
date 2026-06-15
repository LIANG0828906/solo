import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

// ============================================================
// 类型定义
// ============================================================

// 贝塞尔曲线控制点
interface BezierPoint {
  x: number;
  y: number;
}

// 笔触线条元素
interface StrokeElement {
  id: string;
  type: 'stroke';
  label: string;
  confidence: number;
  name: string;
  visible: boolean;
  pathData: string;
  points: BezierPoint[];
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
}

// 几何形状元素
interface ShapeElement {
  id: string;
  type: 'shape';
  label: string;
  confidence: number;
  name: string;
  visible: boolean;
  shapeType: 'rectangle' | 'circle' | 'triangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
}

// 文字区域元素
interface TextElement {
  id: string;
  type: 'text';
  label: string;
  confidence: number;
  name: string;
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
}

// 矢量化识别结果
interface VectorizationResult {
  imageWidth: number;
  imageHeight: number;
  strokes: StrokeElement[];
  shapes: ShapeElement[];
  text: TextElement[];
}

// 统一响应格式
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 导出请求体
interface ExportRequest {
  layers: (StrokeElement | ShapeElement | TextElement)[];
  selectedIds?: string[];
  exportAll?: boolean;
  imageWidth: number;
  imageHeight: number;
}

// 导出响应
interface ExportResponse {
  svgContent: string;
  fileName: string;
}

// ============================================================
// 配置与初始化
// ============================================================

const app = express();
const PORT = 3001;

// 配置 multer：内存存储，最大10MB
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 jpg、png、webp 格式的图片'));
    }
  },
});

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============================================================
// 工具函数
// ============================================================

/**
 * 生成指定范围内的随机数
 */
function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 生成指定范围内的随机整数
 */
function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

/**
 * 生成随机置信度 (85% - 98%)
 */
function randomConfidence(): number {
  return Math.round(randomRange(85, 98) * 10) / 10;
}

/**
 * 生成贝塞尔曲线路径数据
 */
function generateBezierPath(points: BezierPoint[]): string {
  if (points.length < 2) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 3) {
    if (i + 2 < points.length) {
      path += ` C ${points[i].x} ${points[i].y}, ${points[i + 1].x} ${points[i + 1].y}, ${points[i + 2].x} ${points[i + 2].y}`;
    }
  }
  return path;
}

// ============================================================
// 模拟图像处理逻辑
// ============================================================

/**
 * 模拟边缘检测与轮廓提取
 * 根据图片尺寸生成合理的模拟矢量化结果
 * 数据流向：图片尺寸 → 生成模拟元素 → 返回结构化数据
 */
function simulateVectorization(width: number, height: number): VectorizationResult {
  const strokes: StrokeElement[] = [];
  const shapes: ShapeElement[] = [];
  const textItems: TextElement[] = [];

  // 根据图片尺寸调整生成元素的数量比例
  const scale = Math.min(width, height) / 500;
  const strokeCount = randomInt(Math.max(5, Math.floor(5 * scale)), Math.max(8, Math.floor(8 * scale)));
  const shapeCount = randomInt(3, 5);
  const textCount = randomInt(2, 3);

  // 生成笔触线条（贝塞尔曲线）
  for (let i = 0; i < strokeCount; i++) {
    const points: BezierPoint[] = [];
    const startX = randomRange(width * 0.1, width * 0.9);
    const startY = randomRange(height * 0.1, height * 0.9);
    points.push({ x: startX, y: startY });

    // 每条曲线3-6个控制点
    const controlPointCount = randomInt(3, 6) * 3;
    let prevX = startX;
    let prevY = startY;

    for (let j = 0; j < controlPointCount; j++) {
      const offsetX = randomRange(-width * 0.15, width * 0.15);
      const offsetY = randomRange(-height * 0.1, height * 0.1);
      let newX = prevX + offsetX;
      let newY = prevY + offsetY;
      // 确保坐标在图片范围内
      newX = Math.max(width * 0.05, Math.min(width * 0.95, newX));
      newY = Math.max(height * 0.05, Math.min(height * 0.95, newY));
      points.push({ x: newX, y: newY });
      prevX = newX;
      prevY = newY;
    }

    strokes.push({
      id: uuidv4(),
      type: 'stroke',
      label: '笔触线条',
      confidence: randomConfidence(),
      name: `线条 ${i + 1}`,
      visible: true,
      pathData: generateBezierPath(points),
      points,
      strokeColor: '#333333',
      strokeWidth: 2,
      opacity: 1,
    });
  }

  // 生成几何形状
  const shapeTypes: ('rectangle' | 'circle' | 'triangle')[] = ['rectangle', 'circle', 'triangle'];
  const shapeLabels: Record<string, string> = {
    rectangle: '矩形',
    circle: '圆形',
    triangle: '三角形',
  };

  for (let i = 0; i < shapeCount; i++) {
    const shapeType = shapeTypes[randomInt(0, 2)];
    const shapeWidth = randomRange(width * 0.08, width * 0.25);
    const shapeHeight = randomRange(height * 0.08, height * 0.25);
    const x = randomRange(width * 0.1, width * 0.9 - shapeWidth);
    const y = randomRange(height * 0.1, height * 0.9 - shapeHeight);

    shapes.push({
      id: uuidv4(),
      type: 'shape',
      label: `几何形状·${shapeLabels[shapeType]}`,
      confidence: randomConfidence(),
      name: `${shapeLabels[shapeType]} ${i + 1}`,
      visible: true,
      shapeType,
      x,
      y,
      width: shapeWidth,
      height: shapeHeight,
      fill: 'transparent',
      stroke: '#555555',
      strokeWidth: 2,
      opacity: 1,
      rotation: 0,
    });
  }

  // 生成文字区域
  const sampleTexts = ['标题文字', '说明文本', '备注', '标签', '描述内容'];
  for (let i = 0; i < textCount; i++) {
    const textWidth = randomRange(width * 0.1, width * 0.3);
    const textHeight = randomRange(height * 0.04, height * 0.08);
    const x = randomRange(width * 0.1, width * 0.9 - textWidth);
    const y = randomRange(height * 0.1, height * 0.9 - textHeight);

    textItems.push({
      id: uuidv4(),
      type: 'text',
      label: '文字区域',
      confidence: randomConfidence(),
      name: `文本 ${i + 1}`,
      visible: true,
      x,
      y,
      width: textWidth,
      height: textHeight,
      text: sampleTexts[i % sampleTexts.length],
      fontSize: Math.max(14, Math.floor(textHeight * 0.6)),
      color: '#222222',
      opacity: 1,
    });
  }

  return {
    imageWidth: width,
    imageHeight: height,
    strokes,
    shapes,
    text: textItems,
  };
}

// ============================================================
// SVG 生成模块
// ============================================================

/**
 * 将图层数据转换为标准SVG字符串
 * 数据流向：图层数组 → 逐个渲染为SVG元素 → 拼接完整SVG
 */
function generateSVG(
  layers: (StrokeElement | ShapeElement | TextElement)[],
  imageWidth: number,
  imageHeight: number,
  selectedIds?: string[],
  exportAll = true,
): string {
  // 过滤要导出的图层
  const exportLayers = exportAll
    ? layers.filter(layer => layer.visible)
    : layers.filter(layer => selectedIds?.includes(layer.id) && layer.visible);

  let svgContent = '';

  for (const layer of exportLayers) {
    if (!layer.visible) continue;

    const opacity = layer.opacity;

    if (layer.type === 'stroke') {
      const stroke = layer as StrokeElement;
      svgContent += `  <path d="${stroke.pathData}" fill="none" stroke="${stroke.strokeColor}" stroke-width="${stroke.strokeWidth}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round" />\n`;
    } else if (layer.type === 'shape') {
      const shape = layer as ShapeElement;
      const transform = shape.rotation
        ? ` transform="rotate(${shape.rotation} ${shape.x + shape.width / 2} ${shape.y + shape.height / 2})"`
        : '';

      if (shape.shapeType === 'rectangle') {
        svgContent += `  <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
      } else if (shape.shapeType === 'circle') {
        const cx = shape.x + shape.width / 2;
        const cy = shape.y + shape.height / 2;
        const rx = shape.width / 2;
        const ry = shape.height / 2;
        svgContent += `  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
      } else if (shape.shapeType === 'triangle') {
        const x1 = shape.x + shape.width / 2;
        const y1 = shape.y;
        const x2 = shape.x;
        const y2 = shape.y + shape.height;
        const x3 = shape.x + shape.width;
        const y3 = shape.y + shape.height;
        svgContent += `  <polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
      }
    } else if (layer.type === 'text') {
      const text = layer as TextElement;
      svgContent += `  <text x="${text.x}" y="${text.y + text.fontSize}" font-size="${text.fontSize}" fill="${text.color}" opacity="${opacity}" font-family="sans-serif">${text.text}</text>\n`;
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${imageWidth}" height="${imageHeight}" viewBox="0 0 ${imageWidth} ${imageHeight}">
  <g id="sketch-layers">
${svgContent}  </g>
</svg>`;

  return svg;
}

// ============================================================
// API 路由
// ============================================================

/**
 * POST /api/upload
 * 接收图片文件，模拟矢量化识别处理
 * 数据流向：multipart/form-data → multer解析 → sharp获取尺寸 → 模拟矢量化 → 返回JSON结果
 */
app.post('/api/upload', upload.single('image'), async (req: Request, res: Response<ApiResponse<VectorizationResult>>) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: '未接收到图片文件',
        message: '请选择要上传的图片',
      });
      return;
    }

    // 使用 sharp 获取图片信息（尺寸、格式等）
    const imageInfo = await sharp(req.file.buffer).metadata();

    if (!imageInfo.width || !imageInfo.height) {
      res.status(400).json({
        success: false,
        error: '无法获取图片尺寸',
        message: '图片格式可能损坏',
      });
      return;
    }

    // 模拟处理时间：1-3秒
    const processingTime = randomRange(1000, 3000);
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // 模拟边缘检测与轮廓提取，生成矢量化结果
    const result = simulateVectorization(imageInfo.width, imageInfo.height);

    res.json({
      success: true,
      data: result,
      message: '识别完成',
    });
  } catch (error) {
    console.error('上传处理错误:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误',
      message: '图片处理失败，请重试',
    });
  }
});

/**
 * POST /api/export
 * 接收图层数据，生成标准SVG字符串
 * 数据流向：JSON图层数据 → 过滤选中图层 → 生成SVG → 返回SVG内容和文件名
 */
app.post('/api/export', (req: Request<unknown, unknown, ExportRequest>, res: Response<ApiResponse<ExportResponse>>) => {
  try {
    const { layers, selectedIds, exportAll = true, imageWidth, imageHeight } = req.body;

    if (!layers || !Array.isArray(layers) || layers.length === 0) {
      res.status(400).json({
        success: false,
        error: '图层数据为空',
        message: '没有可导出的图层',
      });
      return;
    }

    if (!imageWidth || !imageHeight) {
      res.status(400).json({
        success: false,
        error: '缺少图片尺寸信息',
        message: '请提供图片宽度和高度',
      });
      return;
    }

    // 生成SVG
    const svgContent = generateSVG(layers, imageWidth, imageHeight, selectedIds, exportAll);

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `sketch-export-${timestamp}.svg`;

    res.json({
      success: true,
      data: {
        svgContent,
        fileName,
      },
      message: 'SVG生成成功',
    });
  } catch (error) {
    console.error('导出错误:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误',
      message: 'SVG生成失败，请重试',
    });
  }
});

// ============================================================
// 错误处理中间件
// ============================================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('服务器错误:', err);

  // multer 文件大小限制错误
  if (err.message.includes('File too large')) {
    res.status(413).json({
      success: false,
      error: '文件过大',
      message: '图片大小不能超过 10MB',
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: err.message || '服务器内部错误',
    message: '请求处理失败',
  });
});

// ============================================================
// 启动服务
// ============================================================

app.listen(PORT, () => {
  console.log(`
============================================
  草图矢量化后端服务已启动
  端口: ${PORT}
  环境: 开发模式
============================================
  `);
});

export default app;
