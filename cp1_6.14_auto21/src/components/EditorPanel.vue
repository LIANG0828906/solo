<script setup lang="ts">
import { ref } from 'vue'
import { User, Briefcase, GraduationCap, Sparkles, ChevronDown, Plus, Trash2 } from 'lucide-vue-next'
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
  themes: ThemeConfig[]
  currentThemeId: string
  panelWidth: number
}>()

const emit = defineEmits<{
  'update:personalInfo': [value: PersonalInfo]
  'update:workExperience': [value: WorkExperience[]]
  'update:education': [value: Education[]]
  'update:skills': [value: Skill[]]
  'update:photos': [value: Photo[]]
  'update:currentThemeId': [value: string]
}>()

const expandedSections = ref<Record<string, boolean>>({
  personal: true,
  work: true,
  education: false,
  skills: false,
})

function toggleSection(key: string) {
  expandedSections.value[key] = !expandedSections.value[key]
}

function updatePersonal(field: keyof PersonalInfo, value: string) {
  emit('update:personalInfo', { ...props.personalInfo, [field]: value })
}

function addWork() {
  const newItem: WorkExperience = {
    id: Date.now().toString(),
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    description: '',
    expanded: true,
  }
  emit('update:workExperience', [...props.workExperience, newItem])
}

function updateWork(index: number, field: keyof WorkExperience, value: string | boolean) {
  const updated = [...props.workExperience]
  updated[index] = { ...updated[index], [field]: value }
  emit('update:workExperience', updated)
}

function removeWork(index: number) {
  const updated = props.workExperience.filter((_, i) => i !== index)
  emit('update:workExperience', updated)
}

function addEducation() {
  const newItem: Education = {
    id: Date.now().toString(),
    school: '',
    major: '',
    startDate: '',
    endDate: '',
    description: '',
  }
  emit('update:education', [...props.education, newItem])
}

function updateEdu(index: number, field: keyof Education, value: string) {
  const updated = [...props.education]
  updated[index] = { ...updated[index], [field]: value }
  emit('update:education', updated)
}

function removeEdu(index: number) {
  const updated = props.education.filter((_, i) => i !== index)
  emit('update:education', updated)
}

function addSkill() {
  emit('update:skills', [...props.skills, { name: '', level: 50 }])
}

function updateSkill(index: number, field: keyof Skill, value: string | number) {
  const updated = [...props.skills]
  updated[index] = { ...updated[index], [field]: value }
  emit('update:skills', updated)
}

function removeSkill(index: number) {
  const updated = props.skills.filter((_, i) => i !== index)
  emit('update:skills', updated)
}

async function handlePhotoUpload(files: FileList) {
  const newPhotos: Photo[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file.type.startsWith('image/')) continue
    const { original, thumbnail } = await cropImage(file)
    newPhotos.push({ id: Date.now().toString() + '-' + i, original, thumbnail })
  }
  emit('update:photos', [...props.photos, ...newPhotos])
}

function cropImage(file: File): Promise<{ original: string; thumbnail: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const original = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const targetRatio = 16 / 9
        const srcRatio = img.width / img.height
        let sx = 0, sy = 0, sw = img.width, sh = img.height
        if (srcRatio > targetRatio) {
          sw = img.height * targetRatio
          sx = (img.width - sw) / 2
        } else {
          sh = img.width / targetRatio
          sy = (img.height - sh) / 2
        }
        const maxW = 640
        const thumbW = Math.min(sw, maxW)
        const thumbH = thumbW / targetRatio
        canvas.width = thumbW
        canvas.height = thumbH
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, thumbW, thumbH)
        const tryCompress = (quality: number): Promise<string> => {
          return new Promise((res) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) { res(canvas.toDataURL('image/jpeg', quality)); return }
                if (blob.size <= 500 * 1024 || quality <= 0.1) {
                  res(canvas.toDataURL('image/jpeg', quality))
                } else {
                  tryCompress(quality - 0.1).then(res)
                }
              },
              'image/jpeg',
              quality
            )
          })
        }
        tryCompress(0.8).then((thumbnail) => {
          resolve({ original, thumbnail })
        })
      }
      img.src = original
    }
    reader.readAsDataURL(file)
  })
}

function removePhoto(index: number) {
  const updated = props.photos.filter((_, i) => i !== index)
  emit('update:photos', updated)
}
</script>

