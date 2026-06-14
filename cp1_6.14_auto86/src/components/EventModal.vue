<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue';
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
}

.modal-header {
  padding: 18px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #1a237e;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  transition: all 200ms ease;
}

.close-btn:hover {
  background: #ffe5e5;
  color: #d32f2f;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.form-row.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.required {
  color: #d32f2f;
  margin-left: 2px;
}

.form-item input,
.form-item textarea,
.form-item select {
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 14px;
  color: #222;
  background: #fafafa;
  transition: all 200ms ease;
  outline: none;
  font-family: inherit;
  resize: vertical;
}

.form-item input:focus,
.form-item textarea:focus,
.form-item select:focus {
  border-color: #1a237e;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(26, 35, 126, 0.1);
}

.form-item input.has-error {
  border-color: #d32f2f;
  background: #fff5f5;
}

.form-error {
  font-size: 12px;
  color: #d32f2f;
}

.skill-input-row {
  display: flex;
  gap: 8px;
}

.skill-input-row input {
  flex: 1;
}

.skill-input-row select {
  min-width: 100px;
}

.add-skill-btn {
  border: none;
  background: #1a237e;
  color: #fff;
  border-radius: 8px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
}

.add-skill-btn:hover:not(:disabled) {
  background: #283593;
}

.add-skill-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skill-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  min-height: 28px;
}

.preview-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 999px;
  font-weight: 500;
}

.tag-remove {
  border: none;
  background: transparent;
  width: 16px;
  height: 16px;
  line-height: 1;
  cursor: pointer;
  font-size: 14px;
  color: inherit;
  opacity: 0.7;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease;
}

.tag-remove:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}

.empty-tip {
  font-size: 12px;
  color: #999;
  padding: 6px 4px;
}

.modal-footer {
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.btn-cancel,
.btn-submit {
  height: 38px;
  padding: 0 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
  border: none;
}

.btn-cancel {
  background: #f5f5f5;
  color: #444;
}

.btn-cancel:hover {
  background: #e8e8e8;
}

.btn-submit {
  background: #1a237e;
  color: #fff;
}

.btn-submit:hover {
  background: #283593;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(26, 35, 126, 0.28);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 280ms ease;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform 320ms cubic-bezier(0.2, 0.9, 0.3, 1.1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  transform: translateY(100%);
}

@media (max-width: 768px) {
  .modal-backdrop {
    align-items: stretch;
  }

  .modal-panel {
    max-width: 100%;
    max-height: 92vh;
    border-radius: 18px 18px 0 0;
  }

  .modal-header {
    padding: 16px 18px;
  }

  .modal-body {
    padding: 16px 18px;
  }

  .modal-footer {
    padding: 14px 18px;
  }

  .form-row.two-col {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .skill-input-row {
    flex-wrap: wrap;
  }

  .skill-input-row select {
    flex: 1;
    min-width: 0;
  }
}
</style>
