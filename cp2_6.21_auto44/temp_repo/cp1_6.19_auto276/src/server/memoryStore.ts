export interface User {
  id: number;
  email: string;
  password: string;
  username: string;
  created_at: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  subject: string;
  price: number;
  cover_url: string | null;
  user_id: number;
  status: 'available' | 'exchanging' | 'completed';
  created_at: string;
}

export interface Exchange {
  id: number;
  book_id: number;
  requester_id: number;
  owner_id: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
}

export interface Note {
  id: number;
  title: string;
  subject: string;
  target_amount: number;
  current_amount: number;
  creator_id: number;
  created_at: string;
}

export interface NoteSection {
  id: number;
  note_id: number;
  section_title: string;
  content: string;
  position: number;
}

export interface NotePledge {
  id: number;
  note_id: number;
  user_id: number;
  amount: number;
  created_at: string;
}

export interface NoteRating {
  id: number;
  note_id: number;
  user_id: number;
  rating: number;
  created_at: string;
}

const now = () => new Date().toISOString();

export const store = {
  users: [] as User[],
  books: [
    { id: 1, title: '高等数学（第七版）上册', author: '同济大学数学系', subject: '数学', price: 25, cover_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=360&h=480&fit=crop', user_id: 1, status: 'available', created_at: now() },
    { id: 2, title: '物理学原理（第十版）', author: 'David Halliday', subject: '物理', price: 45, cover_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=360&h=480&fit=crop', user_id: 1, status: 'available', created_at: now() },
    { id: 3, title: '算法导论（第三版）', author: 'Thomas H. Cormen', subject: '计算机', price: 68, cover_url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=360&h=480&fit=crop', user_id: 2, status: 'available', created_at: now() },
    { id: 4, title: '普通化学原理', author: '华彤文', subject: '化学', price: 30, cover_url: 'https://images.unsplash.com/photo-1596464716080-37e635822a42?w=360&h=480&fit=crop', user_id: 2, status: 'available', created_at: now() },
    { id: 5, title: '中国古代文学史', author: '袁行霈', subject: '文学', price: 35, cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=360&h=480&fit=crop', user_id: 1, status: 'exchanging', created_at: now() },
    { id: 6, title: '西方哲学史', author: '赵敦华', subject: '哲学', price: 28, cover_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=360&h=480&fit=crop', user_id: 2, status: 'available', created_at: now() },
  ] as Book[],
  exchanges: [] as Exchange[],
  notes: [
    { id: 1, title: '考研数学高分笔记', subject: '数学', target_amount: 200, current_amount: 150, creator_id: 1, created_at: now() },
    { id: 2, title: '数据结构重点整理', subject: '计算机', target_amount: 100, current_amount: 100, creator_id: 2, created_at: now() },
    { id: 3, title: '大学英语四级核心词汇', subject: '语言', target_amount: 150, current_amount: 60, creator_id: 1, created_at: now() },
  ] as Note[],
  noteSections: [
    { id: 1, note_id: 1, section_title: '第一章 函数与极限', content: '函数是高等数学研究的基本对象。本章首先复习函数的概念和性质，包括函数的定义域、值域、奇偶性、单调性、周期性等。然后重点讨论数列极限和函数极限的定义、性质以及运算法则。极限概念是微积分的基础，理解ε-δ定义对于后续学习至关重要。两个重要极限：lim(x→0) sinx/x = 1和lim(x→∞) (1+1/x)^x = e需要熟练掌握。无穷小与无穷大的概念及其比较也是常考内容，等价无穷小替换在求极限时非常有用。最后介绍函数连续性的概念、间断点的分类以及闭区间上连续函数的性质，包括最值定理、介值定理和零点定理。', position: 1 },
    { id: 2, note_id: 1, section_title: '第二章 导数与微分', content: '导数描述函数在某一点的瞬时变化率，几何上表示曲线切线的斜率。导数的定义通过极限给出，需要掌握用定义求导的方法。基本初等函数的导数公式和导数的四则运算法则是求导的基础。复合函数求导的链式法则是重点也是难点，需要多加练习。隐函数求导和参数方程求导有各自的方法特点。高阶导数概念及莱布尼茨公式用于求乘积的n阶导数。微分是函数增量的线性近似，dy = f\'(x)dx，微分形式不变性在计算中有应用。中值定理（罗尔定理、拉格朗日中值定理、柯西中值定理）是导数应用的理论基础，常用于证明等式和不等式。洛必达法则是求不定式极限的有力工具，但要注意其适用条件。', position: 2 },
    { id: 3, note_id: 1, section_title: '第三章 不定积分', content: '不定积分是求导运算的逆运算，即已知导函数求原函数。基本积分表需要熟记，它是计算不定积分的基础。换元积分法分为第一类换元法（凑微分法）和第二类换元法。第一类换元法通过将被积表达式凑成某个函数的微分形式来简化积分，常见的凑微分形式需要积累经验。第二类换元法通过变量代换消去根号等复杂项，常用三角代换、倒代换等。分部积分法适用于被积函数是两个不同类型函数乘积的情况，公式为∫udv = uv - ∫vdu，选择u和dv的顺序通常遵循"反对幂指三"原则。有理函数的积分可以先将其分解为部分分式之和，然后分别积分。三角函数有理式的积分可通过万能代换转化为有理函数积分。', position: 3 },
    { id: 4, note_id: 2, section_title: '线性表', content: '线性表是最简单也是最常用的一种数据结构。一个线性表是n个数据元素的有限序列。线性表的两种基本存储结构是顺序存储和链式存储。顺序表使用数组实现，支持随机访问，时间复杂度O(1)，但插入和删除需要移动元素，平均时间复杂度O(n)。链表通过指针将结点链接起来，每个结点包含数据域和指针域。单链表只能从头结点开始顺序访问，插入和删除只需修改指针，时间复杂度O(1)（已知前驱），但查找需要O(n)。双向链表每个结点有前驱和后继两个指针，可以双向遍历。循环链表的尾结点指针指向头结点，形成环形结构。静态链表使用数组模拟链表，通过游标实现指针功能。', position: 1 },
    { id: 5, note_id: 2, section_title: '栈和队列', content: '栈和队列是两种重要的线性结构，它们的操作受到限制。栈是后进先出（LIFO）的线性表，只允许在表尾（栈顶）进行插入和删除操作。栈的应用包括括号匹配、表达式求值、递归实现、深度优先搜索等。队列是先进先出（FIFO）的线性表，只允许在表尾插入（入队）、在表头删除（出队）。队列的应用包括广度优先搜索、缓冲区管理、任务调度等。循环队列可以解决顺序队列的假溢出问题，通过取模运算实现队尾指针的循环。双端队列（Deque）允许在两端进行插入和删除操作，兼具栈和队列的特性。优先队列每次出队的是优先级最高的元素，通常用堆实现。', position: 2 },
    { id: 6, note_id: 3, section_title: '核心词汇列表（一）', content: 'abandon v.放弃，抛弃；abnormal a.反常的，异常的；absorb v.吸收，吸引；abstract a.抽象的 n.摘要；abundant a.丰富的，充裕的；accomplish v.完成，实现；accurate a.准确的，精确的；acknowledge v.承认，致谢；acquire v.获得，习得；adapt v.适应，改编；adequate a.足够的，适当的；adjust v.调整，调节；admire v.钦佩，赞赏；adopt v.采用，收养；advance v./n.前进，进步；advantage n.优势，有利条件；adventure n.冒险，奇遇；advertise v.做广告；advocate v.提倡，拥护；affect v.影响，感动；afford v.负担得起；aggressive a.侵略的，好斗的；agriculture n.农业；alternative a./n.供选择的；ambitious a.有雄心的。这些词汇在四级考试中出现频率较高，建议结合例句记忆。', position: 1 },
  ] as NoteSection[],
  notePledges: [] as NotePledge[],
  noteRatings: [] as NoteRating[],
  nextId: {
    users: 3,
    books: 7,
    exchanges: 1,
    notes: 4,
    noteSections: 7,
    notePledges: 1,
    noteRatings: 1,
  },
};

store.users = [
  { id: 1, email: 'demo1@campus.edu', password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', username: '张同学', created_at: now() },
  { id: 2, email: 'demo2@campus.edu', password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', username: '李同学', created_at: now() },
];
