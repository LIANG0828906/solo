import { generateCards, filterCards, type CardData } from './cardGenerator';
import {
  renderCards as waterfallRenderCards,
  appendCards as waterfallAppendCards,
  reflow,
  initWaterfall,
} from './waterfall';
import {
  fadeInElements,
  likeButtonAnimate,
  likeCountAnimate,
} from './animation';

const BATCH_SIZE = 6;
const SCROLL_THROTTLE = 150;
const LOAD_THRESHOLD = 200;

let allCards: CardData[] = [];
let filteredCards: CardData[] = [];
let loadedCount = 0;
let currentTag = 'all';
let currentKeyword = '';
let isLoading = false;
let cardElements: HTMLElement[] = [];
let lastScrollTime = 0;
let likedCards = new Set<number>();

const container = document.getElementById('waterfallContainer') as HTMLElement;
const loadingEl = document.getElementById('loading') as HTMLElement;
const noMoreEl = document.getElementById('noMore') as HTMLElement;
const tagList = document.getElementById('tagList') as HTMLElement;
const searchInput = document.getElementById('searchInput') as HTMLInputElement;
const filterBar = document.getElementById('filterBar') as HTMLElement;
const filterHeader = document.getElementById('filterHeader') as HTMLElement;

function getResponsiveColumns(): number {
  const width = window.innerWidth;
  if (width <= 768) return 2;
  if (width <= 1024) return 3;
  return 4;
}

function createCardElement(cardData: CardData): HTMLElement {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.id = cardData.id.toString();

  const isLiked = likedCards.has(cardData.id);

  card.innerHTML = `
    <div class="card-image-placeholder">${cardData.emoji}</div>
    <div class="card-body">
      <span class="card-tag">${cardData.tag}</span>
      <h3 class="card-title">${cardData.title}</h3>
      <p class="card-desc">${cardData.description}</p>
      <div class="card-footer">
        <span class="like-count">❤ <span class="like-number">${cardData.likes}</span></span>
        <button class="like-btn ${isLiked ? 'liked' : ''}" aria-label="点赞">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  const likeBtn = card.querySelector('.like-btn') as HTMLElement;
  const likeNumberEl = card.querySelector('.like-number') as HTMLElement;

  likeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleLike(cardData, likeBtn, likeNumberEl);
  });

  return card;
}

function handleLike(
  cardData: CardData,
  likeBtn: HTMLElement,
  likeNumberEl: HTMLElement
): void {
  const isLiked = likedCards.has(cardData.id);

  if (isLiked) {
    likedCards.delete(cardData.id);
    likeBtn.classList.remove('liked');
    cardData.likes -= 1;
  } else {
    likedCards.add(cardData.id);
    likeBtn.classList.add('liked');
    cardData.likes += 1;
  }

  likeButtonAnimate(likeBtn);
  likeCountAnimate(likeNumberEl, cardData.likes);
}

function loadMoreCards(): void {
  if (isLoading || loadedCount >= filteredCards.length) {
    return;
  }

  isLoading = true;
  loadingEl.style.display = 'block';

  setTimeout(() => {
    const batch = filteredCards.slice(loadedCount, loadedCount + BATCH_SIZE);
    const newCardElements: HTMLElement[] = [];

    batch.forEach((cardData) => {
      const cardEl = createCardElement(cardData);
      container.appendChild(cardEl);
      newCardElements.push(cardEl);
      cardElements.push(cardEl);
    });

    waterfallAppendCards(container, newCardElements);
    fadeInElements(newCardElements, 400, 80);

    loadedCount += batch.length;
    isLoading = false;
    loadingEl.style.display = 'none';

    if (loadedCount >= filteredCards.length) {
      noMoreEl.style.display = 'block';
    }
  }, 300);
}

function renderAllCards(): void {
  container.innerHTML = '';
  cardElements = [];
  loadedCount = 0;
  noMoreEl.style.display = 'none';

  const columns = getResponsiveColumns();
  initWaterfall(container, columns);

  loadMoreCards();
}

function handleScroll(): void {
  const now = Date.now();
  if (now - lastScrollTime < SCROLL_THROTTLE) {
    return;
  }
  lastScrollTime = now;

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const scrollHeight = document.documentElement.scrollHeight;

  if (scrollTop + windowHeight >= scrollHeight - LOAD_THRESHOLD) {
    loadMoreCards();
  }
}

function handleTagClick(event: Event): void {
  const target = event.target as HTMLElement;
  if (!target.classList.contains('tag-btn')) return;

  const tag = target.dataset.tag || 'all';
  if (tag === currentTag) return;

  tagList.querySelectorAll('.tag-btn').forEach((btn) => {
    btn.classList.remove('active');
  });
  target.classList.add('active');

  currentTag = tag;
  updateFilteredCards();
}

function handleSearch(): void {
  const keyword = searchInput.value.trim();
  if (keyword === currentKeyword) return;

  currentKeyword = keyword;
  updateFilteredCards();
}

function updateFilteredCards(): void {
  filteredCards = filterCards(allCards, currentTag, currentKeyword);
  renderAllCards();
}

function handleResize(): void {
  const columns = getResponsiveColumns();
  reflow(container, cardElements, columns);
}

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function handleSearchInput(): void {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  searchDebounceTimer = setTimeout(() => {
    handleSearch();
  }, 300);
}

function toggleFilterBar(): void {
  filterBar.classList.toggle('collapsed');
}

function init(): void {
  allCards = generateCards(50);
  filteredCards = [...allCards];

  const columns = getResponsiveColumns();
  initWaterfall(container, columns);

  tagList.addEventListener('click', handleTagClick);
  searchInput.addEventListener('input', handleSearchInput);
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize);

  if (filterHeader) {
    filterHeader.addEventListener('click', toggleFilterBar);
  }

  if (window.innerWidth <= 768) {
    filterBar.classList.add('collapsed');
  }

  renderAllCards();
}

init();