<template>
  <div class="editor-panel" :style="{ width: panelWidth + 'px' }">
    <div class="editor-scroll">
      <div class="theme-selector">
        <label class="section-label">主题模板</label>
        <div class="theme-cards">
          <div
            v-for="t in themes"
            :key="t.id"
            class="theme-card"
            :class="{ active: currentThemeId === t.id }"
            @click="emit('update:currentThemeId', t.id)"
          >
            <div
              class="theme-color-dot"
              :style="{ background: `linear-gradient(135deg, ${t.primaryColor}, ${t.secondaryColor})` }"
            ></div>
            <span class="theme-name">{{ t.name }}</span>
          </div>
        </div>
      </div>

      <div class="editor-section">
        <div class="section-header" @click="toggleSection('personal')">
          <User :size="16" />
          <span>个人信息</span>
          <ChevronDown :size="14" class="toggle-icon" :class="{ rotated: expandedSections.personal }" />
        </div>
        <Transition name="slide-up">
          <div v-if="expandedSections.personal" class="section-body">
            <input :value="personalInfo.name" placeholder="姓名" class="editor-input" @input="updatePersonal('name', ($event.target as HTMLInputElement).value)" />
            <input :value="personalInfo.title" placeholder="职位头衔" class="editor-input" @input="updatePersonal('title', ($event.target as HTMLInputElement).value)" />
            <input :value="personalInfo.email" placeholder="邮箱" class="editor-input" @input="updatePersonal('email', ($event.target as HTMLInputElement).value)" />
            <input :value="personalInfo.phone" placeholder="电话" class="editor-input" @input="updatePersonal('phone', ($event.target as HTMLInputElement).value)" />
            <input :value="personalInfo.location" placeholder="所在地" class="editor-input" @input="updatePersonal('location', ($event.target as HTMLInputElement).value)" />
            <textarea :value="personalInfo.bio" placeholder="个人简介" class="editor-textarea" rows="3" @input="updatePersonal('bio', ($event.target as HTMLTextAreaElement).value)"></textarea>
          </div>
        </Transition>
      </div>

      <div class="editor-section">
        <div class="section-header" @click="toggleSection('work')">
          <Briefcase :size="16" />
          <span>工作经历</span>
          <ChevronDown :size="14" class="toggle-icon" :class="{ rotated: expandedSections.work }" />
        </div>
        <Transition name="slide-up">
          <div v-if="expandedSections.work" class="section-body">
            <div v-for="(work, idx) in workExperience" :key="work.id" class="sub-item">
              <div class="sub-item-header">
                <span class="sub-item-label">{{ work.company || '新工作经历' }}</span>
                <button class="btn-icon" @click="removeWork(idx)"><Trash2 :size="14" /></button>
              </div>
              <input :value="work.company" placeholder="公司名称" class="editor-input" @input="updateWork(idx, 'company', ($event.target as HTMLInputElement).value)" />
              <input :value="work.position" placeholder="职位" class="editor-input" @input="updateWork(idx, 'position', ($event.target as HTMLInputElement).value)" />
              <div class="date-row">
                <input :value="work.startDate" placeholder="开始日期" class="editor-input half" @input="updateWork(idx, 'startDate', ($event.target as HTMLInputElement).value)" />
                <input :value="work.endDate" placeholder="结束日期" class="editor-input half" @input="updateWork(idx, 'endDate', ($event.target as HTMLInputElement).value)" />
              </div>
              <textarea :value="work.description" placeholder="工作描述" class="editor-textarea" rows="2" @input="updateWork(idx, 'description', ($event.target as HTMLTextAreaElement).value)"></textarea>
            </div>
            <button class="btn-add" @click="addWork"><Plus :size="14" /> 添加工作经历</button>
          </div>
        </Transition>
      </div>

      <div class="editor-section">
        <div class="section-header" @click="toggleSection('education')">
          <GraduationCap :size="16" />
          <span>教育背景</span>
          <ChevronDown :size="14" class="toggle-icon" :class="{ rotated: expandedSections.education }" />
        </div>
        <Transition name="slide-up">
          <div v-if="expandedSections.education" class="section-body">
            <div v-for="(edu, idx) in education" :key="edu.id" class="sub-item">
              <div class="sub-item-header">
                <span class="sub-item-label">{{ edu.school || '新教育经历' }}</span>
                <button class="btn-icon" @click="removeEdu(idx)"><Trash2 :size="14" /></button>
              </div>
              <input :value="edu.school" placeholder="学校名称" class="editor-input" @input="updateEdu(idx, 'school', ($event.target as HTMLInputElement).value)" />
              <input :value="edu.major" placeholder="专业" class="editor-input" @input="updateEdu(idx, 'major', ($event.target as HTMLInputElement).value)" />
              <div class="date-row">
                <input :value="edu.startDate" placeholder="开始日期" class="editor-input half" @input="updateEdu(idx, 'startDate', ($event.target as HTMLInputElement).value)" />
                <input :value="edu.endDate" placeholder="结束日期" class="editor-input half" @input="updateEdu(idx, 'endDate', ($event.target as HTMLInputElement).value)" />
              </div>
              <textarea :value="edu.description" placeholder="描述（可选）" class="editor-textarea" rows="2" @input="updateEdu(idx, 'description', ($event.target as HTMLTextAreaElement).value)"></textarea>
            </div>
            <button class="btn-add" @click="addEducation"><Plus :size="14" /> 添加教育背景</button>
          </div>
        </Transition>
      </div>

      <div class="editor-section">
        <div class="section-header" @click="toggleSection('skills')">
          <Sparkles :size="16" />
          <span>专业技能</span>
          <ChevronDown :size="14" class="toggle-icon" :class="{ rotated: expandedSections.skills }" />
        </div>
        <Transition name="slide-up">
          <div v-if="expandedSections.skills" class="section-body">
            <div v-for="(skill, idx) in skills" :key="idx" class="skill-row">
              <input :value="skill.name" placeholder="技能名称" class="editor-input skill-name" @input="updateSkill(idx, 'name', ($event.target as HTMLInputElement).value)" />
              <input
                type="range"
                :value="skill.level"
                min="0"
                max="100"
                class="skill-slider"
                @input="updateSkill(idx, 'level', Number(($event.target as HTMLInputElement).value))"
              />
              <span class="skill-value">{{ skill.level }}%</span>
              <button class="btn-icon" @click="removeSkill(idx)"><Trash2 :size="14" /></button>
            </div>
            <button class="btn-add" @click="addSkill"><Plus :size="14" /> 添加技能</button>
          </div>
        </Transition>
      </div>

      <div class="editor-section">
        <div class="section-header">
          <span>项目作品截图</span>
        </div>
        <div class="section-body">
          <label class="upload-btn">
            <Plus :size="14" /> 上传截图
            <input type="file" accept="image/jpeg,image/png" multiple class="hidden-input" @change="handlePhotoUpload(($event.target as HTMLInputElement).files!)" />
          </label>
          <div v-if="photos.length" class="photo-list">
            <div v-for="(photo, idx) in photos" :key="photo.id" class="photo-thumb-item">
              <img :src="photo.thumbnail" class="photo-thumb" />
              <button class="photo-remove" @click="removePhoto(idx)"><Trash2 :size="12" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-panel {
  height: 100%;
  background: #f5f6f8;
  border-right: 1px solid #e1e5eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.editor-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.theme-selector {
  margin-bottom: 16px;
}

