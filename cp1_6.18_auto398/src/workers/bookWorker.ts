const ctx: Worker = self as any;

interface WorkerMessage {
  type: 'FETCH_METADATA' | 'CANCEL';
  payload?: any;
  id: string;
}

interface WorkerResponse {
  type: 'SUCCESS' | 'ERROR' | 'PROGRESS';
  payload?: any;
  id: string;
}

async function fetchBookMetadata(isbn: string): Promise<any> {
  ctx.postMessage({ type: 'PROGRESS', payload: { percent: 20, message: '正在查询ISBN...' }, id: 'fetch' });
  await new Promise((r) => setTimeout(r, 200));

  const covers = [
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop',
  ];
  const idx = Math.abs(isbn.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0)) % covers.length;

  const knownBooks: Record<string, any> = {
    '9787020002207': { title: '红楼梦', authors: ['曹雪芹', '高鹗'], desc: '中国古典四大名著之首，清代作家曹雪芹创作的章回体长篇小说。', pages: 1606 },
    '9787544270878': { title: '百年孤独', authors: ['加西亚·马尔克斯'], desc: '魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事。', pages: 360 },
    '9787532748167': { title: '追风筝的人', authors: ['卡勒德·胡赛尼'], desc: '关于友谊、背叛、救赎的动人故事。', pages: 362 },
    '9787544253994': { title: '小王子', authors: ['圣埃克苏佩里'], desc: '以一位飞行员作为故事叙述者，讲述了小王子的传奇历险。', pages: 97 },
    '9787020024759': { title: '活着', authors: ['余华'], desc: '讲述了农村人福贵悲惨的人生遭遇。', pages: 191 },
    '9787559600790': { title: '三体', authors: ['刘慈欣'], desc: '刘慈欣的科幻巨作，地球文明与三体文明的史诗碰撞。', pages: 302 },
  };

  ctx.postMessage({ type: 'PROGRESS', payload: { percent: 50, message: '正在解析书籍数据...' }, id: 'fetch' });
  await new Promise((r) => setTimeout(r, 300));

  const response = await fetch(`/api/books?isbn=${encodeURIComponent(isbn)}`);
  if (!response.ok) {
    throw new Error('API请求失败');
  }
  const apiData = await response.json();

  ctx.postMessage({ type: 'PROGRESS', payload: { percent: 80, message: '正在加载封面图...' }, id: 'fetch' });
  await new Promise((r) => setTimeout(r, 200));

  ctx.postMessage({ type: 'PROGRESS', payload: { percent: 100, message: '完成！' }, id: 'fetch' });
  return apiData;
}

ctx.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, id } = event.data;
  try {
    if (type === 'FETCH_METADATA') {
      const result = await fetchBookMetadata(payload.isbn);
      ctx.postMessage({ type: 'SUCCESS', payload: result, id });
    }
  } catch (err: any) {
    ctx.postMessage({ type: 'ERROR', payload: { message: err.message || '处理失败' }, id });
  }
});

export default ctx;
