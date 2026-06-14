import { computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import type { ThemeType } from '@/utils/themes'
import { generateCustomerName, generateCustomerAppearance, generateId } from '@/utils/random'
import { findPath, type GridNode } from '@/utils/astar'

export type FurnitureType = 'floor' | 'wall' | 'table' | 'bar' | 'decoration'

export interface Furniture {
  id: string
  type: FurnitureType
  name: string
  gridX: number
  gridY: number
  gridW: number
  gridH: number
  rotation: number
  theme: ThemeType
}

export interface Ingredient {
  id: string
  name: string
  emoji: string
  stock: number
}

export interface Dish {
  id: string
  name: string
  ingredients: string[]
  cookTime: number
  price: number
}

export type CustomerStatus = 'waiting' | 'ordering' | 'eating' | 'angry' | 'left' | 'satisfied'

export interface Customer {
  id: string
  name: string
  appearance: { color: string; hat: string }
  tableId: string | null
  waitTime: number
  maxWaitTime: number
  satisfaction: number
  orderedDishId: string | null
  status: CustomerStatus
  gridX: number
  gridY: number
  targetX: number
  targetY: number
  leaving: boolean
}

export interface Waiter {
  id: string
  name: string
  position: { x: number; y: number }
  targetPosition: { x: number; y: number }
  path: { x: number; y: number }[]
  pathIndex: number
  carryingOrderId: string | null
  state: 'idle' | 'toKitchen' | 'toTable' | 'returning'
}

export type OrderStatus = 'queued' | 'cooking' | 'ready' | 'served'

export interface KitchenOrder {
  id: string
  dishId: string
  tableId: string
  customerId: string
  progress: number
  status: OrderStatus
}

export interface FloatText {
  id: string
  text: string
  color: string
  x: number
  y: number
  life: number
}

export interface TableInfo {
  id: string
  gridX: number
  gridY: number
  occupied: boolean
  customerId: string | null
}

export const GRID_SIZE = 16
export const CELL_SIZE = 1

export const useGameState = defineStore('gameState', () => {
  const gold = reactive({ value: 1000, display: 1000 })
  const satisfaction = reactive({ value: 85, display: 85 })
  const currentTheme = ref<ThemeType>('gothic')
  const cameraAngle = ref(0)

  const ingredients = ref<Ingredient[]>([
    { id: 'ing_beef', name: '暗影牛肉', emoji: '🥩', stock: 50 },
    { id: 'ing_mushroom', name: '魔法蘑菇', emoji: '🍄', stock: 40 },
    { id: 'ing_chili', name: '龙息辣椒', emoji: '🌶️', stock: 35 },
    { id: 'ing_potion', name: '神秘药水', emoji: '🧪', stock: 30 },
    { id: 'ing_bread', name: '矮人面包', emoji: '🍞', stock: 60 },
    { id: 'ing_cheese', name: '精灵奶酪', emoji: '🧀', stock: 45 },
  ])

  const dishes = ref<Dish[]>([
    { id: 'dish_1', name: '暗影牛排', ingredients: ['ing_beef', 'ing_mushroom'], cookTime: 8000, price: 85 },
    { id: 'dish_2', name: '辣魔蘑菇汤', ingredients: ['ing_mushroom', 'ing_chili'], cookTime: 5000, price: 45 },
    { id: 'dish_3', name: '龙息烤肉', ingredients: ['ing_beef', 'ing_chili'], cookTime: 10000, price: 120 },
  ])

  const furniture = ref<Furniture[]>([])

  const customers = ref<Customer[]>([])
  const waiters = ref<Waiter[]>([
    {
      id: 'waiter_1',
      name: '莉莉丝',
      position: { x: 8, y: 2 },
      targetPosition: { x: 8, y: 2 },
      path: [],
      pathIndex: 0,
      carryingOrderId: null,
      state: 'idle',
    },
  ])
  const kitchenOrders = ref<KitchenOrder[]>([])
  const floatTexts = ref<FloatText[]>([])

  const tables = computed<TableInfo[]>(() => {
    const tableFurns = furniture.value.filter(f => f.type === 'table')
    return tableFurns.map(f => {
      const customer = customers.value.find(c => c.tableId === f.id && c.status !== 'left' && c.status !== 'satisfied')
      return {
        id: f.id,
        gridX: f.gridX,
        gridY: f.gridY,
        occupied: !!customer,
        customerId: customer?.id ?? null,
      }
    })
  })

  const availableTables = computed(() => tables.value.filter(t => !t.occupied))

  const grid = computed<GridNode[][]>(() => {
    const g: GridNode[][] = []
    for (let y = 0; y < GRID_SIZE; y++) {
      g[y] = []
      for (let x = 0; x < GRID_SIZE; x++) {
        g[y][x] = { x, y, walkable: true }
      }
    }
    for (const f of furniture.value) {
      if (f.type === 'table' || f.type === 'bar' || f.type === 'decoration' || f.type === 'wall') {
        for (let dy = 0; dy < f.gridH; dy++) {
          for (let dx = 0; dx < f.gridW; dx++) {
            const gx = f.gridX + dx
            const gy = f.gridY + dy
            if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
              g[gy][gx].walkable = false
            }
          }
        }
      }
    }
    return g
  })

  function animateNumber(target: typeof gold) {
    const start = target.display
    const end = target.value
    const duration = 500
    const startTime = performance.now()
    function tick(now: number) {
      const t = Math.min(1, (now - startTime) / duration)
      const ease = 1 - Math.pow(1 - t, 3)
      target.display = Math.round(start + (end - start) * ease)
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  function addGold(amount: number) {
    gold.value += amount
    animateNumber(gold)
  }

  function addFurniture(item: Omit<Furniture, 'id'>) {
    furniture.value.push({ ...item, id: generateId() })
  }

  function removeFurniture(id: string) {
    const idx = furniture.value.findIndex(f => f.id === id)
    if (idx >= 0) furniture.value.splice(idx, 1)
  }

  function addDish(dish: Omit<Dish, 'id'>) {
    dishes.value.push({ ...dish, id: generateId() })
  }

  function updateDish(id: string, updates: Partial<Dish>) {
    const dish = dishes.value.find(d => d.id === id)
    if (dish) Object.assign(dish, updates)
  }

  function removeDish(id: string) {
    const idx = dishes.value.findIndex(d => d.id === id)
    if (idx >= 0) dishes.value.splice(idx, 1)
  }

  function spawnCustomer() {
    if (availableTables.value.length === 0) return
    if (customers.value.filter(c => c.status !== 'left' && c.status !== 'satisfied').length >= 6) return

    const table = availableTables.value[Math.floor(Math.random() * availableTables.value.length)]
    const entryX = Math.floor(GRID_SIZE / 2)
    const entryY = GRID_SIZE - 1
    const customer: Customer = {
      id: generateId(),
      name: generateCustomerName(),
      appearance: generateCustomerAppearance(),
      tableId: table.id,
      waitTime: 0,
      maxWaitTime: 60,
      satisfaction: 100,
      orderedDishId: null,
      status: 'waiting',
      gridX: entryX,
      gridY: entryY,
      targetX: table.gridX,
      targetY: table.gridY,
      leaving: false,
    }
    customers.value.push(customer)
  }

  function addFloatText(text: string, color: string, x: number, y: number) {
    floatTexts.value.push({ id: generateId(), text, color, x, y, life: 3 })
  }

  function placeOrder(customerId: string) {
    const customer = customers.value.find(c => c.id === customerId)
    if (!customer || !customer.tableId) return
    if (dishes.value.length === 0) return

    const dish = dishes.value[Math.floor(Math.random() * dishes.value.length)]
    customer.orderedDishId = dish.id
    customer.status = 'ordering'

    const order: KitchenOrder = {
      id: generateId(),
      dishId: dish.id,
      tableId: customer.tableId,
      customerId,
      progress: 0,
      status: 'queued',
    }
    kitchenOrders.value.push(order)
  }

  function customerLeaveAngry(customerId: string) {
    const customer = customers.value.find(c => c.id === customerId)
    if (!customer) return
    customer.status = 'angry'
    satisfaction.value = Math.max(0, satisfaction.value - 5)
    animateNumber(satisfaction as any)
    const table = tables.value.find(t => t.id === customer.tableId)
    addFloatText('-5 😠 太差了！', '#ef4444', (table?.gridX ?? customer.gridX) + 0.5, (table?.gridY ?? customer.gridY) + 1.5)
    customer.leaving = true
    customer.targetX = Math.floor(GRID_SIZE / 2)
    customer.targetY = GRID_SIZE - 1
  }

  function customerLeaveSatisfied(customerId: string) {
    const customer = customers.value.find(c => c.id === customerId)
    if (!customer) return
    customer.status = 'satisfied'
    satisfaction.value = Math.min(100, satisfaction.value + 3)
    animateNumber(satisfaction as any)
    const dish = dishes.value.find(d => d.id === customer.orderedDishId)
    if (dish) {
      addGold(dish.price)
      const table = tables.value.find(t => t.id === customer.tableId)
      addFloatText(`+${dish.price} 💰`, '#D4AF37', (table?.gridX ?? customer.gridX) + 0.5, (table?.gridY ?? customer.gridY) + 1.5)
    }
    customer.leaving = true
    customer.targetX = Math.floor(GRID_SIZE / 2)
    customer.targetY = GRID_SIZE - 1
  }

  function assignWaiterToOrder(orderId: string) {
    const order = kitchenOrders.value.find(o => o.id === orderId)
    if (!order) return
    const idleWaiter = waiters.value.find(w => w.state === 'idle')
    if (!idleWaiter) return

    idleWaiter.carryingOrderId = orderId
    idleWaiter.state = 'toKitchen'
    const kitchenX = 1
    const kitchenY = 1
    const path = findPath(
      { x: Math.round(idleWaiter.position.x), y: Math.round(idleWaiter.position.y) },
      { x: kitchenX, y: kitchenY },
      grid.value,
    )
    idleWaiter.path = path
    idleWaiter.pathIndex = 0
  }

  function waiterDeliverToTable(waiter: Waiter, order: KitchenOrder) {
    waiter.state = 'toTable'
    const table = tables.value.find(t => t.id === order.tableId)
    if (!table) return
    const path = findPath(
      { x: Math.round(waiter.position.x), y: Math.round(waiter.position.y) },
      { x: table.gridX, y: table.gridY + 1 },
      grid.value,
    )
    waiter.path = path
    waiter.pathIndex = 0
  }

  function waiterReturnToStation(waiter: Waiter) {
    waiter.state = 'returning'
    waiter.carryingOrderId = null
    const path = findPath(
      { x: Math.round(waiter.position.x), y: Math.round(waiter.position.y) },
      { x: 8, y: 2 },
      grid.value,
    )
    waiter.path = path
    waiter.pathIndex = 0
  }

  function setTheme(theme: ThemeType) {
    currentTheme.value = theme
  }

  function rotateCamera() {
    cameraAngle.value = (cameraAngle.value + 45) % 360
  }

  return {
    gold,
    satisfaction,
    currentTheme,
    cameraAngle,
    ingredients,
    dishes,
    furniture,
    customers,
    waiters,
    kitchenOrders,
    floatTexts,
    tables,
    availableTables,
    grid,
    addGold,
    addFurniture,
    removeFurniture,
    addDish,
    updateDish,
    removeDish,
    spawnCustomer,
    addFloatText,
    placeOrder,
    customerLeaveAngry,
    customerLeaveSatisfied,
    assignWaiterToOrder,
    waiterDeliverToTable,
    waiterReturnToStation,
    setTheme,
    rotateCamera,
  }
})
