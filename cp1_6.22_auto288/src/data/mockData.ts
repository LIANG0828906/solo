import type { Folder, Article } from '../types';

export const folders: Folder[] = [
  { id: 'all', name: '全部文章', parentId: null, expanded: true },
  { id: 'tech', name: '技术前沿', parentId: 'all', expanded: true },
  { id: 'product', name: '产品思考', parentId: 'all', expanded: true },
  { id: 'life', name: '生活随笔', parentId: 'all', expanded: false },
  { id: 'business', name: '商业洞察', parentId: 'all', expanded: false },
  { id: 'reading', name: '深度阅读', parentId: 'all', expanded: false },
];

const sources = [
  { name: '阮一峰的网络日志', icon: 'https://www.ruanyifeng.com/blog/images/person2_s.jpg' },
  { name: '少数派', icon: 'https://cdn.sspai.com/sspai/assets/img/logo.png' },
  { name: 'InfoQ', icon: 'https://static001.infoq.cn/resource/image/50/3f/50b133d6b3f3c8e0b1a4e3d3c3b8c83f.png' },
  { name: '掘金', icon: 'https://lf3-cdn-tos.bytescm.com/obj/static/xitu_juejin_web/static/favicons/favicon-32x32.png' },
  { name: 'Medium', icon: 'https://cdn-static-1.medium.com/_/fp/icons/Medium-Avatar-500x500.svg' },
  { name: '知乎', icon: 'https://static.zhihu.com/heifetz/favicon.ico' },
  { name: '36氪', icon: 'https://36kr.com/favicon.ico' },
  { name: '虎嗅', icon: 'https://www.huxiu.com/favicon.ico' },
];

const tagPool = ['前端', '后端', '人工智能', '产品设计', '用户体验', '效率工具', '个人成长', '商业模式', '数据分析', '机器学习'];

