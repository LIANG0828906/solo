/**
 * ============================================================
 *  应用入口文件 src/main.ts
 * ============================================================
 *  职责：
 *    - 初始化 UI 控制器、PixelRenderer 画布引擎、CharacterFactory 工厂、GalleryManager 图鉴管理器
 *    - 注册 DOM 事件（表单提交、微调按钮点击、搜索输入、保存、删除等）
 *    - 协调各模块之间的数据流动
 *
 *  数据流向：
 *    用户输入(表单) → main.ts 拦截提交事件
 *      → CharacterFactory.generateCharacter() 生成角色数据
 *        → PixelRenderer.render() 绘制像素头像
 *      → 可选: GalleryManager.saveCharacter() 持久化
 *      → UI 更新（图鉴渲染、Toast 提示）
 * ============================================================
 */

import { PixelRenderer } from './pixelRenderer';
import { CharacterFactory } from './characterFactory';
import { GalleryManager } from './galleryManager';
import type { CharacterData } from './types';

/* ------------------------------------------------------------------ */
/*  DOM 元素引用                                                        */
/* ------------------------------------------------------------------ */
const $ = (sel: string) => document.querySelector(sel) as HTMLElement;
const canvasEl = $('#portraitCanvas') as HTMLCanvasElement;
const formEl = $('#characterForm') as HTMLFormElement;
const nameInput = $('#characterName') as HTMLInputElement;
const descInput = $('#characterDesc') as HTMLTextAreaElement;
const nameCountEl = $('#nameCount') as HTMLSpanElement;
const descCountEl = $('#descCount') as HTMLSpanElement;
const generateBtn = $('#generateBtn') as HTMLButtonElement;
const saveBtn = $('#saveBtn') as HTMLButtonElement;
const searchInput = $('#searchInput') as HTMLInputElement;
const characterListEl = $('#characterList') as HTMLDivElement;
const totalCountEl = $('#totalCount') as HTMLSpanElement;
const toastEl = $('#toast') as HTMLDivElement;
const confirmDialog = $('#confirmDialog') as HTMLDivElement;
const cancelDeleteBtn = $('#cancelDelete') as HTMLButtonElement;
const confirmDeleteBtn = $('#confirmDelete') as HTMLButtonElement;

/* ------------------------------------------------------------------ */
/*  模块实例化                                                          */
/* ------------------------------------------------------------------ */
const renderer = new PixelRenderer(canvasEl);
const characterFactory = new CharacterFactory(renderer);
const galleryManager = new GalleryManager();

/* ------------------------------------------------------------------ */
/*  全局状态                                                            */
/* ------------------------------------------------------------------ */
let currentCharacter: CharacterData | null = null;
let pendingDeleteId: string | null = null;
let searchDebounceTimer: number | null = null;

/* ================================================================== */
/*  UI 渲染函数                                                         */
/* ================================================================== */

/** 渲染图鉴列表 */
function renderGallery(keyword: string = ''): void {
  const characters = keyword
    ? galleryManager.searchCharacters(keyword)
    : galleryManager.getAllCharacters();

  characterListEl.innerHTML = '';

  if (characters.length === 0) {
    characterListEl.innerHTML = `
      <div style="text-align:center;padding:48px 16px;color:#6a6a7a;font-size:14px;">
        <div style="font-size:48px;margin-bottom:12px;">📭</div>
        <div>${keyword ? '没有找到匹配的角色' : '图鉴还是空的，快去创建一个角色吧！'}</div>
      </div>
    `;
  } else {
    const frag = document.createDocumentFragment();
    for (const char of characters) {
      frag.appendChild(createCardEl(char));
    }
    characterListEl.appendChild(frag);
  }

  totalCountEl.textContent = `共 ${galleryManager.getCharacterCount()} 个角色`;
}

/** 创建单个角色卡片 DOM */
function createCardEl(char: CharacterData): HTMLElement {
  const card = document.createElement('div');
  card.className = 'character-card';
  card.dataset.id = char.id;
  card.style.animation = 'cardIn 0.3s ease';

  const summary = char.description.length > 36
    ? char.description.slice(0, 36) + '…'
    : char.description;

  card.innerHTML = `
    <div class="card-thumb">
      <img src="${char.avatarDataUrl}" alt="${char.name}" width="64" height="64" />
    </div>
    <div class="card-body">
      <div class="card-name" title="${char.name}">${char.name || '无名角色'}</div>
      <div class="card-desc" title="${char.description}">${summary || '暂无描述'}</div>
    </div>
    <button class="card-delete" data-action="delete" data-id="${char.id}" title="删除">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
  `;

  card.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-action="delete"]')) {
      e.stopPropagation();
      openDeleteDialog(char.id);
    }
  });

  return card;
}

