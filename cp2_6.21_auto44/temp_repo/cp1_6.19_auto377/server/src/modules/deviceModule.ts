import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface Device {
  id: string;
  name: string;
  model: string;
  type: '显微镜' | '离心机' | '光谱仪';
  stock: number;
  description: string;
}

const devices: Device[] = [
  {
    id: uuidv4(),
    name: '光学显微镜',
    model: 'OM-2000',
    type: '显微镜',
    stock: 5,
    description: '高分辨率光学显微镜，适用于细胞观察和生物样品分析。配备10x、40x、100x物镜，支持明场和相差观察模式。',
  },
  {
    id: uuidv4(),
    name: '荧光显微镜',
    model: 'FM-3500',
    type: '显微镜',
    stock: 3,
    description: '高级荧光显微镜，支持多通道荧光成像，配备LED光源和高灵敏度CCD相机。适用于免疫荧光和活细胞成像。',
  },
  {
    id: uuidv4(),
    name: '共聚焦显微镜',
    model: 'CM-8000',
    type: '显微镜',
    stock: 2,
    description: '激光共聚焦扫描显微镜，可获取高分辨率三维图像。支持多色荧光同时成像和Z轴扫描。',
  },
  {
    id: uuidv4(),
    name: '高速离心机',
    model: 'HC-15000',
    type: '离心机',
    stock: 4,
    description: '高速冷冻离心机，最高转速15000rpm，最大离心力21000g。配备多种转子，适用于核酸、蛋白分离。',
  },
  {
    id: uuidv4(),
    name: '超速离心机',
    model: 'UC-100K',
    type: '离心机',
    stock: 2,
    description: '超速离心机，最高转速100000rpm，最大离心力800000g。适用于亚细胞器分离和病毒纯化。',
  },
  {
    id: uuidv4(),
    name: '台式离心机',
    model: 'TC-5000',
    type: '离心机',
    stock: 6,
    description: '小型台式离心机，最高转速5000rpm，适用于常规样本处理和快速离心。',
  },
  {
    id: uuidv4(),
    name: '紫外可见分光光度计',
    model: 'UV-2600',
    type: '光谱仪',
    stock: 3,
    description: '双光束紫外可见分光光度计，波长范围190-1100nm。适用于核酸、蛋白定量和光谱扫描。',
  },
  {
    id: uuidv4(),
    name: '荧光分光光度计',
    model: 'F-7000',
    type: '光谱仪',
    stock: 2,
    description: '高灵敏度荧光分光光度计，支持三维荧光扫描和时间分辨荧光测量。适用于微量物质分析。',
  },
  {
    id: uuidv4(),
    name: '傅里叶红外光谱仪',
    model: 'FTIR-6500',
    type: '光谱仪',
    stock: 2,
    description: '傅里叶变换红外光谱仪，波数范围7800-350cm-1。适用于化合物结构鉴定和材料分析。',
  },
];

const deviceRouter = Router();

deviceRouter.get('/', (req, res) => {
  try {
    const { type } = req.query;
    let filteredDevices = devices;
    if (type && type !== '全部') {
      filteredDevices = devices.filter((d) => d.type === type);
    }
    setTimeout(() => {
      res.json(filteredDevices);
    }, 500);
  } catch (error) {
    res.status(500).json({ error: '获取设备列表失败' });
  }
});

deviceRouter.get('/:id', (req, res) => {
  try {
    const device = devices.find((d) => d.id === req.params.id);
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: '获取设备信息失败' });
  }
});

export { deviceRouter, devices };
