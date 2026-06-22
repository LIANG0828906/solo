<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import RadarChart from './RadarChart.vue'
import PhotoGallery from './PhotoGallery.vue'
import type { ThemeConfig } from '@/utils/theme'

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

const props = defineProps<{
  personalInfo: PersonalInfo
  workExperience: WorkExperience[]
  education: Education[]
  skills: Skill[]
  photos: Photo[]
  theme: ThemeConfig
}>()

const emit = defineEmits<{
  'toggle-work': [id: string]
}>()

const sortedWork = computed(() =>
  [...props.workExperience].sort((a, b) => {
    const da = new Date(a.startDate || '1970-01').getTime()
    const db = new Date(b.startDate || '1970-01').getTime()
    return db - da
  })
)

const transitioning = ref(false)
const fadeKey = ref(0)

watch(() => props.theme.id, () => {
  transitioning.value = true
  fadeKey.value++
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      transitioning.value = false
    })
  })
})
</script>

<template>
  <div
    class="resume-page"
    :style="{
      '--theme-primary': theme.primaryColor,
      '--theme-secondary': theme.secondaryColor,
      '--theme-accent': theme.accentColor,
      '--theme-bg': theme.bgColor,
      '--theme-text': theme.textColor,
      '--theme-heading-font': theme.headingFont,
      '--theme-body-font': theme.bodyFont,
      '--theme-tag-bg': theme.tagBg,
      '--theme-tag-text': theme.tagText,
      '--theme-timeline-color': theme.timelineColor,
      '--theme-card-shadow': theme.cardShadow,
      '--theme-card-hover-shadow': theme.cardHoverShadow,
    }"
  >
    <div class="a4-page" :class="{ 'page-fade': transitioning }">
      <header class="resume-header">
        <h1 class="resume-name">{{ personalInfo.name || '你的姓名' }}</h1>
        <p class="resume-title-text">{{ personalInfo.title || '职位头衔' }}</p>
        <div class="contact-row">
          <span v-if="personalInfo.email">{{ personalInfo.email }}</span>
          <span v-if="personalInfo.phone">{{ personalInfo.phone }}</span>
          <span v-if="personalInfo.location">{{ personalInfo.location }}</span>
        </div>
        <p v-if="personalInfo.bio" class="resume-bio">{{ personalInfo.bio }}</p>
      </header>

      <section class="resume-section">
        <h2 class="section-title">工作经历</h2>
        <div class="timeline">
          <div
            v-for="work in sortedWork"
            :key="work.id"
            class="timeline-item resume-block"
          >
            <div
              class="timeline-header"
              @click="emit('toggle-work', work.id)"
            >
              <div class="timeline-dot"></div>
              <div class="timeline-line"></div>
              <div class="timeline-info">
                <div class="timeline-top-row">
                  <span class="company-name">{{ work.company }}</span>
                  <span class="expand-icon" :class="{ rotated: work.expanded }">▼</span>
                </div>
                <div class="position-text">{{ work.position }}</div>
                <div class="date-range">{{ work.startDate }} — {{ work.endDate || '至今' }}</div>
              </div>
            </div>
            <Transition name="slide-up">
              <div v-if="work.expanded" class="timeline-content">
                <p>{{ work.description }}</p>
              </div>
            </Transition>
          </div>
        </div>
      </section>

      <section class="resume-section">
        <h2 class="section-title">教育背景</h2>
        <div
          v-for="edu in education"
          :key="edu.id"
          class="edu-item resume-block"
        >
          <div class="edu-school">{{ edu.school }}</div>
          <div class="edu-major">{{ edu.major }}</div>
          <div class="edu-date">{{ edu.startDate }} — {{ edu.endDate || '至今' }}</div>
          <p v-if="edu.description" class="edu-desc">{{ edu.description }}</p>
        </div>
      </section>

      <section v-if="skills.length >= 3" class="resume-section">
        <h2 class="section-title">专业技能</h2>
        <div class="radar-section resume-block">
          <RadarChart
            :skills="skills"
            :gradient-colors="theme.radarGradient"
          />
          <div class="skill-tags">
            <span
              v-for="skill in skills"
              :key="skill.name"
              class="skill-tag"
            >
              {{ skill.name }} {{ skill.level }}%
            </span>
          </div>
        </div>
      </section>

      <section v-if="photos.length > 0" class="resume-section">
        <h2 class="section-title">项目作品</h2>
        <div class="resume-block">
          <PhotoGallery :photos="photos" @upload="() => {}" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.resume-page {
  display: flex;
  justify-content: center;
  padding: 24px;
  min-height: 100%;
}

