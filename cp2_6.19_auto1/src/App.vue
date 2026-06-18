<template>
  <div class="app-container">
    <div class="particles-bg" ref="particlesRef"></div>

    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="14" width="7" height="7" rx="1"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1"></rect>
          </svg>
          <span>Kanban</span>
        </div>
      </div>

      <nav class="project-nav">
        <h3 class="nav-title">项目列表</h3>
        <ul class="project-list">
          <li
            v-for="project in state.projects"
            :key="project.id"
            class="project-item"
            :class="{ active: project.id === state.selectedProjectId }"
            @click="selectProject(project.id)"
          >
            <span class="project-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </span>
            <span class="project-name">{{ project.name }}</span>
          </li>
        </ul>
      </nav>

      <div class="sidebar-stats">
        <h3 class="nav-title">统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{{ state.tasks.length }}</span>
            <span class="stat-label">总任务</span>
          </div>
          <div class="stat-item">
            <span class="stat-value todo">{{ tasksByStatus.todo.length }}</span>
            <span class="stat-label">待办</span>
          </div>
          <div class="stat-item">
            <span class="stat-value progress">{{ tasksByStatus.inProgress.length }}</span>
            <span class="stat-label">进行中</span>
          </div>
          <div class="stat-item">
            <span class="stat-value done">{{ tasksByStatus.done.length }}</span>
            <span class="stat-label">已完成</span>
          </div>
        </div>
      </div>

      <div class="sidebar-footer">
        <button class="btn-add-project">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          新建项目
        </button>
      </div>
    </aside>

    <main class="main-content">
      <header class="top-header">
        <div class="header-left">
          <h1 class="page-title">
            {{ currentProject?.name || '团队协作看板' }}
          </h1>
          <span class="page-subtitle">实时追踪团队任务进度</span>
        </div>

        <div class="header-right">
          <div class="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索任务..."
              class="search-input"
            />
          </div>

          <div class="filter-group">
            <span class="filter-label">优先级:</span>
            <div class="filter-buttons">
              <button
                v-for="option in priorityOptions"
                :key="option.value"
                class="filter-btn"
                :class="{ active: state.filterPriority === option.value }"
                @click="setFilterPriority(option.value as any)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="board-container">
        <div class="board-grid">
          <BoardColumn
            title="待办"
            status="todo"
            :tasks="tasksByStatus.todo"
          />
          <BoardColumn
            title="进行中"
            status="inProgress"
            :tasks="tasksByStatus.inProgress"
          />
          <BoardColumn
            title="已完成"
            status="done"
            :tasks="tasksByStatus.done"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import BoardColumn from './components/BoardColumn.vue'
import { useBoardStore } from './stores/boardStore'
import type { Priority } from './stores/boardStore'

const { state, tasksByStatus, setFilterKeyword, setFilterPriority, selectProject } = useBoardStore()

const particlesRef = ref<HTMLElement | null>(null)
const searchKeyword = ref('')
let animationFrame: number | null = null

const priorityOptions = [
  { value: 'all', label: '全部' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

const currentProject = computed(() => {
  return state.projects.find(p => p.id === state.selectedProjectId)
})

watch(searchKeyword, (val) => {
  setFilterKeyword(val)
})

class Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  hue: number

  constructor(width: number, height: number) {
    this.x = Math.random() * width
    this.y = Math.random() * height
    this.size = Math.random() * 3 + 1
    this.speedX = (Math.random() - 0.5) * 0.5
    this.speedY = (Math.random() - 0.5) * 0.5
    this.opacity = Math.random() * 0.5 + 0.1
    this.hue = 260 + Math.random() * 40
  }

  update(width: number, height: number) {
    this.x += this.speedX
    this.y += this.speedY

    if (this.x < 0 || this.x > width) this.speedX *= -1
    if (this.y < 0 || this.y > height) this.speedY *= -1
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${this.hue}, 70%, 70%, ${this.opacity})`
    ctx.fill()

    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size * 3
    )
    gradient.addColorStop(0, `hsla(${this.hue}, 70%, 70%, ${this.opacity * 0.5})`)
    gradient.addColorStop(1, `hsla(${this.hue}, 70%, 70%, 0)`)
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
  }
}

const initParticles = () => {
  if (!particlesRef.value) return

  const container = particlesRef.value
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const resizeCanvas = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  resizeCanvas()
  container.appendChild(canvas)

  const particles: Particle[] = []
  const particleCount = Math.min(60, Math.floor((canvas.width * canvas.height) / 20000))

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle(canvas.width, canvas.height))
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particles.forEach(particle => {
      particle.update(canvas.width, canvas.height)
      particle.draw(ctx)
    })

    particles.forEach((p1, i) => {
      particles.slice(i + 1).forEach(p2 => {
        const dx = p1.x - p2.x
        const dy = p1.y - p2.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < 120) {
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.strokeStyle = `hsla(267, 70%, 70%, ${0.15 * (1 - distance / 120)})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      })
    })

    animationFrame = requestAnimationFrame(animate)
  }

  animate()

  const handleResize = () => {
    resizeCanvas()
  }

  window.addEventListener('resize', handleResize)

  return () => {
    window.removeEventListener('resize', handleResize)
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
    canvas.remove()
  }
}

let cleanupParticles: (() => void) | null = null

onMounted(() => {
  cleanupParticles = initParticles()
})

