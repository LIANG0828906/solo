import { computed, reactive, ref } from 'vue'
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

export type CustomerStatus = 'entering' | 'seating' | 'waiting' | 'ordering' | 'eating' | 'angry' | 'leaving' | 'satisfied' | 'left'

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
  path: { x: number; y: number }[]
  pathIndex: number
  seatProgress: number
  eatProgress: number
  lastFaceChange: number
}

export type WaiterState = 'idle' | 'toKitchen' | 'picking' | 'toTable' | 'delivering' | 'returning'

export interface Waiter {
  id: string
  name: string
  position: { x: number; y: number }
  targetPosition: { x: number; y: number }
  path: { x: number; y: number }[]
  pathIndex: number
  carryingOrderId: string | null
  state: WaiterState
  trailHistory: { x: number; y: number; alpha: number }[]
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
  maxLife: number
  vy: number
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
export const KITCHEN_POS = { x: 1, y: 1 }
export const WAITER_STATION = { x: 8, y: 2 }

export const useGameState = defineStore('gameState', () => {
  const gold = reactive({ value: 1000, display: 1000 })
  const satisfaction = reactive({ value: 85, display: 85 })
  const currentTheme = ref<ThemeType>('gothic')
  const targetTheme = ref<ThemeType>('gothic')
  const themeTransitionProgress = ref(1)
  const cameraAngle = ref(0)
  const targetCameraAngle = ref(0)
  const cameraTransitionProgress = ref(1)

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
      position: { x: WAITER_STATION.x, y: WAITER_STATION.y },
      targetPosition: { x: WAITER_STATION.x, y: WAITER_STATION.y },
      path: [],
      pathIndex: 0,
      carryingOrderId: null,
      state: 'idle',
      trailHistory: [],
    },
  ])
  const kitchenOrders = ref<KitchenOrder[]>([])
  const floatTexts = ref<FloatText[]>([])

  let lastSpawnTime = 0
  const SPAWN_INTERVAL = 8000

  const tables = computed<TableInfo[]>(() => {
    const tableFurns = furniture.value.filter(f => f.type === 'table')
    return tableFurns.map(f => {
      const customer = customers.value.find(
        c => c.tableId === f.id && c.status !== 'left' && c.status !== 'satisfied' && c.status !== 'leaving',
      )
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
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (x === 0 || x === GRID_SIZE - 1 || y === 0) {
          if (y === 0 && x >= KITCHEN_POS.x - 1 && x <= KITCHEN_POS.x + 3) continue
          g[y][x].walkable = false
        }
      }
    }
    return g
  })

  function animateNumber(target: { value: number; display: number }) {
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

  function updateSatisfaction(delta: number) {
    satisfaction.value = Math.max(0, Math.min(100, satisfaction.value + delta))
    animateNumber(satisfaction as any)
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
    if (customers.value.filter(c => c.status !== 'left' && c.status !== 'satisfied').length >= 8) return

    const table = availableTables.value[Math.floor(Math.random() * availableTables.value.length)]
    const entryX = Math.floor(GRID_SIZE / 2)
    const entryY = GRID_SIZE - 1

    const path = findPath({ x: entryX, y: entryY }, { x: table.gridX, y: table.gridY + 1 }, grid.value)

    const customer: Customer = {
      id: generateId(),
      name: generateCustomerName(),
      appearance: generateCustomerAppearance(),
      tableId: table.id,
      waitTime: 0,
      maxWaitTime: 50,
      satisfaction: 100,
      orderedDishId: null,
      status: 'entering',
      gridX: entryX,
      gridY: entryY,
      targetX: table.gridX,
      targetY: table.gridY,
      path,
      pathIndex: 0,
      seatProgress: 0,
      eatProgress: 0,
      lastFaceChange: 0,
    }
    customers.value.push(customer)
  }

  function addFloatText(text: string, color: string, x: number, y: number) {
    floatTexts.value.push({
      id: generateId(),
      text,
      color,
      x,
      y,
      life: 3,
      maxLife: 3,
      vy: 0.3,
    })
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

  function customerLeaveAngry(customer: Customer) {
    customer.status = 'angry'
    updateSatisfaction(-5)
    const table = tables.value.find(t => t.id === customer.tableId)
    const tx = table ? table.gridX + 1 : customer.gridX
    const ty = table ? table.gridY : customer.gridY
    addFloatText('😠 太差了！服务太慢！', '#ef4444', tx, ty + 1.5)

    customer.leaving = true as any
    customer.status = 'leaving'
    const entryX = Math.floor(GRID_SIZE / 2)
    const entryY = GRID_SIZE - 1
    const leavePath = findPath(
      { x: Math.round(customer.gridX), y: Math.round(customer.gridY) },
      { x: entryX, y: entryY },
      grid.value,
    )
    customer.path = leavePath
    customer.pathIndex = 0
    customer.targetX = entryX
    customer.targetY = entryY
  }

  function customerLeaveSatisfied(customer: Customer) {
    customer.status = 'satisfied'
    updateSatisfaction(3)
    const dish = dishes.value.find(d => d.id === customer.orderedDishId)
    const table = tables.value.find(t => t.id === customer.tableId)
    const tx = table ? table.gridX + 1 : customer.gridX
    const ty = table ? table.gridY : customer.gridY
    if (dish) {
      addGold(dish.price)
      addFloatText(`+${dish.price} 💰 美味！`, '#D4AF37', tx, ty + 1.5)
    } else {
      addFloatText('😊 不错！', '#22c55e', tx, ty + 1.5)
    }
    customer.status = 'leaving'
    const entryX = Math.floor(GRID_SIZE / 2)
    const entryY = GRID_SIZE - 1
    const leavePath = findPath(
      { x: Math.round(customer.gridX), y: Math.round(customer.gridY) },
      { x: entryX, y: entryY },
      grid.value,
    )
    customer.path = leavePath
    customer.pathIndex = 0
    customer.targetX = entryX
    customer.targetY = entryY
  }

  function assignWaiterToOrder(orderId: string) {
    const order = kitchenOrders.value.find(o => o.id === orderId)
    if (!order) return
    const idleWaiter = waiters.value.find(w => w.state === 'idle')
    if (!idleWaiter) return

    idleWaiter.carryingOrderId = orderId
    idleWaiter.state = 'toKitchen'
    const path = findPath(
      { x: Math.round(idleWaiter.position.x), y: Math.round(idleWaiter.position.y) },
      { x: KITCHEN_POS.x + 1, y: KITCHEN_POS.y + 1 },
      grid.value,
    )
    idleWaiter.path = path
    idleWaiter.pathIndex = 0
  }

  function waiterDeliverToTable(waiter: Waiter, order: KitchenOrder) {
    waiter.state = 'toTable'
    const table = tables.value.find(t => t.id === order.tableId)
    if (!table) {
      waiterReturnToStation(waiter)
      return
    }
    const path = findPath(
      { x: Math.round(waiter.position.x), y: Math.round(waiter.position.y) },
      { x: table.gridX, y: table.gridY + 2 },
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
      { x: WAITER_STATION.x, y: WAITER_STATION.y },
      grid.value,
    )
    waiter.path = path
    waiter.pathIndex = 0
  }

  function setTheme(theme: ThemeType) {
    if (theme === currentTheme.value) return
    targetTheme.value = theme
    themeTransitionProgress.value = 0
  }

  function rotateCamera() {
    targetCameraAngle.value = (targetCameraAngle.value + 45) % 360
    cameraTransitionProgress.value = 0
  }

  function moveAlongPath(
    pos: { x: number; y: number },
    path: { x: number; y: number }[],
    pathIndex: { value: number },
    speed: number,
    dt: number,
  ): boolean {
    if (pathIndex.value >= path.length) return true

    const target = path[pathIndex.value]
    const dx = target.x - pos.x
    const dy = target.y - pos.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < 0.05) {
      pos.x = target.x
      pos.y = target.y
      pathIndex.value++
      return pathIndex.value >= path.length
    }

    const step = speed * dt
    pos.x += (dx / dist) * Math.min(step, dist)
    pos.y += (dy / dist) * Math.min(step, dist)
    return false
  }

  function updateGame(now: number, dt: number) {
    if (themeTransitionProgress.value < 1) {
      themeTransitionProgress.value = Math.min(1, themeTransitionProgress.value + dt * 1.5)
      if (themeTransitionProgress.value >= 1) {
        currentTheme.value = targetTheme.value
      }
    }

    if (cameraTransitionProgress.value < 1) {
      cameraTransitionProgress.value = Math.min(1, cameraTransitionProgress.value + dt * 2)
      if (cameraTransitionProgress.value >= 1) {
        cameraAngle.value = targetCameraAngle.value
      }
    }

    if (now - lastSpawnTime > SPAWN_INTERVAL) {
      spawnCustomer()
      lastSpawnTime = now
    }

    for (let i = customers.value.length - 1; i >= 0; i--) {
      const c = customers.value[i]

      if (c.status === 'entering' || c.status === 'seating' || c.status === 'leaving') {
        const reached = moveAlongPath(
          { x: c.gridX, y: c.gridY },
          c.path,
          { value: c.pathIndex } as any,
          2.5,
          dt,
        )
        const pathIdxRef = { value: c.pathIndex }
        moveAlongPath({ x: c.gridX, y: c.gridY }, c.path, pathIdxRef, 2.5, dt)
        c.pathIndex = pathIdxRef.value

        if (c.status === 'leaving' && (c.pathIndex >= c.path.length || (Math.abs(c.gridX - c.targetX) < 0.5 && Math.abs(c.gridY - c.targetY) < 0.5))) {
          c.status = 'left'
          customers.value.splice(i, 1)
          continue
        }

        if (c.status