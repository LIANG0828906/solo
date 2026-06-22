const bookmarks = [
  {
    id: '1',
    title: 'React 官方文档 - 深入理解 Hooks',
    url: 'https://react.dev/learn/hooks',
    summary: 'React Hooks 是让你在函数组件中使用 state 和其他 React 特性的函数。本文档深入讲解了 useState、useEffect 等核心 Hooks 的用法和最佳实践。',
    tags: ['编程', 'React', '前端'],
    favicon: 'https://react.dev/favicon.ico',
    notes: '重点学习 useEffect 的依赖数组和 useCallback 的使用场景。'
  },
  {
    id: '2',
    title: 'TypeScript 高级类型详解',
    url: 'https://www.typescriptlang.org/docs/',
    summary: '深入理解 TypeScript 的高级类型系统，包括条件类型、映射类型、模板字面量类型等进阶特性，提升代码类型安全性。',
    tags: ['编程', 'TypeScript', '前端'],
    favicon: 'https://www.typescriptlang.org/favicon-32x32.png',
    notes: '条件类型和 infer 关键字是难点，需要多练习。'
  },
  {
    id: '3',
    title: '设计系统入门指南',
    url: 'https://www.designsystems.com/',
    summary: '从零开始构建一套完整的设计系统，包括设计原则、组件库、设计令牌等核心概念，帮助团队提升设计一致性和开发效率。',
    tags: ['设计', 'UI/UX', '产品'],
    favicon: 'https://www.designsystems.com/favicon.ico',
    notes: '设计令牌是设计系统的基石，需要和前端开发配合好。'
  },
  {
    id: '4',
    title: 'CSS Grid 完全指南',
    url: 'https://css-tricks.com/snippets/css/complete-guide-grid/',
    summary: 'CSS Grid 是最强大的二维布局系统。本指南涵盖了所有 Grid 属性和用法，从基础到高级布局技巧一网打尽。',
    tags: ['编程', 'CSS', '前端'],
    favicon: 'https://css-tricks.com/favicon.ico',
    notes: 'grid-template-areas 非常适合做整体布局。'
  },
  {
    id: '5',
    title: '深度工作：如何有效使用每一点脑力',
    url: 'https://book.douban.com/subject/26976455/',
    summary: '在这个信息爆炸的时代，深度工作能力变得越来越稀缺和有价值。本书教你如何培养专注能力，在短时间内完成高质量的工作。',
    tags: ['效率', '阅读', '生活'],
    favicon: 'https://img9.doubanio.com/favicon.ico',
    notes: '每天至少安排2小时的深度工作时间。'
  },
  {
    id: '6',
    title: 'Node.js 性能优化实战',
    url: 'https://nodejs.org/en/docs/',
    summary: '从事件循环机制到内存管理，从集群部署到缓存策略，全面解析 Node.js 性能优化的各个方面，打造高性能后端服务。',
    tags: ['编程', 'Node.js', '后端'],
    favicon: 'https://nodejs.org/favicon.ico',
    notes: '事件循环的六个阶段需要理解清楚。'
  },
  {
    id: '7',
    title: 'Figma 高效设计技巧',
    url: 'https://www.figma.com/resources/',
    summary: '掌握 Figma 的高级功能和快捷键，包括组件库管理、自动布局、变体设计等，让你的设计工作事半功倍。',
    tags: ['设计', '工具', '效率'],
    favicon: 'https://static.figma.com/app/icon/1/favicon.png',
    notes: 'Auto Layout 是 Figma 最强大的功能之一。'
  },
  {
    id: '8',
    title: '原子习惯：如何养成好习惯并戒除坏习惯',
    url: 'https://book.douban.com/subject/30333919/',
    summary: '习惯决定命运。本书提供了一套实用的方法，通过微小的改变逐步培养良好的习惯，最终实现人生的蜕变。',
    tags: ['阅读', '生活', '效率'],
    favicon: 'https://img9.doubanio.com/favicon.ico',
    notes: '习惯叠加和环境设计是两个非常实用的技巧。'
  },
  {
    id: '9',
    title: 'GraphQL 入门与实践',
    url: 'https://graphql.org/learn/',
    summary: 'GraphQL 是一种用于 API 的查询语言。学习如何设计 Schema、编写 Resolver，以及在前后端项目中应用 GraphQL。',
    tags: ['编程', '后端', 'API'],
    favicon: 'https://graphql.org/favicon.ico',
    notes: '相比 REST，GraphQL 更灵活但也更复杂。'
  },
  {
    id: '10',
    title: '用户体验设计的100个知识点',
    url: 'https://www.nngroup.com/articles/',
    summary: 'Nielsen Norman Group 的用户体验研究文章集合，涵盖可用性测试、交互设计、信息架构等UX核心领域。',
    tags: ['设计', 'UI/UX', '产品'],
    favicon: 'https://www.nngroup.com/favicon.ico',
    notes: 'Jakob Nielsen 的10条可用性启发式原则是基础。'
  },
  {
    id: '11',
    title: 'Docker 容器化部署指南',
    url: 'https://docs.docker.com/',
    summary: '从零开始学习 Docker，掌握镜像构建、容器编排、网络配置等核心技能，让应用部署变得简单可靠。',
    tags: ['编程', 'DevOps', '后端'],
    favicon: 'https://www.docker.com/favicon.ico',
    notes: 'Dockerfile 的多阶段构建很重要。'
  },
  {
    id: '12',
    title: '配色设计原理与实践',
    url: 'https://www.smashingmagazine.com/category/design/',
    summary: '深入了解色彩理论，学习如何搭配出和谐美观的配色方案。从色环到色彩心理学，全方位提升配色能力。',
    tags: ['设计', 'UI/UX', '创意'],
    favicon: 'https://www.smashingmagazine.com/favicon.ico',
    notes: '60-30-10 原则是配色的黄金法则。'
  },
  {
    id: '13',
    title: 'JavaScript 异步编程精讲',
    url: 'https://javascript.info/async',
    summary: '从回调函数到 Promise，再到 async/await，系统讲解 JavaScript 异步编程的演进历程和最佳实践。',
    tags: ['编程', 'JavaScript', '前端'],
    favicon: 'https://javascript.info/favicon.ico',
    notes: 'Promise.all 和 Promise.race 的区别要记清楚。'
  },
  {
    id: '14',
    title: '产品经理必备技能清单',
    url: 'https://www.productschool.com/blog/',
    summary: '全面介绍产品经理需要掌握的核心技能，包括需求分析、产品规划、用户研究、数据驱动等。',
    tags: ['产品', '职业发展', '效率'],
    favicon: 'https://www.productschool.com/favicon.ico',
    notes: '好的产品经理要懂技术、懂用户、懂商业。'
  },
  {
    id: '15',
    title: '极简主义生活方式指南',
    url: 'https://www.theminimalists.com/',
    summary: '在物质过剩的时代，极简主义提供了另一种生活可能。学习如何通过断舍离，找到真正重要的东西。',
    tags: ['生活', '阅读', '创意'],
    favicon: 'https://www.theminimalists.com/favicon.ico',
    notes: '少即是多。专注在真正重要的事情上。'
  },
  {
    id: '16',
    title: 'Vue 3 Composition API 完全指南',
    url: 'https://vuejs.org/guide/',
    summary: 'Vue 3 的 Composition API 提供了更灵活的代码组织方式。深入学习 setup、ref、reactive 等核心概念。',
    tags: ['编程', 'Vue', '前端'],
    favicon: 'https://vuejs.org/logo.svg',
    notes: 'ref 和 reactive 的选择取决于使用场景。'
  },
  {
    id: '17',
    title: '数据可视化设计原则',
    url: 'https://www.informationisbeautiful.net/',
    summary: '好的数据可视化不仅要准确传达信息，还要美观引人入胜。学习图表选择、配色、排版等可视化设计技巧。',
    tags: ['设计', '数据', '创意'],
    favicon: 'https://www.informationisbeautiful.net/favicon.ico',
    notes: '选择正确的图表类型是第一步。'
  },
  {
    id: '18',
    title: '时间管理的5个高效方法',
    url: 'https://www.lifehack.org/articles/productivity/',
    summary: '时间是最公平的资源。学习番茄工作法、时间块、GTD 等时间管理方法，找到最适合自己的效率提升方案。',
    tags: ['效率', '生活', '职业发展'],
    favicon: 'https://www.lifehack.org/favicon.ico',
    notes: '时间管理的本质是精力管理。'
  },
  {
    id: '19',
    title: 'Web 性能优化完全手册',
    url: 'https://web.dev/',
    summary: '从加载性能到运行时性能，全面解析 Web 性能优化的各种技巧。包括图片优化、代码分割、缓存策略等。',
    tags: ['编程', '前端', '性能'],
    favicon: 'https://web.dev/images/favicon.ico',
    notes: 'Core Web Vitals 是性能优化的重要指标。'
  },
  {
    id: '20',
    title: '从零开始学摄影构图',
    url: 'https://digital-photography-school.com/',
    summary: '构图是摄影的灵魂。学习三分法、引导线、对称、框架等构图技巧，让你的照片更有视觉冲击力。',
    tags: ['创意', '生活', '设计'],
    favicon: 'https://digital-photography-school.com/favicon.ico',
    notes: '规则是用来打破的，但首先要掌握规则。'
  }
];

export default bookmarks;
