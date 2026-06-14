<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { X } from 'lucide-vue-next';
import { useTimelineStore } from '@/store/timelineStore';
import { useTimelineData } from '@/composables/useTimelineData';
import { SKILL_CATEGORY_META, ALL_CATEGORIES } from '@/types';
import type { TimelineEvent, SkillTag, SkillCategory } from '@/types';

const store = useTimelineStore();
const { saveEvent, generateId } = useTimelineData();

const visible = computed(() => store.modalVisible);
const editing = computed(() => store.editingEvent);

interface FormData {
  startYear: number;
  endYear: number;
  position: string;
  company: string;
  description: string;
  skills: SkillTag[];
  newSkillName: string;
  newSkillCategory: SkillCategory;
}

const form = reactive<FormData>({
  startYear: new Date().getFullYear(),
  endYear: new Date().getFullYear(),
  position: '',
  company: '',
  description: '',
  skills: [],
  newSkillName: '',
  newSkillCategory: 'frontend',
});

const formErrors = reactive({
  position: '',
  company: '',
});

watch(visible, (v) => {
  if (v) {
    if (editing.value) {
      form.startYear = editing.value.startYear;
      form.endYear = editing.value.endYear;
      form.position = editing.value.position;
      form.company = editing.value.company;
      form.description = editing.value.description;
      form.skills = JSON.parse(JSON.stringify(editing.value.skills));
    } else {
      form.startYear = new Date().getFullYear();
      form.endYear = new Date().getFullYear();
      form.position = '';
      form.company = '';
      form.description = '';
      form.skills = [];
    }
    formErrors.position = '';
    formErrors.company = '';
    form.newSkillName = '';
    form.newSkillCategory = 'frontend';
  }
});

function addSkill() {
  const name = form.newSkillName.trim();
  if (!name) return;
  if (form.skills.length >= 5) return;
  if (form.skills.some((s) => s.name === name)) return;
  form.skills.push({ name, category: form.newSkillCategory });
  form.newSkillName = '';
}

function removeSkill(name: string) {
  form.skills = form.skills.filter((s) => s.name !== name);
}

function validate(): boolean {
  let ok = true;
  formErrors.position = '';
  formErrors.company = '';
  if (!form.position.trim()) {
    formErrors.position = '请输入职位名称';
    ok = false;
  }
  if (!form.company.trim()) {
    formErrors.company = '请输入公司或项目名称';
    ok = false;
  }
  if (form.startYear > form.endYear) {
    const tmp = form.startYear;
    form.startYear = form.endYear;
    form.endYear = tmp;
  }
  return ok;
}

function handleSubmit() {
  if (!validate()) return;
  const event: TimelineEvent = {
    id: editing.value?.id ?? generateId(),
    startYear: form.startYear,
    endYear: form.endYear,
    position: form.position.trim(),
    company: form.company.trim(),
    description: form.description.trim(),
    skills: form.skills,
  };
  saveEvent(event);
  store.closeModal();
}

function handleClose() {
  store.closeModal();
}

function onBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
    handleClose();
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="modal-backdrop"
        @click="onBackdropClick"
      >
        <div class="modal-panel">
          <div class="modal-header">
            <h3>{{ editing ? '编辑履历事件' : '添加履历事件' }}</h3>
            <button class="close-btn" @click="handleClose" aria-label="关闭">
              <X :size="18" />
            </button>
          </div>

          <div class="modal-body">
            <div class="form-row two-col">
              <div class="form-item">
                <label>起始年份</label>
                <input
                  v-model.number="form.startYear"
                  type="number"
                  min="1970"
                  max="2100"
                />
              </div>
              <div class="form-item">
                <label>结束年份</label>
                <input
                  v-model.number="form.endYear"
                  type="number"
                  min="1970"
                  max="2100"
                />
              </div>
            </div>

            <div class="form-item">
              <label>职位 / 角色 <span class="required">*</span></label>
              <input
                v-model="form.position"
                type="text"
                placeholder="例如：高级前端工程师"
                :class="{ 'has-error': formErrors.position }"
              />
              <div v-if="formErrors.position" class="form-error">
                {{ formErrors.position }}
              </div>
            </div>

            <div class="form-item">
              <label>公司 / 项目名 <span class="required">*</span></label>
              <input
                v-model="form.company"
                type="text"
                placeholder="例如：星海实验室"
                :class="{ 'has-error': formErrors.company }"
              />
              <div v-if="formErrors.company" class="form-error">
                {{ formErrors.company }}
              </div>
            </div>

            <div class="form-item">
              <label>详细描述</label>
              <textarea
                v-model="form.description"
                rows="4"
                placeholder="简要描述这段经历的职责和成就..."
              />
            </div>

            <div class="form-item">
              <label>技能标签（最多 5 个）</label>
              <div class="skill-input-row">
                <input
                  v-model="form.newSkillName"
                  type="text"
                  placeholder="输入技能名称后回车添加"
                  @keydown.enter.prevent="addSkill"
                  :disabled="form.skills.length >= 5"
                />
                <select v-model="form.newSkillCategory">
                  <option v-for="cat in ALL_CATEGORIES" :key="cat" :value="cat">
                    {{ SKILL_CATEGORY_META[cat].label }}
                  </option>
                </select>
                <button
                  class="add-skill-btn"
                  @click="addSkill"
                  :disabled="!form.newSkillName.trim() || form.skills.length >= 5"
                >
                  添加
                </button>
              </div>
              <div class="skill-preview">
                <span
                  v-for="skill in form.skills"
                  :key="skill.name"
                  class="preview-tag"
                  :style="{
                    color: SKILL_CATEGORY_META[skill.category].color,
                    backgroundColor: SKILL_CATEGORY_META[skill.category].bgColor,
                  }"
                >
                  {{ skill.name }}
                  <button
                    type="button"
                    class="tag-remove"
                    @click="removeSkill(skill.name)"
                    aria-label="移除"
                  >
                    ×
                  </button>
                </span>
                <span v-if="form.skills.length === 0" class="empty-tip">
                  暂无技能标签，上方输入框添加
                </span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="handleClose">取消</button>
            <button class="btn-submit" @click="handleSubmit">
              {{ editing ? '保存修改' : '创建事件' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 9999;
  padding: 0;
}

.modal-panel {
  background: #ffffff;
  width: 100%;
  max-width: 640px;
  max-height: 88vh;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.18);