/** Toast 提示 */
function showToast(msg: string, type: 'success' | 'error' | 'info' = 'success'): void {
  toastEl.textContent = msg;
  toastEl.className = 'toast show ' + type;
  window.setTimeout(() => {
    toastEl.className = 'toast';
  }, 2000);
}

/** 删除确认对话框 */
function openDeleteDialog(id: string): void {
  pendingDeleteId = id;
  confirmDialog.classList.add('show');
}
function closeDeleteDialog(): void {
  pendingDeleteId = null;
  confirmDialog.classList.remove('show');
}
function executeDelete(): void {
  if (!pendingDeleteId) return;

  const cardEl = characterListEl.querySelector(`[data-id="${pendingDeleteId}"]`) as HTMLElement | null;
  const removeFromUI = () => {
    galleryManager.deleteCharacter(pendingDeleteId!);
    renderGallery(searchInput.value);
    showToast('角色已删除', 'info');
  };

  if (cardEl) {
    cardEl.style.animation = 'cardOut 0.3s ease forwards';
    window.setTimeout(removeFromUI, 280);
  } else {
    removeFromUI();
  }
  closeDeleteDialog();
}

/* ================================================================== */
/*  事件绑定                                                            */
/* ================================================================== */

/** 字数统计 */
nameInput.addEventListener('input', () => {
  nameCountEl.textContent = `${nameInput.value.length}/20`;
});
descInput.addEventListener('input', () => {
  descCountEl.textContent = `${descInput.value.length}/120`;
});

/** 表单提交 → 生成角色 */
formEl.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const description = descInput.value.trim();

  if (!description) {
    showToast('请输入角色描述', 'error');
    return;
  }

  generateBtn.disabled = true;
  generateBtn.style.opacity = '0.7';
  const t0 = performance.now();

  try {
    const { data } = characterFactory.generateCharacter(name || '无名角色', description);
    currentCharacter = data;
    const t1 = performance.now();
    showToast(`生成完成（${Math.round(t1 - t0)}ms）`, 'success');
  } catch (err) {
    console.error(err);
    showToast('生成失败，请重试', 'error');
  } finally {
    generateBtn.disabled = false;
    generateBtn.style.opacity = '1';
  }
});

/** 保存到图鉴 */
saveBtn.addEventListener('click', () => {
  if (!currentCharacter) {
    showToast('请先生成一个角色', 'error');
    return;
  }
  currentCharacter = {
    ...currentCharacter,
    avatarDataUrl: characterFactory.getAvatarDataUrl(),
    features: characterFactory.getCurrentFeatures(),
    name: nameInput.value.trim() || currentCharacter.name,
    description: descInput.value.trim() || currentCharacter.description,
  };
  galleryManager.saveCharacter(currentCharacter);
  renderGallery(searchInput.value);
  showToast('保存成功！', 'success');
});

/** 微调按钮（事件委托） */
document.querySelectorAll('.tweak-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tweak = (btn as HTMLElement).dataset.tweak;
    canvasEl.style.transition = 'opacity 0.3s ease';
    canvasEl.style.opacity = '0.4';

    window.setTimeout(() => {
      switch (tweak) {
        case 'hair-style':  characterFactory.randomizeHairStyle();  break;
        case 'hair-color':  characterFactory.randomizeHairColor();  break;
        case 'eye-color':   characterFactory.randomizeEyeColor();   break;
        case 'clothing':    characterFactory.randomizeClothes();    break;
        case 'background':  characterFactory.randomizeBackground(); break;
        case 'random':      characterFactory.randomizeAll();        break;
      }
      canvasEl.style.opacity = '1';
      if (currentCharacter) {
        currentCharacter.features = characterFactory.getCurrentFeatures();
        currentCharacter.avatarDataUrl = characterFactory.getAvatarDataUrl();
      }
    }, 120);
  });
});

/** 搜索输入（300ms 防抖） */
searchInput.addEventListener('input', () => {
  if (searchDebounceTimer) window.clearTimeout(searchDebounceTimer);
  searchDebounceTimer = window.setTimeout(() => {
    renderGallery(searchInput.value);
  }, 300);
});

/** 删除确认弹窗按钮 */
cancelDeleteBtn.addEventListener('click', closeDeleteDialog);
confirmDeleteBtn.addEventListener('click', executeDelete);
confirmDialog.addEventListener('click', (e) => {
  if (e.target === confirmDialog) closeDeleteDialog();
});

/* ================================================================== */
/*  初始化                                                              */
/* ================================================================== */
function init(): void {
  nameCountEl.textContent = `${nameInput.value.length}/20`;
  descCountEl.textContent = `${descInput.value.length}/120`;
  characterFactory.randomizeAll();
  currentCharacter = {
    id: 'preview_' + Date.now().toString(36),
    name: '预览角色',
    description: '示例描述',
    features: characterFactory.getCurrentFeatures(),
    avatarDataUrl: characterFactory.getAvatarDataUrl(),
    createdAt: Date.now(),
  };
  renderGallery();
}

init();
