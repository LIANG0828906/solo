export interface SampleArticle {
  id: string;
  title: string;
  h1: string;
  h2: string;
  h3: string;
  paragraphs: string[];
  blockquote: string;
}

export const sampleArticles: SampleArticle[] = [
  {
    id: 'article-1',
    title: '设计美学',
    h1: '排版的艺术与科学',
    h2: '为什么字体选择如此重要',
    h3: '字号层级的构建原则',
    paragraphs: [
      '排版设计是视觉传达的核心要素之一，它不仅仅是将文字排列在页面上，更是一种传达信息、情感和品牌调性的艺术形式。优秀的排版能够引导读者的视线，创造节奏感，提升阅读体验。',
      '字体选择是排版设计的第一步。不同的字体承载着不同的性格和情感：衬线字体传递出传统、优雅和权威感，无衬线字体则代表现代、简洁和亲和力。标题字体与正文字体的搭配，需要在对比与和谐之间找到微妙的平衡点。',
      '字号层级是建立信息架构的关键。一个清晰的层级结构能够帮助读者快速理解内容的组织方式，区分标题、副标题和正文的重要性。通常我们建议使用1.25到1.5的比例因子来构建字号系统，确保每个层级之间有足够的视觉差异。',
    ],
    blockquote: '好的排版应该是隐形的，读者在享受阅读的同时，不会注意到排版本身的存在。',
  },
  {
    id: 'article-2',
    title: '技术展望',
    h1: 'Web排版的未来趋势',
    h2: '可变字体与响应式设计',
    h3: '性能优化的最佳实践',
    paragraphs: [
      '随着Web技术的不断演进，网页排版正在经历一场深刻的变革。可变字体技术的普及使得设计师能够在一个字体文件中访问无限的字重和样式变化，为创意表达提供了前所未有的可能性。',
      '响应式排版不再是简单地根据屏幕尺寸调整字号大小，而是需要考虑阅读距离、设备特性和用户偏好等多个维度。CSS的clamp()函数和容器查询技术让我们能够创建更加智能和自适应的排版系统。',
      '性能是Web排版中不可忽视的一环。字体文件的大小直接影响页面加载速度和用户体验。使用font-display: swap策略、子集化字体、以及合理的预加载策略，都是确保快速渲染的关键技术手段。',
    ],
    blockquote: '设计的本质不是让事物看起来更漂亮，而是让事物工作得更好。',
  },
  {
    id: 'article-3',
    title: '实践指南',
    h1: '构建可维护的排版系统',
    h2: '设计token的力量',
    h3: '从原型到生产的工作流',
    paragraphs: [
      '一套成熟的排版系统不仅仅是一组字体大小的集合，而是包括字体家族、字号、字重、行高、字间距、段间距等多个维度参数的完整规范。建立这样的系统需要在灵活性和一致性之间做出审慎的权衡。',
      '设计Token是连接设计和开发的桥梁。通过将排版参数抽象为可复用的变量，我们可以确保从设计工具到代码实现的一致性。CSS自定义属性让这些token在运行时也能被动态调整，为主题切换和个性化定制打开了大门。',
      '一个高效的排版工作流应该包括：建立设计规范、创建组件库、编写文档、以及持续的设计评审。当设计和开发使用同一种语言沟通时，迭代速度将显著提升，而产品的用户体验也会更加统一和精致。',
    ],
    blockquote: '任何傻瓜都能做出复杂的东西，只有天才才能做出简单的东西。',
  },
];

export interface PresetTemplate {
  id: string;
  name: string;
  shortName: string;
  params: Partial<{
    headingFont: string;
    bodyFont: string;
    h1Size: number;
    h2Size: number;
    h3Size: number;
    bodySize: number;
    h1LineHeight: number;
    h2LineHeight: number;
    h3LineHeight: number;
    bodyLineHeight: number;
    h1LetterSpacing: number;
    h2LetterSpacing: number;
    h3LetterSpacing: number;
    bodyLetterSpacing: number;
    paragraphSpacing: number;
    headingSpacing: number;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    textColor: string;
    headingColor: string;
    quoteStyle: 'modern' | 'classic' | 'minimal';
    linkColor: string;
  }>;
}

