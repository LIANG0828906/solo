import { Skill, SkillType, createDefaultSkill, getSkillTypeLabel } from './combat';

type SequenceChangeCallback = (skills: Skill[]) => void;

export class ComboEditor {
  private skills: Skill[] = [];
  private onChangeCallbacks: SequenceChangeCallback[] = [];
  private editIndex: number = -1;

  private skillListEl: HTMLElement;
  private addBtnEl: HTMLButtonElement;
  private emptyHintEl: HTMLElement;
  private overlayEl: HTMLElement;
  private editNameEl: HTMLInputElement;
  private editTypeEl: HTMLSelectElement;
  private editDamageEl: HTMLInputElement;
  private editStartupEl: HTMLInputElement;
  private editActiveEl: HTMLInputElement;
  private editRecoveryEl: HTMLInputElement;
  private editSaveEl: HTMLButtonElement;
  private editCancelEl: HTMLButtonElement;
  private editDeleteEl: HTMLButtonElement;

  private dragState: {
    dragging: boolean;
    index: number;
    startY: number;
    offsetY: number;
    placeholder: HTMLElement | null;
    clone: HTMLElement | null;
  } = {
    dragging: false,
    index: -1,
    startY: 0,
    offsetY: 0,
    placeholder: null,
    clone: null,
  };

  constructor() {
    this.skillListEl = document.getElementById('skill-list')!;
    this.addBtnEl = document.getElementById('add-skill-btn') as HTMLButtonElement;
    this.emptyHintEl = document.getElementById('empty-hint')!;
    this.overlayEl = document.getElementById('edit-overlay')!;
    this.editNameEl = document.getElementById('edit-name') as HTMLInputElement;
    this.editTypeEl = document.getElementById('edit-type') as HTMLSelectElement;
    this.editDamageEl = document.getElementById('edit-damage') as HTMLInputElement;
    this.editStartupEl = document.getElementById('edit-startup') as HTMLInputElement;
    this.editActiveEl = document.getElementById('edit-active') as HTMLInputElement;
    this.editRecoveryEl = document.getElementById('edit-recovery') as HTMLInputElement;
    this.editSaveEl = document.getElementById('edit-save') as HTMLButtonElement;
    this.editCancelEl = document.getElementById('edit-cancel') as HTMLButtonElement;
    this.editDeleteEl = document.getElementById('edit-delete') as HTMLButtonElement;

    this.bindEvents();
    this.render();
  }

  onChange(cb: SequenceChangeCallback): void {
    this.onChangeCallbacks.push(cb);
  }

  getSkills(): Skill[] {
    return [...this.skills];
  }

  private notify(): void {
    const snapshot = this.getSkills();
    this.onChangeCallbacks.forEach((cb) => cb(snapshot));
  }

  private bindEvents(): void {
    this.addBtnEl.addEventListener('click', () => this.addSkill());

    this.editSaveEl.addEventListener('click', () => this.saveEdit());
    this.editCancelEl.addEventListener('click', () => this.closeEdit());
    this.editDeleteEl.addEventListener('click', () => this.deleteSkill());
    this.overlayEl.addEventListener('click', (e) => {
      if (e.target === this.overlayEl) this.closeEdit();
    });

    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mouseup', (e) => this.onMouseUp(e));
  }

  private addSkill(): void {
    if (this.skills.length >= 8) return;
    this.skills.push(createDefaultSkill());
    this.render();
    this.notify();
  }

  private removeSkill(index: number): void {
    this.skills.splice(index, 1);
    this.render();
    this.notify();
  }

  private openEdit(index: number): void {
    if (this.dragState.dragging) return;
    this.editIndex = index;
    const skill = this.skills[index];
    this.editNameEl.value = skill.name;
    this.editTypeEl.value = skill.type;
    this.editDamageEl.value = String(skill.damage);
    this.editStartupEl.value = String(skill.startupFrames);
    this.editActiveEl.value = String(skill.activeFrames);
    this.editRecoveryEl.value = String(skill.recoveryFrames);
    this.overlayEl.classList.add('visible');
  }

  private saveEdit(): void {
    if (this.editIndex < 0 || this.editIndex >= this.skills.length) return;
    const skill = this.skills[this.editIndex];
    skill.name = this.editNameEl.value || '普通攻击';
    skill.type = this.editTypeEl.value as SkillType;
    skill.damage = Math.max(1, parseInt(this.editDamageEl.value) || 1);
    skill.startupFrames = Math.max(1, parseInt(this.editStartupEl.value) || 1);
    skill.activeFrames = Math.max(1, parseInt(this.editActiveEl.value) || 1);
    skill.recoveryFrames = Math.max(1, parseInt(this.editRecoveryEl.value) || 1);
    this.closeEdit();
    this.render();
    this.notify();
  }

  private deleteSkill(): void {
    if (this.editIndex < 0) return;
    this.removeSkill(this.editIndex);
    this.closeEdit();
  }

