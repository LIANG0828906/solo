# 在线促销活动管理与A/B测试应用 - 产品需求文档（PRD）

## 1. 产品概述

### 1.1 产品定位
面向营销人员的在线促销活动管理平台，支持多种促销类型的创建、配置和实时A/B测试效果分析。

### 1.2 目标用户
- 电商营销人员
- 运营专员
- 数据分析师

### 1.3 核心价值
- 快速创建多种类型促销活动（满减、折扣、赠品）
- 通过A/B测试科学比较不同促销策略的效果
- 实时监控转化率和关键指标
- 数据驱动的决策支持

## 2. 功能需求

### 2.1 活动管理模块
| 功能点 | 详细说明 | 优先级 |
|--------|----------|--------|
| 活动创建 | 支持满减、折扣、赠品三种促销类型 | P0 |
| 活动编辑 | 修改已有活动配置 | P0 |
| 活动列表 | 卡片式展示所有活动 | P0 |
| 活动启停 | 手动暂停/恢复活动 | P0 |
| 表单验证 | 所有必填项验证 | P0 |

### 2.2 A/B测试配置模块
| 功能点 | 详细说明 | 优先级 |
|--------|----------|--------|
| 测试组定义 | A/B两组独立配置 | P0 |
| 策略分配 | 每组可分配不同促销策略 | P0 |
| 比例设置 | 自定义每组目标用户比例 | P0 |
| 定向分组 | 按地域、会员等级、消费行为分组 | P0 |

### 2.3 实时数据监控模块
| 功能点 | 详细说明 | 优先级 |
|--------|----------|--------|
| 数据轮询 | 5秒间隔自动刷新 | P0 |
| 转化率展示 | 渐变进度环，带滚动动画 | P0 |
| 客单价对比 | 柱状图，数值标签 | P0 |
| 参与人数 | 实时统计 | P0 |

### 2.4 历史分析模块
| 功能点 | 详细说明 | 优先级 |
|--------|----------|--------|
| 转化率趋势 | 折线图展示周期内趋势 | P0 |
| 置信度区间 | 虚线标识上下范围 | P0 |
| 详细数据 | 鼠标悬停显示具体数值 | P0 |

### 2.5 导出模块
| 功能点 | 详细说明 | 优先级 |
|--------|----------|--------|
| CSV导出 | 一键导出统计数据 | P0 |
| 后端生成 | 服务端生成文件触发下载 | P0 |

## 3. 非功能需求

### 3.1 性能指标
- 活动列表首次加载 ≤ 2秒（500条数据）
- A/B测试数据轮询响应 ≤ 500ms
- 页面滚动帧率 ≥ 60FPS

### 3.2 响应式设计
- 桌面端：3列网格
- 平板端：2列网格
- 手机端：单列布局

### 3.3 视觉规范
- **主题**: 深色科技风
- **背景色**: #1a1a2e, #16213e, #0f3460
- **强调色**: #e2b714（金黄色）
- **A组标识**: 绿色渐变
- **B组标识**: 蓝色渐变
- **毛玻璃效果**: backdrop-filter: blur(10px), rgba(255,255,255,0.1)

### 3.4 交互动效
- 卡片加载：从底部滑入，translateY(30px) → 0，0.4s ease-out
- 按钮点击：波纹反馈动画
- 输入框聚焦：边框变金黄色，轻微放大
- 数字变化：滚动动画

## 4. 数据模型

### 4.1 促销活动（Promotion）
```typescript
interface Promotion {
  id: string;
  name: string;
  type: 'discount' | 'full_reduction' | 'gift';
  config: DiscountConfig | FullReductionConfig | GiftConfig;
  startTime: Date;
  endTime: Date;
  categories: string[];
  status: 'active' | 'paused' | 'ended';
  createdAt: Date;
}
```

### 4.2 A/B测试（ABTest）
```typescript
interface ABTest {
  id: string;
  name: string;
  groupA: TestGroup;
  groupB: TestGroup;
  status: 'running' | 'ended';
  startTime: Date;
  endTime?: Date;
  targeting: TargetingConfig;
}
```

### 4.3 实时统计（RealtimeStats）
```typescript
interface RealtimeStats {
  groupA: GroupStats;
  groupB: GroupStats;
  timestamp: Date;
}
```

## 5. 接口设计

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/promotions | GET | 获取活动列表 |
| /api/promotions | POST | 创建活动 |
| /api/promotions/:id | PUT | 更新活动 |
| /api/promotions/:id | DELETE | 删除活动 |
| /api/promotions/:id/toggle | POST | 切换活动状态 |
| /api/abtests | GET | 获取测试列表 |
| /api/abtests | POST | 创建测试 |
| /api/abtests/:id/stats | GET | 获取实时统计 |
| /api/abtests/:id/history | GET | 获取历史数据 |
| /api/abtests/:id/export | GET | 导出CSV |
| /api/groups | GET | 获取用户分组 |