const noteTemplates = [
  '这篇文章观点很新颖，值得反复阅读。核心论点清晰，案例分析到位。',
  '作者的思考角度独特，特别是关于技术演进的论述让我受益匪浅。',
  '文中提到的方法论可以直接应用到工作中，是一篇实操性很强的文章。',
  '深度好文，建议收藏后慢慢品读。参考文献部分也很有价值。',
  '读完后对这个领域有了更系统的理解，推荐给同样感兴趣的朋友。',
  '文章结构严谨，论证充分，开头的问题引入非常吸引人。',
  '与我之前的想法不谋而合，但作者的分析更加深入透彻。',
  '有几个观点我持保留意见，但整体而言是一篇优质内容。',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomTags(): string[] {
  const count = 2 + Math.floor(Math.random() * 3);
  const shuffled = [...tagPool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateArticlesForFolder(folderId: string, baseIndex: number, titles: string[], summaries: string[]): Article[] {
  return titles.map((title, i) => {
    const source = pickRandom(sources);
    const date = new Date(2024, 0, 1);
    date.setDate(date.getDate() + Math.floor(Math.random() * 180));
    return {
      id: `${folderId}-${i + 1}`,
      folderId,
      title,
      source: source.name,
      summary: summaries[i],
      iconUrl: source.icon,
      note: pickRandom(noteTemplates),
      tags: pickRandomTags(),
      rating: Math.floor(Math.random() * 6),
      starred: Math.random() > 0.6,
      createdAt: date.toISOString(),
    };
  });
}

const techTitles = [
  'React 19 新特性深度解析：从并发模式到服务器组件',
  'TypeScript 5.4 类型体操进阶：高阶类型的艺术',
  'WebAssembly 实战：在浏览器中运行高性能计算',
  '微前端架构实践：从零搭建企业级应用框架',
  '深入理解 Vite 编译原理：ESM 时代的构建革新',
  'Rust 前端应用：Web 系统编程的新边界',
  'GraphQL vs REST：2024 年 API 设计选型指南',
  '前端监控体系建设：从埋点到异常告警全链路',
  'Service Worker 深度：构建离线可用的 PWA 应用',
  'CSS Container Queries：响应式布局的未来',
];

const techSummaries = [
  '本文深入探讨 React 19 带来的革命性变化，包括 use() Hook、Actions、useOptimistic 等新特性的实际应用场景和性能影响分析。',
  '通过实战案例讲解 TypeScript 中条件类型、映射类型、模板字面量类型的高级用法，帮助你写出更加类型安全的代码。',
  '从零开始学习 WebAssembly，包括 Emscripten 工具链使用、内存模型解析、与 JavaScript 交互最佳实践等核心概念。',
  '分享在大型企业中落地微前端架构的经验教训，涵盖模块联邦、沙箱隔离、样式方案、通信机制等关键技术选型。',
  '剖析 Vite 内部工作原理，对比 Webpack 构建差异，解析预构建、HMR、Rollup 插件兼容等核心机制实现细节。',
  '介绍使用 Rust + WebAssembly 开发前端高性能应用的完整流程，包括 wasm-bindgen、wasm-pack 等工具链使用指南。',
  '全面对比 GraphQL 与 REST 在现代 Web 应用中的优劣势，从类型安全、缓存策略、性能开销等多个维度进行深度分析。',
  '详解前端监控系统的设计与实现，包括性能指标采集、JS 异常捕获、用户行为追踪、数据可视化展示等模块。',
  '深入 Service Worker 生命周期管理，讲解缓存策略、后台同步、推送通知等高级特性，构建真正可用的离线应用。',
  'CSS 容器查询带来了组件级响应式的新范式，本文通过多个实际案例展示如何使用这一新特性构建更灵活的 UI。',
];

const productTitles = [
  '产品经理的第一性原理：回归用户价值本质',
  'B端产品设计方法论：复杂系统的简化艺术',
  '用户增长模型：从 AARRR 到 RARRA 的演进',
  '产品需求文档（PRD）写作规范与最佳实践',
  'Design System 建设：设计与研发的协作桥梁',
  '竞品分析方法论：如何从竞争对手身上学习',
  '用户访谈技巧：挖掘真实需求的提问艺术',
  '数据驱动决策：产品指标体系构建指南',
  'MVP 开发策略：快速验证产品假设的艺术',
  '产品 roadmap 规划：平衡短期目标与长期愿景',
];

const productSummaries = [
  '如何在纷繁复杂的需求中保持清醒？第一性原理思维帮助产品经理回归本质，聚焦真正为用户创造价值的功能。',
  'B 端产品往往面临复杂的业务流程和多角色诉求，本文分享如何通过抽象建模和分层次设计化繁为简。',
  '传统的 AARRR 漏斗模型在存量时代面临挑战，RARRA 模型将留存放在首位，更适合当今的产品增长策略。',
  '一份好的 PRD 不仅是需求的载体，更是跨团队沟通的桥梁。本文详解 PRD 的结构、写作要点和常见误区。',
  '从 0 到 1 搭建企业级设计系统，包括组件库规范、设计 Token 管理、文档建设、版本演进等完整落地经验。',
  '竞品分析不是简单的功能对比，而是理解行业格局、发现差异化机会的系统方法论。',
  '用户说的往往不是他们真正想要的。如何通过巧妙的提问和行为观察，穿透表层挖掘真实的用户需求？',
  '构建一套科学的产品指标体系，从北极星指标到过程指标，帮助团队做出客观、可量化的决策。',
  '最小可行产品不是功能简陋的产品，而是用最少的成本验证最关键假设的实验。详解 MVP 的设计原则和常见陷阱。',
  '产品路线图是战略的可视化表达，如何在变化迅速的市场环境中，既保持方向感又保有灵活性？',
];

const lifeTitles = [
  '深度工作：如何在碎片化时代保持专注',
  '极简主义实践：物品减少后的生活变化',
  '早起习惯养成：我的 90 天实验报告',
  '数字断联一周：远离手机后的真实感受',
  '阅读方法升级：如何一年读完 100 本书',
  '健身入门指南：从零开始的可持续计划',
  '冥想初体验：每日 10 分钟带来的改变',
  '个人财务管理：极简记账法分享',
  '厨艺进阶：在家做出餐厅级菜品的秘诀',
  '旅行的意义：从走马观花到深度体验',
];

const lifeSummaries = [
  '在信息爆炸和多任务并行的时代，专注成为稀缺资源。分享卡尔·纽波特的深度工作理论和我的实践心得。',
  '断舍离不仅仅是整理物品，更是一种生活哲学。记录我践行极简主义一年来的心路历程和实际变化。',
  '早起不是目的，拥有一段不被打扰的时间才是。分享我从起床困难户到稳定 6 点起床的完整过程。',
  '刻意远离智能手机一周会发生什么？记录这场实验中我的焦虑、无聊、以及意外找回的平静。',
  '数量不是目的，但大量阅读确实能改变思维方式。分享精读、速读、主题阅读等多种方法的组合应用。',
  '健身最难的不是开始，而是坚持。分享一套对新手友好、对懒人友好、可以长期持续的健身方案。',
  '从科学角度解析冥想对大脑的改变，以及我作为初学者每天 10 分钟练习一个月后的真实体验。',
  '理财不是记账，记账是理财的开始。分享一套不耗时、不繁琐、真正能坚持下来的个人财务管理方法。',
  '不需要复杂的工具和高端的食材，掌握几个核心原理和技巧，在家也能做出媲美餐厅的美味佳肴。',
  '旅行不只是打卡拍照，更是理解另一种生活方式的契机。分享我从观光客到深度旅行者的转变过程。',
];

const businessTitles = [
  '订阅经济：从一次性交易到长期关系的商业模式变革',
  '平台战略经济学：双边市场的网络效应与护城河',
  'SaaS 创业公司的 Unit Economics 分析框架',
  '品牌溢价的本质：消费者为什么愿意为品牌买单',
  '数字化转型失败率高达 70% 的根本原因分析',
  '供应链金融：产业链中的隐形金矿',
  'Z 世代消费行为洞察：理解下一代消费者',
  '企业并购后的整合：1+1 如何大于 2',
  'ESG 投资：从理念到实践的价值重估',
  '跨境电商新趋势：DTC 品牌的全球化路径',
];

const businessSummaries = [
  '为什么订阅模式席卷全球？从 Netflix 到 Adobe，深入解析订阅经济的底层逻辑和设计关键要素。',
  '平台型企业如何从零开始冷启动？如何破解鸡生蛋问题？详解双边市场的策略和定价机制。',
  'LTV、CAC、MRR、Churn……这些 SaaS 核心指标如何相互关联？详解 SaaS 公司的单位经济模型。',
  '品牌不仅仅是 Logo 和广告。从认知心理学和神经科学角度，解析品牌溢价产生的深层机制。',
  '技术不是数字化转型的最大障碍，人和组织才是。深度剖析企业转型失败的共性原因和破局之道。',
  '中小微企业融资难问题如何通过供应链金融破局？详解应收账款融资、预付款融资等典型模式。',
  'Z 世代成长于移动互联网和社交媒体环境中，他们的消费理念和品牌偏好与前代人有本质差异。',
  '并购交易完成只是开始，整合才是价值创造的关键。分享企业并购后文化、业务、人才整合的最佳实践。',
  'ESG 不再是锦上添花，而是影响企业估值和融资能力的核心要素。详解 ESG 评级体系和投资逻辑。',
  '独立站、社交电商、本地支付……中国 DTC 品牌如何走出国门，在全球市场建立品牌影响力？',
];

const readingTitles = [
  '《人类简史》重读：从认知革命到科学革命的再思考',
  '《思考，快与慢》核心观点梳理：双系统理论如何影响决策',
  '《原则》精读：达利欧的生活与工作原则提炼',
  '《规模》读书笔记：复杂世界的简单法则',
  '《自私的基因》深度解读：进化论视角下的人性',
  '《黑天鹅》：如何应对不可预知的未来',
  '《枪炮、病菌与钢铁》：人类社会命运的地理决定论',
  '《反脆弱》：从不确定性中获益的哲学',
  '《穷查理宝典》：查理·芒格的多元思维模型',
  '《创新者的窘境》：为什么优秀企业会失败',
];

const readingSummaries = [
  '尤瓦尔·赫拉利的宏大写意令人震撼，但重读之后也发现了一些值得商榷的观点，分享我的新思考。',
  '卡尼曼的双系统理论是行为经济学的基石，本文系统性地梳理书中核心概念及其在现实中的应用。',
  '瑞·达利欧的 400 多条原则如何提取精华？精选最有价值的原则并分享我的应用心得。',
  '杰弗里·韦斯特用物理学视角解读生物、城市和公司的规模法则，一本改变世界观的精彩著作。',
  '道金斯的经典著作引发了无数争议，基因视角下的进化论是否会让我们对人性产生全新的理解？',
  '黑天鹅事件罕见但影响巨大，塔勒布教我们如何在这个充满不确定性的世界中生存和 prosper。',
  '贾雷德·戴蒙德的地理学解释框架挑战了种族优越论和文化决定论，提供了全新的人类史视角。',
  '脆弱的反面不是坚强，而是反脆弱。纳西姆·塔勒布的这一概念如何改变我们对待风险的态度？',
  '查理·芒格最推崇的多元思维模型有哪些？如何跨学科地构建自己的思维工具箱？',
  '克里斯坦森的破坏性创新理论解释了为什么行业领导者在技术变革中往往无法保持领先地位。',
];

export const articles: Article[] = [
  ...generateArticlesForFolder('tech', 0, techTitles, techSummaries),
  ...generateArticlesForFolder('product', 10, productTitles, productSummaries),
  ...generateArticlesForFolder('life', 20, lifeTitles, lifeSummaries),
  ...generateArticlesForFolder('business', 30, businessTitles, businessSummaries),
  ...generateArticlesForFolder('reading', 40, readingTitles, readingSummaries),
];