export const presetTemplates: PresetTemplate[] = [
  {
    id: 'magazine',
    name: '杂志风',
    shortName: '杂志',
    params: {
      headingFont: 'Playfair Display',
      bodyFont: 'Georgia',
      h1Size: 48,
      h2Size: 32,
      h3Size: 22,
      bodySize: 17,
      h1LineHeight: 1.15,
      h2LineHeight: 1.25,
      h3LineHeight: 1.35,
      bodyLineHeight: 1.7,
      h1LetterSpacing: -1,
      h2LetterSpacing: -0.5,
      h3LetterSpacing: 0,
      bodyLetterSpacing: 0,
      paragraphSpacing: 20,
      headingSpacing: 28,
      textColor: '#1A1A1A',
      headingColor: '#0A0A0A',
      quoteStyle: 'classic',
      linkColor: '#C41E3A',
    },
  },
  {
    id: 'minimal',
    name: '极简风',
    shortName: '极简',
    params: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      h1Size: 40,
      h2Size: 28,
      h3Size: 20,
      bodySize: 16,
      h1LineHeight: 1.2,
      h2LineHeight: 1.3,
      h3LineHeight: 1.4,
      bodyLineHeight: 1.75,
      h1LetterSpacing: -0.8,
      h2LetterSpacing: -0.3,
      h3LetterSpacing: 0,
      bodyLetterSpacing: 0.2,
      paragraphSpacing: 24,
      headingSpacing: 32,
      textColor: '#222222',
      headingColor: '#111111',
      quoteStyle: 'minimal',
      linkColor: '#0066CC',
    },
  },
  {
    id: 'tech',
    name: '科技风',
    shortName: '科技',
    params: {
      headingFont: 'Montserrat',
      bodyFont: 'Roboto',
      h1Size: 44,
      h2Size: 30,
      h3Size: 21,
      bodySize: 15,
      h1LineHeight: 1.1,
      h2LineHeight: 1.2,
      h3LineHeight: 1.3,
      bodyLineHeight: 1.65,
      h1LetterSpacing: 0.5,
      h2LetterSpacing: 0.3,
      h3LetterSpacing: 0.2,
      bodyLetterSpacing: 0.1,
      paragraphSpacing: 18,
      headingSpacing: 24,
      textColor: '#2D3748',
      headingColor: '#1A365D',
      quoteStyle: 'modern',
      linkColor: '#3182CE',
    },
  },
  {
    id: 'editorial',
    name: '编辑风',
    shortName: '编辑',
    params: {
      headingFont: 'Lora',
      bodyFont: 'Merriweather',
      h1Size: 42,
      h2Size: 28,
      h3Size: 20,
      bodySize: 18,
      h1LineHeight: 1.2,
      h2LineHeight: 1.3,
      h3LineHeight: 1.4,
      bodyLineHeight: 1.8,
      h1LetterSpacing: -0.5,
      h2LetterSpacing: -0.2,
      h3LetterSpacing: 0,
      bodyLetterSpacing: -0.1,
      paragraphSpacing: 28,
      headingSpacing: 36,
      textColor: '#2C2C2C',
      headingColor: '#1A1A1A',
      quoteStyle: 'classic',
      linkColor: '#8B4513',
    },
  },
  {
    id: 'code',
    name: '代码风',
    shortName: '代码',
    params: {
      headingFont: 'Poppins',
      bodyFont: 'system-ui',
      h1Size: 38,
      h2Size: 26,
      h3Size: 19,
      bodySize: 15,
      h1LineHeight: 1.25,
      h2LineHeight: 1.35,
      h3LineHeight: 1.45,
      bodyLineHeight: 1.7,
      h1LetterSpacing: -0.3,
      h2LetterSpacing: 0,
      h3LetterSpacing: 0,
      bodyLetterSpacing: 0,
      paragraphSpacing: 20,
      headingSpacing: 28,
      textColor: '#24292E',
      headingColor: '#0366D6',
      quoteStyle: 'modern',
      linkColor: '#0366D6',
    },
  },
];