onUnmounted(() => {
  if (cleanupParticles) {
    cleanupParticles()
  }
})
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
}

.particles-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  background: linear-gradient(135deg, #1e1e2e 0%, #1a1a2e 50%, #1e1e3e 100%);
}

.particles-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(ellipse at 20% 20%, rgba(203, 166, 247, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(180, 190, 254, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(203, 166, 247, 0.05) 0%, transparent 70%);
  pointer-events: none;
}

.sidebar {
  width: 280px;
  background: rgba(24, 24, 37, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(203, 166, 247, 0.15);
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(203, 166, 247, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #cba6f7;
  font-size: 20px;
  font-weight: 700;
}

.logo svg {
  filter: drop-shadow(0 0 8px rgba(203, 166, 247, 0.5));
}

.project-nav {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.nav-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #6c7086;
  margin-bottom: 12px;
}

.project-list {
  list-style: none;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 4px;
  color: #9399b2;
}

.project-item:hover {
  background: rgba(203, 166, 247, 0.1);
  color: #cdd6f4;
}

.project-item.active {
  background: linear-gradient(135deg, rgba(203, 166, 247, 0.2), rgba(180, 190, 254, 0.15));
  color: #cba6f7;
  box-shadow: inset 0 0 0 1px rgba(203, 166, 247, 0.3);
}

.project-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-name {
  font-size: 14px;
  font-weight: 500;
  flex: 1;
}

.sidebar-stats {
  padding: 20px;
  border-top: 1px solid rgba(203, 166, 247, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: rgba(203, 166, 247, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(203, 166, 247, 0.1);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #cdd6f4;
}

.stat-value.todo { color: #9399b2; }
.stat-value.progress { color: #cba6f7; }
.stat-value.done { color: #a6e3a1; }

.stat-label {
  font-size: 11px;
  color: #6c7086;
  margin-top: 2px;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(203, 166, 247, 0.1);
}

.btn-add-project {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(203, 166, 247, 0.2), rgba(180, 190, 254, 0.15));
  border: 1px solid rgba(203, 166, 247, 0.3);
  border-radius: 10px;
  color: #cba6f7;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn-add-project:hover {
  background: linear-gradient(135deg, rgba(203, 166, 247, 0.3), rgba(180, 190, 254, 0.25));
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(203, 166, 247, 0.25);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  z-index: 5;
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 32px;
  background: rgba(30, 30, 46, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(203, 166, 247, 0.1);
  flex-shrink: 0;
  gap: 24px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #cdd6f4;
  margin: 0;
}

.page-subtitle {
  font-size: 13px;
  color: #6c7086;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(49, 50, 68, 0.7);
  border: 1px solid rgba(203, 166, 247, 0.2);
  border-radius: 12px;
  padding: 10px 16px;
  transition: all 0.2s ease;
  min-width: 240px;
}

.search-box:focus-within {
  border-color: #cba6f7;
  box-shadow: 0 0 0 3px rgba(203, 166, 247, 0.15);
}

.search-box svg {
  color: #6c7086;
  flex-shrink: 0;
}

.search-input {
  background: transparent;
  border: none;
  outline: none;
  color: #cdd6f4;
  font-size: 14px;
  flex: 1;
  font-family: inherit;
}

.search-input::placeholder {
  color: #6c7086;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-size: 13px;
  color: #9399b2;
  font-weight: 500;
}

.filter-buttons {
  display: flex;
  gap: 4px;
  background: rgba(49, 50, 68, 0.7);
  border-radius: 10px;
  padding: 4px;
  border: 1px solid rgba(203, 166, 247, 0.2);
}

.filter-btn {
  padding: 6px 14px;
  border: none;
  background: transparent;
  color: #9399b2;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.filter-btn:hover {
  color: #cdd6f4;
  background: rgba(203, 166, 247, 0.1);
}

.filter-btn.active {
  background: linear-gradient(135deg, #cba6f7, #b4befe);
  color: #1e1e2e;
  box-shadow: 0 2px 8px rgba(203, 166, 247, 0.4);
}

.board-container {
  flex: 1;
  overflow: auto;
  padding: 24px 32px 32px;
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  height: 100%;
  min-width: 720px;
}

@media (max-width: 1200px) {
  .sidebar {
    width: 240px;
  }

  .top-header {
    padding: 20px 24px;
  }

  .board-container {
    padding: 20px 24px 24px;
  }
}

@media (max-width: 900px) {
  .app-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    max-height: 200px;
    flex-direction: row;
    border-right: none;
    border-bottom: 1px solid rgba(203, 166, 247, 0.15);
    overflow-x: auto;
    overflow-y: hidden;
  }

  .sidebar-header,
  .sidebar-footer {
    display: none;
  }

  .project-nav,
  .sidebar-stats {
    padding: 16px;
    border: none;
    flex-shrink: 0;
  }

  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .stat-item {
    padding: 8px 12px;
  }

  .stat-value {
    font-size: 18px;
  }

  .board-grid {
    grid-template-columns: 1fr;
    min-width: 0;
    height: auto;
  }

  .top-header {
    padding: 16px 20px;
  }

  .board-container {
    padding: 16px 20px 20px;
  }
}

@media (max-width: 600px) {
  .header-right {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    min-width: 0;
  }

  .filter-group {
    justify-content: space-between;
  }

  .page-title {
    font-size: 20px;
  }
}
</style>
