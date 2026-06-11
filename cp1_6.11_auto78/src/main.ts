import type { Card, CardGroup, CardGroupSummary } from './card';
import { ReviewState } from './review';
import { createGroup, getGroup, listGroups } from './api';
import {
  renderPreviewCard,
  renderCardsList,
  renderGroupsList,
  renderProgressPanel,
  setupChartTooltip,
  renderReviewScreen,
  showToast,
  CreateFormState
} from './ui';

const NICKNAME_KEY = 'memorycards_nickname';

interface AppState {
  form: CreateFormState;
  groups: CardGroupSummary[];
  currentGroup: CardGroup | null;
  reviewState: ReviewState | null;
}

const appState: AppState = {
  form: { cards: [] },
  groups: [],
  currentGroup: null,
  reviewState: null
};

function getNickname(): string {
  return (localStorage.getItem(NICKNAME_KEY) || '').trim();
}

function setNickname(name: string): void {
  localStorage.setItem(NICKNAME_KEY, name.trim());
}

function showView(name: 'create' | 'groups' | 'review'): void {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => {
    const isActive = t.dataset.view === name || (name === 'review' && false);
    t.classList.toggle('active', isActive);
  });

  if (name === 'create') {
    document.getElementById('createView')?.classList.add('active');
  } else if (name === 'groups') {
    document.getElementById('groupsView')?.classList.add('active');
    refreshGroups();
  } else if (name === 'review') {
    document.getElementById('reviewView')?.classList.add('active');
  }
}

function updateHash(name: string, param?: string): void {
  if (name === 'create') location.hash = '#create';
  else if (name === 'groups') location.hash = '#groups';
  else if (name === 'review' && param) location.hash = `#review/${param}`;
  else location.hash = '';
}

function parseHash(): { view: string; param?: string } {
  const h = location.hash.replace(/^#/, '');
  if (h.startsWith('review/')) {
    return { view: 'review', param: h.slice(7) };
  }
  if (h === 'groups') return { view: 'groups' };
  return { view: 'create' };
}

async function refreshGroups(): Promise<void> {
  try {
    const result = await listGroups();
    appState.groups = result.groups || [];
  } catch (e) {
    appState.groups = [];
  }
  renderGroupsList(appState.groups, (id) => {
    startReview(id);
  }, () => {
    showView('create');
    updateHash('create');
  });
}

function updateSidePanel(): void {
  if (appState.currentGroup) {
    renderProgressPanel(appState.currentGroup.cards, appState.currentGroup.reviewedToday);
  } else {
    renderProgressPanel(appState.form.cards.map(c => ({
      id: '',
      front: c.front,
      back: c.back,
      memoryLevel: 1,
      nextReviewDate: new Date().toISOString(),
      createDate: new Date().toISOString()
    })), 0);
  }
}

function setupCreateView(): void {
  const nicknameInput = document.getElementById('nicknameInput') as HTMLInputElement;
  nicknameInput.value = getNickname();
  nicknameInput.addEventListener('input', () => {
    setNickname(nicknameInput.value);
  });

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view || 'create';
      if (view === 'create' || view === 'groups') {
        showView(view);
        updateHash(view);
      }
    });
  });

  document.querySelectorAll('[data-goto-create]').forEach(el => {
    el.addEventListener('click', () => {
      showView('create');
      updateHash('create');
    });
  });

  const previewCard = document.getElementById('previewCard');
  previewCard?.addEventListener('click', () => {
    previewCard.classList.toggle('flipped');
  });

  const frontInput = document.getElementById('frontInput') as HTMLTextAreaElement;
  const backInput = document.getElementById('backInput') as HTMLTextAreaElement;
  const groupNameInput = document.getElementById('groupNameInput') as HTMLInputElement;

  function updatePreview() {
    renderPreviewCard(frontInput.value, backInput.value);
  }
  frontInput.addEventListener('input', updatePreview);
  backInput.addEventListener('input', updatePreview);
  updatePreview();

  document.getElementById('addCardBtn')?.addEventListener('click', () => {
    const f = frontInput.value.trim();
    const b = backInput.value.trim();
    if (!f && !b) {
      showToast('请输入卡片的正面或背面内容', 'error');
      return;
    }
    appState.form.cards.push({ front: f, back: b });
    renderCardsList(appState.form, (idx) => {
      appState.form.cards.splice(idx, 1);
      renderCardsList(appState.form, (i) => {
        appState.form.cards.splice(i, 1);
        renderCardsList(appState.form, arguments.callee as any);
        updateSidePanel();
      });
      updateSidePanel();
    });
    frontInput.value = '';
    backInput.value = '';
    updatePreview();
    updateSidePanel();
    showToast(`已添加第 ${appState.form.cards.length} 张卡片`, 'success');
  });

  document.getElementById('clearCardBtn')?.addEventListener('click', () => {
    frontInput.value = '';
    backInput.value = '';
    updatePreview();
  });

  document.getElementById('createGroupBtn')?.addEventListener('click', async () => {
    const name = groupNameInput.value.trim();
    const owner = getNickname() || '访客';
    if (!name) {
      showToast('请输入卡片组名称', 'error');
      groupNameInput.focus();
      return;
    }
    if (appState.form.cards.length === 0) {
      showToast('至少添加一张卡片', 'error');
      frontInput.focus();
      return;
    }
    try {
      const result = await createGroup({
        name,
        cards: appState.form.cards,
        owner
      });
      showToast('卡片组创建成功！', 'success');
      appState.form.cards = [];
      groupNameInput.value = '';
      renderCardsList(appState.form, () => {});
      setTimeout(() => {
        startReview(result.id);
      }, 400);
    } catch (e: any) {
      showToast(e?.message || '创建失败', 'error');
    }
  });

  setupMobilePanel();
  setupChartTooltip();
  updateSidePanel();
  renderCardsList(appState.form, (idx) => {
    appState.form.cards.splice(idx, 1);
    renderCardsList(appState.form, arguments.callee as any);
    updateSidePanel();
  });
}

