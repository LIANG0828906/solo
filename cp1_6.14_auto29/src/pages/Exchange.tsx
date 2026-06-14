// 积分兑换页面
// 数据流向：store(products, user) → Exchange 页面 → 商品列表虚拟滚动 + 兑换表单
// 兑换流程：选择商品 → 输入数量 → 实时校验积分 → 提交兑换 → API POST /api/exchange → store 更新 → 页面刷新
// 依赖：@/store/useStore, @/components/ProductCard, @/components/RippleButton, react-virtuoso, react-router-dom
import { useState, useEffect, useRef, useMemo } from 'react'
import { VirtuosoGrid } from 'react-virtuoso'
import { Minus, Plus, ShoppingCart