.a4-page {
  width: 210mm;
  min-height: 297mm;
  background: var(--theme-bg);
  color: var(--theme-text);
  font-family: var(--theme-body-font);
  padding: 40px 48px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
  transition: opacity 0.4s ease, box-shadow 0.4s ease;
}

.a4-page.page-fade {
  opacity: 0;
}

.resume-header {
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--theme-primary);
}

.resume-name {
  font-family: var(--theme-heading-font);
  font-size: 28px;
  font-weight: 700;
  color: var(--theme-primary);
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}

.resume-title-text {
  font-size: 15px;
  color: var(--theme-secondary);
  font-weight: 500;
  margin-bottom: 10px;
}

.contact-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: var(--theme-accent);
  opacity: 0.85;
}

.resume-bio {
  margin-top: 12px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--theme-text);
  opacity: 0.8;
}

.resume-section {
  margin-bottom: 24px;
}

.section-title {
  font-family: var(--theme-heading-font);
  font-size: 17px;
  font-weight: 600;
  color: var(--theme-primary);
  margin-bottom: 14px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--theme-tag-bg);
  letter-spacing: 0.3px;
}

.resume-block {
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 10px;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
}

.resume-block:hover {
  box-shadow: var(--theme-card-hover-shadow);
  transform: translateY(-1px);
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.timeline-item {
  position: relative;
  padding-left: 24px;
  margin-bottom: 6px;
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 8px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--theme-primary);
  border: 2px solid var(--theme-bg);
  box-shadow: 0 0 0 2px var(--theme-primary);
  z-index: 1;
}

.timeline-line {
  position: absolute;
  left: 4px;
  top: 20px;
  width: 2px;
  bottom: -6px;
  background: var(--theme-tag-bg);
}

.timeline-item:last-child .timeline-line {
  display: none;
}

.timeline-header {
  cursor: pointer;
  user-select: none;
}

.timeline-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.company-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--theme-text);
}

.expand-icon {
  font-size: 10px;
  color: var(--theme-primary);
  transition: transform 0.3s ease;
  opacity: 0.6;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.position-text {
  font-size: 13px;
  color: var(--theme-secondary);
  margin-top: 2px;
}

.date-range {
  font-size: 11px;
  color: var(--theme-accent);
  opacity: 0.7;
  margin-top: 2px;
}

.timeline-content {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--theme-tag-bg);
  font-size: 13px;
  line-height: 1.7;
  color: var(--theme-text);
  opacity: 0.85;
  overflow: hidden;
}

.edu-item {
  margin-bottom: 10px;
}

.edu-school {
  font-weight: 600;
  font-size: 14px;
  color: var(--theme-text);
}

.edu-major {
  font-size: 13px;
  color: var(--theme-secondary);
  margin-top: 2px;
}

.edu-date {
  font-size: 11px;
  color: var(--theme-accent);
  opacity: 0.7;
  margin-top: 2px;
}

.edu-desc {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.6;
  opacity: 0.85;
}

.radar-section {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.skill-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  background: var(--theme-tag-bg);
  color: var(--theme-tag-text);
  font-weight: 500;
}

.slide-up-enter-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
}

.slide-up-enter-to {
  max-height: 300px;
  opacity: 1;
}

.slide-up-leave-from {
  max-height: 300px;
  opacity: 1;
}

.slide-up-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
}

@media (max-width: 768px) {
  .resume-page {
    padding: 8px;
  }

  .a4-page {
    width: 100%;
    min-height: auto;
    padding: 24px 20px;
  }
}
</style>
