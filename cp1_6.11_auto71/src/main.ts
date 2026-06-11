import { Gallery } from './gallery';

const SAMPLE_URLS = [
  'https://github.com',
  'https://www.wikipedia.org',
  'https://developer.mozilla.org',
  'https://codepen.io',
  'https://dribbble.com',
  'https://www.behance.net',
  'https://www.figma.com',
  'https://stackoverflow.com',
  'https://www.producthunt.com',
  'https://news.ycombinator.com',
  'https://www.reddit.com',
  'https://medium.com'
];

function init(): void {
  const container = document.getElementById('gallery-container')!;
  const stage = document.getElementById('gallery-stage')!;
  const input = document.getElementById('url-input') as HTMLInputElement;
  const addBtn = document.getElementById('add-btn')!;
  const loader = document.getElementById('loader')!;

  const gallery = new Gallery(container, stage);

  const addCardFromInput = (): void => {
    const val = input.value.trim();
    if (!val) {
      const randomUrl = SAMPLE_URLS[Math.floor(Math.random() * SAMPLE_URLS.length)];
      gallery.addCard(randomUrl);
    } else {
      gallery.addCard(val);
    }
    input.value = '';
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCardFromInput();
    }
  });

  addBtn.addEventListener('click', () => {
    addCardFromInput();
  });

  SAMPLE_URLS.slice(0, 8).forEach((url, i) => {
    setTimeout(() => {
      gallery.addCard(url);
    }, i * 120);
  });

  gallery.start();

  setTimeout(() => {
    loader.classList.add('hidden');
  }, 600);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
