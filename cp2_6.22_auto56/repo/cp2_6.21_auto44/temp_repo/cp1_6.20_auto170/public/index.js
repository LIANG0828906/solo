(function () {
  'use strict';

  const API_BASE = 'http://127.0.0.1:3000/api';

  const AVATAR_COLORS = [
    '#c0392b', '#e74c3c', '#d35400', '#e67e22',
    '#f39c12', '#27ae60', '#2ecc71', '#16a085',
    '#1abc9c', '#2980b9', '#3498db', '#2c3e50',
    '#8e44ad', '#9b59b6', '#c41e3a', '#a04000'
  ];

  const state = {
    cards: [],
    exchanges: [],
    myCardId: localStorage.getItem('myCardId') || null
  };

  const elements = {
    cardsGrid: document.getElementById('cardsGrid'),
    emptyHall: document.getElementById('emptyHall'),
    createCardBtn: document.getElementById('createCardBtn'),
    modalBackdrop: document.getElementById('modalBackdrop'),
    createModal: document.getElementById('createModal'),
    modalClose: document.getElementById('modalClose'),
    cardForm: document.getElementById('cardForm'),
    skillsInput: document.getElementById('skills'),
    skillsPreview: document.getElementById('skillsPreview'),
    exchangeBtn: document.getElementById('exchangeBtn'),
    sidePanel: document.getElementById('sidePanel'),
    sidePanelClose: document.getElementById('sidePanelClose'),
    exchangesList: document.getElementById('exchangesList')
  };

  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function getAvatarColor(name) {
    const index = hashString(name || 'anonymous') % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  }

  function getInitial(name) {
    if (!name) return '?';
    const trimmed = name.trim();
    if (!trimmed) return '?';
    return trimmed.charAt(0).toUpperCase();
  }

  function formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    if (days < 365) return `${Math.floor(days / 30)}个月前`;
    return `${Math.floor(days / 365)}年前`;
  }

  function createCardElement(card, isNew) {
    const container = document.createElement('div');
    container.className = 'card-container' + (isNew ? ' new-card' : '');
    container.dataset.cardId = card.id;

    const inner = document.createElement('div');
    inner.className = 'card-inner';

    const front = document.createElement('div');
    front.className = 'card-front';

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.style.background = getAvatarColor(card.nickname);
    avatar.textContent = getInitial(card.nickname);

    const nickname = document.createElement('div');
    nickname.className = 'card-nickname';
    nickname.textContent = card.nickname;

    const bio = document.createElement('div');
    bio.className = 'card-bio';
    bio.textContent = card.bio || '— 神秘的创意人 —';

    front.appendChild(avatar);
    front.appendChild(nickname);
    front.appendChild(bio);

    const back = document.createElement('div');
    back.className = 'card-back';

    const skillsWrap = document.createElement('div');
    skillsWrap.className = 'card-skills';
    (card.skills || []).forEach(skill => {
      const tag = document.createElement('span');
      tag.className = 'skill-tag';
      tag.textContent = skill;
      skillsWrap.appendChild(tag);
    });

    if (!card.skills || card.skills.length === 0) {
      const placeholder = document.createElement('span');
      placeholder.className = 'skill-tag';
      placeholder.style.opacity = '0.5';
      placeholder.textContent = '暂无标签';
      skillsWrap.appendChild(placeholder);
    }

    const email = document.createElement('div');
    email.className = 'card-email';
    email.textContent = card.email;

    back.appendChild(skillsWrap);
    back.appendChild(email);

    inner.appendChild(front);
    inner.appendChild(back);
    container.appendChild(inner);

    container.addEventListener('click', function (e) {
      e.stopPropagation();
      handleCardClick(card, container, inner);
    });

    return container;
  }

  function handleCardClick(card, container, inner) {
    const isFlipped = inner.classList.toggle('flipped');

    if (isFlipped && card.id !== state.myCardId) {
      recordExchange(card.id);
    }
  }

  async function recordExchange(targetCardId) {
    try {
      await fetch(`${API_BASE}/exchanges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewerId: state.myCardId,
          targetCardId: targetCardId
        })
      });
      loadExchanges();
    } catch (err) {
      console.warn('记录交换失败:', err);
    }
  }

  function renderCards(cards, highlightId) {
    elements.cardsGrid.innerHTML = '';

    if (!cards || cards.length === 0) {
      elements.emptyHall.style.display = 'block';
      return;
    }

    elements.emptyHall.style.display = 'none';

    const fragment = document.createDocumentFragment();
    cards.forEach(card => {
      const isNew = card.id === highlightId;
      const cardEl = createCardElement(card, isNew);
      fragment.appendChild(cardEl);
    });
    elements.cardsGrid.appendChild(fragment);
  }

  function openCreateModal() {
    elements.modalBackdrop.classList.add('active');
    elements.createModal.classList.add('active');
    setTimeout(() => {
      const firstInput = elements.cardForm.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 350);
  }

  function closeCreateModal() {
    elements.modalBackdrop.classList.remove('active');
    elements.createModal.classList.remove('active');
    elements.cardForm.reset();
    elements.skillsPreview.innerHTML = '';
  }

  function updateSkillsPreview() {
    const raw = elements.skillsInput.value || '';
    const skills = raw
      .split(/[,，]/)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 5);

    elements.skillsPreview.innerHTML = '';
    skills.forEach(skill => {
      const tag = document.createElement('span');
      tag.className = 'skill-tag';
      tag.textContent = skill;
      elements.skillsPreview.appendChild(tag);
    });
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();

    const nickname = document.getElementById('nickname').value.trim();
    const bio = document.getElementById('bio').value.trim();
    const email = document.getElementById('email').value.trim();
    const skillsRaw = elements.skillsInput.value || '';
    const skills = skillsRaw
      .split(/[,，]/)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 5);

    if (!nickname || !email) {
      alert('请填写昵称和邮箱');
      return;
    }

    const submitBtn = elements.cardForm.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '保存中...';

    try {
      const res = await fetch(`${API_BASE}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, bio, skills, email })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || '保存失败');
      }

      const newCard = await res.json();
      state.myCardId = newCard.id;
      localStorage.setItem('myCardId', newCard.id);

      closeCreateModal();
      await loadCards(newCard.id);
    } catch (err) {
      alert(err.message || '创建名片失败，请重试');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '保存名片';
    }
  }

  function openSidePanel() {
    elements.sidePanel.classList.add('active');
    loadExchanges();
  }

  function closeSidePanel() {
    elements.sidePanel.classList.remove('active');
  }

  function renderExchanges(exchanges) {
    elements.exchangesList.innerHTML = '';

    if (!exchanges || exchanges.length === 0) {
      const p = document.createElement('p');
      p.className = 'no-exchanges';
      p.textContent = '暂无交换记录';
      elements.exchangesList.appendChild(p);
      return;
    }

    const fragment = document.createDocumentFragment();
    exchanges.forEach(ex => {
      const item = document.createElement('div');
      item.className = 'exchange-item';

      const nickname = document.createElement('div');
      nickname.className = 'exchange-nickname';
      nickname.textContent = ex.targetNickname;

      if (ex.mutual) {
        const badge = document.createElement('span');
        badge.className = 'mutual-badge';
        badge.textContent = '互相关注';
        nickname.appendChild(badge);
      }

      const time = document.createElement('div');
      time.className = 'exchange-time';
      time.textContent = formatRelativeTime(ex.timestamp);

      const link = document.createElement('a');
      link.className = 'exchange-view-link';
      link.textContent = '查看名片 →';
      link.addEventListener('click', function () {
        closeSidePanel();
        scrollToCard(ex.targetCardId);
      });

      item.appendChild(nickname);
      item.appendChild(time);
      item.appendChild(link);
      fragment.appendChild(item);
    });

    elements.exchangesList.appendChild(fragment);
  }

  function scrollToCard(cardId) {
    const cardEl = elements.cardsGrid.querySelector(`[data-card-id="${cardId}"]`);
    if (!cardEl) return;

    cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    cardEl.classList.remove('highlight');
    void cardEl.offsetWidth;
    cardEl.classList.add('highlight');
  }

  async function loadCards(highlightId) {
    try {
      const res = await fetch(`${API_BASE}/cards`);
      if (!res.ok) throw new Error('加载失败');
      state.cards = await res.json();
      renderCards(state.cards, highlightId);
    } catch (err) {
      console.warn('加载名片失败:', err);
    }
  }

  async function loadExchanges() {
    try {
      const params = new URLSearchParams();
      if (state.myCardId) params.set('viewerId', state.myCardId);
      const query = params.toString() ? '?' + params.toString() : '';
      const res = await fetch(`${API_BASE}/exchanges${query}`);
      if (!res.ok) throw new Error('加载失败');
      state.exchanges = await res.json();
      renderExchanges(state.exchanges);
    } catch (err) {
      console.warn('加载交换记录失败:', err);
    }
  }

  function bindEvents() {
    elements.createCardBtn.addEventListener('click', openCreateModal);
    elements.modalClose.addEventListener('click', closeCreateModal);
    elements.modalBackdrop.addEventListener('click', closeCreateModal);

    elements.cardForm.addEventListener('submit', handleCreateSubmit);
    elements.skillsInput.addEventListener('input', updateSkillsPreview);

    elements.exchangeBtn.addEventListener('click', openSidePanel);
    elements.sidePanelClose.addEventListener('click', closeSidePanel);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (elements.createModal.classList.contains('active')) {
          closeCreateModal();
        } else if (elements.sidePanel.classList.contains('active')) {
          closeSidePanel();
        }
      }
    });

    document.addEventListener('click', function () {
      document.querySelectorAll('.card-inner.flipped').forEach(inner => {
        inner.classList.remove('flipped');
      });
    });
  }

  function init() {
    bindEvents();
    const start = performance.now();
    loadCards().then(() => {
      const elapsed = performance.now() - start;
      if (elapsed < 1000) {
        console.log(`名片数据渲染完成: ${Math.round(elapsed)}ms`);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