function setupMobilePanel(): void {
  const panel = document.getElementById('sidePanel');
  const handle = document.getElementById('panelHandle');
  if (!panel) return;

  const isMobile = () => window.innerWidth <= 900;
  if (!isMobile()) panel.classList.add('expanded');

  let touchStartY = 0;
  let touchStartTransform = 0;

  handle?.addEventListener('click', (e) => {
    if (!isMobile()) return;
    e.stopPropagation();
    panel.classList.toggle('expanded');
  });

  handle?.addEventListener('touchstart', (e) => {
    if (!isMobile()) return;
    touchStartY = e.touches[0].clientY;
    const style = getComputedStyle(panel);
    const match = style.transform.match(/matrix.*,\s*(-?\d+(?:\.\d+)?)\s*\)/);
    touchStartTransform = match ? parseFloat(match[1]) : 0;
  }, { passive: true });

  handle?.addEventListener('touchmove', (e) => {
    if (!isMobile()) return;
    const dy = touchStartY - e.touches[0].clientY;
    if (dy > 30) panel.classList.add('expanded');
    else if (dy < -30) panel.classList.remove('expanded');
  }, { passive: true });
}

async function startReview(groupId: string): Promise<void> {
  try {
    const group = await getGroup(groupId);
    appState.currentGroup = group;
    appState.reviewState = new ReviewState(group);

    showView('review');
    updateHash('review', groupId);

    renderReviewScreen(
      appState.reviewState,
      () => {
        appState.reviewState?.flipCard();
      },
      async (level: 1 | 2 | 3) => {
        if (!appState.reviewState) return;
        await appState.reviewState.recordFeedback(level);
        const msgs: Record<number, string> = {
          1: '已重置为初级记忆',
          2: '保持当前等级',
          3: '记忆等级提升！'
        };
        showToast(msgs[level], level === 3 ? 'success' : level === 1 ? 'error' : 'info');
        setTimeout(() => {
          appState.reviewState?.advanceToNextCard();
        }, 100);
      },
      () => {
        appState.reviewState = null;
        showView('groups');
        updateHash('groups');
      }
    );
  } catch (e: any) {
    showToast(e?.message || '加载失败', 'error');
    showView('groups');
    updateHash('groups');
  }
}

function handleRoute(): void {
  const { view, param } = parseHash();
  if (view === 'review' && param) {
    startReview(param);
  } else if (view === 'groups') {
    showView('groups');
    refreshGroups();
  } else {
    showView('create');
  }
}

function hideLoader(): void {
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 600);
    }, 400);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupCreateView();
  handleRoute();
  window.addEventListener('hashchange', handleRoute);
  hideLoader();
});