  private closeEdit(): void {
    this.editIndex = -1;
    this.overlayEl.classList.remove('visible');
  }

  private render(): void {
    const cards = this.skillListEl.querySelectorAll('.skill-card');
    cards.forEach((c) => c.remove());
    const placeholders = this.skillListEl.querySelectorAll('.drop-placeholder');
    placeholders.forEach((p) => p.remove());

    this.emptyHintEl.style.display = this.skills.length === 0 ? 'block' : 'none';
    this.addBtnEl.disabled = this.skills.length >= 8;

    this.skills.forEach((skill, index) => {
      const card = document.createElement('div');
      card.className = 'skill-card';
      card.dataset.index = String(index);

      const typeIndicator = document.createElement('div');
      typeIndicator.className = `card-type-indicator type-${skill.type}`;
      card.appendChild(typeIndicator);

      const nameEl = document.createElement('div');
      nameEl.className = 'card-name';
      nameEl.textContent = `${index + 1}. ${skill.name}`;
      card.appendChild(nameEl);

      const infoEl = document.createElement('div');
      infoEl.className = 'card-info';
      infoEl.innerHTML = `伤害:${skill.damage} | <span style="color:#E0E0E0">前摇${skill.startupFrames}</span> <span style="color:#FF6600">判定${skill.activeFrames}</span> <span style="color:#66CCFF">后摇${skill.recoveryFrames}</span>`;
      card.appendChild(infoEl);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeSkill(index);
      });
      card.appendChild(deleteBtn);

      card.addEventListener('click', () => this.openEdit(index));
      card.addEventListener('mousedown', (e) => this.onMouseDown(e, index));

      this.skillListEl.appendChild(card);
    });
  }

  private onMouseDown(e: MouseEvent, index: number): void {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).classList.contains('delete-btn')) return;

    const card = (e.currentTarget as HTMLElement);
    const rect = card.getBoundingClientRect();

    this.dragState = {
      dragging: false,
      index,
      startY: e.clientY,
      offsetY: e.clientY - rect.top,
      placeholder: null,
      clone: null,
    };

    const onFirstMove = (ev: MouseEvent) => {
      const dy = Math.abs(ev.clientY - this.dragState.startY);
      if (dy > 4) {
        this.startDrag(ev, card, index);
        document.removeEventListener('mousemove', onFirstMove);
      }
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onFirstMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onFirstMove);
    document.addEventListener('mouseup', onUp);
  }

  private startDrag(e: MouseEvent, card: HTMLElement, index: number): void {
    this.dragState.dragging = true;
    card.classList.add('dragging');

    const clone = card.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.left = card.getBoundingClientRect().left + 'px';
    clone.style.top = e.clientY - this.dragState.offsetY + 'px';
    clone.style.width = '220px';
    clone.style.zIndex = '150';
    clone.style.pointerEvents = 'none';
    clone.style.opacity = '0.85';
    document.body.appendChild(clone);
    this.dragState.clone = clone;

    const placeholder = document.createElement('div');
    placeholder.className = 'drop-placeholder';
    this.dragState.placeholder = placeholder;

    const listChildren = Array.from(this.skillListEl.querySelectorAll('.skill-card'));
    const refCard = listChildren[index];
    if (refCard) {
      this.skillListEl.insertBefore(placeholder, refCard);
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.dragState.dragging) return;

    const clone = this.dragState.clone;
    if (clone) {
      clone.style.top = e.clientY - this.dragState.offsetY + 'px';
    }

    if (this.dragState.placeholder) {
      const cards = Array.from(
        this.skillListEl.querySelectorAll('.skill-card:not(.dragging)')
      );
      let insertBefore: Element | null = null;

      for (const c of cards) {
        const rect = c.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          insertBefore = c;
          break;
        }
      }

      if (insertBefore) {
        this.skillListEl.insertBefore(this.dragState.placeholder, insertBefore);
      } else {
        this.skillListEl.appendChild(this.dragState.placeholder);
      }
    }
  }

  private onMouseUp(_e: MouseEvent): void {
    if (!this.dragState.dragging) return;

    const placeholder = this.dragState.placeholder;
    if (placeholder && placeholder.parentNode) {
      const fromIndex = this.dragState.index;
      const allItems = Array.from(this.skillListEl.children);
      let toIndex = -1;

      for (let i = 0; i < allItems.length; i++) {
        if (allItems[i] === placeholder) {
          toIndex = i;
          break;
        }
      }

      if (toIndex >= 0 && toIndex !== fromIndex) {
        const [moved] = this.skills.splice(fromIndex, 1);
        const adjustedIndex = toIndex > fromIndex ? toIndex - 1 : toIndex;
        this.skills.splice(adjustedIndex, 0, moved);
      }

      placeholder.remove();
    }

    if (this.dragState.clone) {
      this.dragState.clone.remove();
    }

    this.dragState = {
      dragging: false,
      index: -1,
      startY: 0,
      offsetY: 0,
      placeholder: null,
      clone: null,
    };

    this.render();
    this.notify();
  }
}
