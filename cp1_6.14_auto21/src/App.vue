<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import EditorPanel from './components/EditorPanel.vue'
import ResumePreview from './components/ResumePreview.vue'
import { themes, applyTheme } from './utils/theme'
import type { ThemeConfig } from './utils/theme'
import { Menu } from 'lucide-vue-next'

interface PersonalInfo {
  name: string
  title: string
  email: string
  phone: string
  location: string
  bio: string
}

interface WorkExperience {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  description: string
  expanded: boolean
}

interface Education {
  id: string
  school: string
  major: string
  startDate: string
  endDate: string
  description: string
}

interface Skill {
  name: string
  level: number
}

interface Photo {
  id: string
  original: string
  thumbnail: string
}

const personalInfo = ref<PersonalInfo>({
  name: '张明远',
  title: '高级前端工程师',
  email: 'zhangmy@example.com',
  phone: '138-0000-1234',
  location: '北京',
  bio: '8年前端开发经验，精通 Vue/React 生态，擅长复杂交互与数据可视化，曾主导多个大型企业级项目的架构设计与落地。',
})

const workExperience = ref<WorkExperience[]>([
  {
    id: '1',
    company: '星辰科技有限公司',
    position: '高级前端工程师',
    startDate: '2021-03',
    endDate: '',
    description: '主导公司核心数据可视化平台的架构升级，将旧 jQuery 系统迁移至 Vue 3 + TypeScript，性能提升 60%。设计并实现可复用的组件库，覆盖 40+ 业务组件，团队开发效率提升 35%。',
    expanded: true,
  },
  {
    id: '2',
    company: '云端创想科技',
    position: '前端工程师',
    startDate: '2018-06',
    endDate: '2021-02',
    description: '负责企业级 SaaS 产品的前端开发，使用 React + D3.js 构建数据分析仪表盘。优化首屏加载时间从 4.2s 降至 1.8s，用户留存率提升 22%。',
    expanded: false,
  },
])

const education = ref<Education[]>([
  {
    id: '1',
    school: '北京理工大学',
    major: '计算机科学与技术（本科）',
    startDate: '2014-09',
    endDate: '2018-06',
    description: '',
  },
])

const skills = ref<Skill[]>([
  { name: 'Vue', level: 92 },
  { name: 'React', level: 85 },
  { name: 'TypeScript', level: 88 },
  { name: 'D3.js', level: 78 },
  { name: 'Node.js', level: 72 },
])

const photos = ref<Photo[]>([])

const currentThemeId = ref('haze-blue')

const currentTheme = computed<ThemeConfig>(() =>
  themes.find((t) => t.id === currentThemeId.value) || themes[0]
)

watch(currentTheme, (theme) => {
  applyTheme(theme)
}, { immediate: true })

const panelWidth = ref(360)

const isDragging = ref(false)

function onDragStart(e: MouseEvent) {
  isDragging.value = true
  const startX = e.clientX
  const startWidth = panelWidth.value

  function onMove(ev: MouseEvent) {
    if (!isDragging.value) return
    const delta = ev.clientX - startX
    panelWidth.value = Math.max(280, Math.min(520, startWidth + delta))
  }

  function onUp() {
    isDragging.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function toggleWork(id: string) {
  const idx = workExperience.value.findIndex((w) => w.id === id)
  if (idx !== -1) {
    workExperience.value[idx].expanded = !workExperience.value[idx].expanded
  }
}

const mobileDrawerOpen = ref(false)

function toggleMobileDrawer() {
  mobileDrawerOpen.value = !mobileDrawerOpen.value
}
</script>

<template>
  <div class="app-layout">
    <div
      v-if="mobileDrawerOpen"
      class="mobile-overlay"
      @click="mobileDrawerOpen = false"
    ></div>

    <div class="mobile-header">
      <button class="mobile-menu-btn" @click="toggleMobileDrawer">
        <Menu :size="20" />
      </button>
      <span class="mobile-title">动态简历生成器</span>
    </div>

    <div class="editor-wrapper" :class="{ 'mobile-open': mobileDrawerOpen }">
      <EditorPanel
        :personal-info="personalInfo"
        :work-experience="workExperience"
        :education="education"
        :skills="skills"
        :photos="photos"
        :themes="themes"
        :current-theme-id="currentThemeId"
        :panel-width="panelWidth"
        @update:personal-info="personalInfo = $event"
        @update:work-experience="workExperience = $event"
        @update:education="education = $event"
        @update:skills="skills = $event"
        @update:photos="photos = $event"
        @update:current-theme-id="currentThemeId = $event"
      />
    </div>

    <div class="resize-handle" @mousedown="onDragStart"></div>

    <div class="preview-wrapper">
      <ResumePreview
        :personal-info="personalInfo"
        :work-experience="workExperience"
        :education="education"
        :skills="skills"
        :photos="photos"
        :theme="currentTheme"
        @toggle-work="toggleWork"
      />
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.mobile-header {
  display: none;
}

.editor-wrapper {
  flex-shrink: 0;
  height: 100%;
}

.resize-handle {
  width: 6px;
  cursor: col-resize;
  background: transparent;
  transition: background 0.2s;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.resize-handle:hover {
  background: var(--theme-primary);
  opacity: 0.3;
}

.resize-handle:active {
  background: var(--theme-primary);
  opacity: 0.5;
}

.preview-wrapper {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  background: #ebedf1;
}

.mobile-overlay {
  display: none;
}

@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }

  .mobile-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background: white;
    border-bottom: 1px solid #e1e5eb;
    flex-shrink: 0;
    z-index: 101;
  }

  .mobile-menu-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--theme-primary);
    padding: 4px;
  }

  .mobile-title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
  }

  .resize-handle {
    display: none;
  }

  .editor-wrapper {
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    z-index: 200;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .editor-wrapper.mobile-open {
    transform: translateX(0);
  }

  .mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 150;
  }

  .preview-wrapper {
    flex: 1;
    overflow-y: auto;
  }
}
</style>