.theme-cards {
  display: flex;
  gap: 8px;
}

.theme-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 6px;
  border-radius: 10px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  background: white;
}

.theme-card.active {
  border-color: var(--theme-primary);
}

.theme-card:hover {
  background: #eee;
}

.theme-color-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.theme-name {
  font-size: 10px;
  font-weight: 500;
  color: #666;
  text-align: center;
  line-height: 1.2;
}

.editor-section {
  background: white;
  border-radius: 10px;
  margin-bottom: 10px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  font-weight: 600;
  color: #444;
  transition: background 0.15s;
}

.section-header:hover {
  background: #f9fafb;
}

.toggle-icon {
  margin-left: auto;
  transition: transform 0.25s ease;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  display: block;
}

.section-body {
  padding: 0 14px 14px;
}

.editor-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e1e5eb;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 8px;
  outline: none;
  transition: border-color 0.2s;
  background: #fafbfc;
}

.editor-input:focus {
  border-color: var(--theme-primary);
}

.editor-input.half {
  width: 48%;
}

.editor-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e1e5eb;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 8px;
  outline: none;
  resize: vertical;
  transition: border-color 0.2s;
  background: #fafbfc;
  font-family: inherit;
}

.editor-textarea:focus {
  border-color: var(--theme-primary);
}

.date-row {
  display: flex;
  gap: 4%;
}

.sub-item {
  padding: 10px 0;
  border-top: 1px solid #f0f1f3;
}

.sub-item:first-child {
  border-top: none;
  padding-top: 0;
}

.sub-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.sub-item-label {
  font-size: 12px;
  font-weight: 600;
  color: #555;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  color: #aaa;
  padding: 2px;
  transition: color 0.15s;
}

.btn-icon:hover {
  color: #e55;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 8px;
  border: 1px dashed #ccc;
  border-radius: 8px;
  background: none;
  cursor: pointer;
  font-size: 12px;
  color: #888;
  transition: border-color 0.2s, color 0.2s;
}

.btn-add:hover {
  border-color: var(--theme-primary);
  color: var(--theme-primary);
}

.skill-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.skill-name {
  flex: 1;
  min-width: 0;
}

.skill-slider {
  width: 80px;
  accent-color: var(--theme-primary);
}

.skill-value {
  font-size: 11px;
  color: #888;
  min-width: 32px;
  text-align: right;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: 1px dashed #ccc;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #888;
  transition: border-color 0.2s, color 0.2s;
}

.upload-btn:hover {
  border-color: var(--theme-primary);
  color: var(--theme-primary);
}

.hidden-input {
  display: none;
}

.photo-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.photo-thumb-item {
  position: relative;
  width: 60px;
  height: 34px;
  border-radius: 4px;
  overflow: hidden;
}

.photo-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(0,0,0,0.5);
  border: none;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  padding: 0;
}

.slide-up-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

.slide-up-enter-to {
  max-height: 1000px;
  opacity: 1;
}

.slide-up-leave-from {
  max-height: 1000px;
  opacity: 1;
}

.slide-up-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

@media (max-width: 768px) {
  .editor-panel {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 100;
    width: 85vw !important;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    box-shadow: 4px 0 20px rgba(0,0,0,0.1);
  }
}
</style>
