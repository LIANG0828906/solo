export interface QA {
  id: string
  question: string
  answer: string
  createdAt: string
}

export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  qa: QA[]
}

const notes: Note[] = [
  {
    id: 'note-1',
    title: 'React Hooks 闭包陷阱与解决方案',
    content: '在使用 React Hooks 时，闭包陷阱是最常见的问题之一。当 useEffect 或 useCallback 的依赖数组不完整时，回调函数中捕获的 state 可能是过期的。典型场景：在 setInterval 中使用 setState，但回调中引用的 state 始终是初始值。解决方案包括：1. 使用 useRef 保存最新值；2. 使用函数式更新 setState(prev => ...)；3. 确保依赖数组完整。此外，useEffect 的清理函数也容易遗漏，导致内存泄漏。建议在开发时启用 eslint-plugin-react-hooks 的 exhaustive-deps 规则，它能在编译期捕获大部分闭包问题。',
    tags: ['React', 'Hooks'],
    createdAt: '2026-06-20T08:00:00.000Z',
    qa: [
      {
        id: 'qa-1-1',
        question: 'useRef 和函数式更新分别适合什么场景？',
        answer: 'useRef 适合在回调中读取最新值但不触发重渲染的场景；函数式更新适合只需要基于前一个状态计算新状态的场景。',
        createdAt: '2026-06-20T10:30:00.000Z',
      },
    ],
  },
  {
    id: 'note-2',
    title: 'TypeScript 条件类型与 infer 关键字实战',
    content: 'TypeScript 的条件类型（Conditional Types）配合 infer 关键字，可以实现强大的类型推导。基本语法：T extends U ? X : Y。infer 用于在条件类型中声明类型变量，例如提取函数返回值类型：type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never。常见应用场景：1. 提取 Promise 内部类型 type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T；2. 提取数组元素类型；3. 实现类型映射和过滤。注意事项：infer 只能在条件类型的 extends 子句中使用，且同一类型变量只能声明一次。',
    tags: ['TypeScript', '类型系统'],
    createdAt: '2026-06-19T09:15:00.000Z',
    qa: [
      {
        id: 'qa-2-1',
        question: 'infer 能否在非条件类型中使用？',
        answer: '不能，infer 只能在条件类型的 extends 子句中声明。这是 TypeScript 的语法限制。',
        createdAt: '2026-06-19T11:00:00.000Z',
      },
      {
        id: 'qa-2-2',
        question: '如何递归提取嵌套 Promise 的类型？',
        answer: '使用递归条件类型：type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T; TypeScript 4.5+ 内置了此类型。',
        createdAt: '2026-06-19T14:20:00.000Z',
      },
    ],
  },
  {
    id: 'note-3',
    title: 'Webpack 构建速度优化：从120秒到12秒',
    content: '项目规模增长后，Webpack 构建耗时从几秒暴增到两分钟。经过系统排查，采用以下优化策略：1. 开启 cache: { type: "filesystem" } 缓存编译结果，二次构建提速 60%；2. 使用 thread-loader 将 babel-loader 和 ts-loader 放入 worker 池并行处理；3. 用 esbuild-loader 替代 babel-loader 和 terser，JS/TS 编译速度提升 10 倍；4. 配置 resolve.alias 减少模块搜索路径；5. 使用 DLLPlugin 预编译不常变化的第三方库；6. 开启 stats: "errors-only" 减少终端输出开销。综合优化后，冷构建降至 12 秒，热更新在 1 秒内完成。',
    tags: ['性能优化', 'Webpack'],
    createdAt: '2026-06-18T14:00:00.000Z',
    qa: [
      {
        id: 'qa-3-1',
        question: 'esbuild-loader 和 babel-loader 可以混用吗？',
        answer: '可以，但建议优先使用 esbuild-loader 处理 JS/TS 编译，仅在需要 Babel 特定插件（如装饰器元数据）时才混用 babel-loader。',
        createdAt: '2026-06-18T16:30:00.000Z',
      },
    ],
  },
  {
    id: 'note-4',
    title: 'Node.js 内存泄漏排查全流程',
    content: '线上 Node.js 服务出现内存持续增长，最终 OOM 崩溃。排查步骤：1. 使用 process.memoryUsage() 监控 heapUsed 趋势，确认是否为真实泄漏而非正常缓存增长；2. 在生产环境开启 --inspect 标志，通过 Chrome DevTools Remote Debug 连接；3. 使用 heapdump 或 v8 模块生成堆快照，对比两个时间点的快照差异；4. 在 DevTools Memory 面板中按 Retained Size 排序，定位占用最大的对象；5. 常见泄漏源：未清理的定时器、闭包引用、全局缓存无限增长、事件监听器重复注册。修复后使用 --max-old-space-size 限制堆上限，并配置 PMX 告警。',
    tags: ['Node.js', '调试'],
    createdAt: '2026-06-17T10:45:00.000Z',
    qa: [
      {
        id: 'qa-4-1',
        question: '堆快照对比分析有什么技巧？',
        answer: '建议在业务低峰期连续采集 3 个快照（间隔 10-15 分钟），对比第 2 和第 3 个快照，排除启动时的正常分配，只关注持续增长的对象。',
        createdAt: '2026-06-17T13:00:00.000Z',
      },
    ],
  },
  {
    id: 'note-5',
    title: 'CSS Grid 与 Flexbox 布局选型指南',
    content: 'Grid 和 Flexbox 并非互斥，而是互补关系。选型原则：1. 单维度排列（一行或一列）用 Flexbox，多维度二维布局用 Grid；2. 内容驱动布局用 Flexbox（子项大小由内容决定），容器驱动布局用 Grid（子项大小由网格轨道定义）；3. Grid 的 grid-template-areas 可以实现语义化的布局声明，特别适合页面级骨架；4. Flexbox 的 flex-wrap 和 gap 配合可以快速实现自适应换行列表；5. 复杂布局中可以嵌套使用：Grid 做外层骨架，Flexbox 处理局部排列。性能上两者差异可以忽略，选型应以可读性和维护性为主。',
    tags: ['CSS', '布局'],
    createdAt: '2026-06-16T11:30:00.000Z',
    qa: [
      {
        id: 'qa-5-1',
        question: 'Grid 嵌套 Flexbox 时性能会受影响吗？',
        answer: '在常规页面复杂度下几乎无影响。浏览器对这两种布局的渲染都已高度优化，只有在极端嵌套深度（>50层）时才可能出现可感知的差异。',
        createdAt: '2026-06-16T14:15:00.000Z',
      },
    ],
  },
  {
    id: 'note-6',
    title: 'React 状态管理：Zustand vs Jotai vs Redux',
    content: '现代 React 状态管理三大方案对比：Zustand 基于单一 store + selector 模式，API 极简，适合中小项目，selective re-render 通过 selector 自动实现；Jotai 采用原子化状态，每个状态独立，细粒度更新，适合组件级状态管理，无需 Provider 包裹；Redux Toolkit 标准化程度最高，RTK Query 内置数据请求缓存，适合大型团队和复杂业务逻辑。性能方面：Zustand 和 Jotai 默认优于 Redux（更少的重渲染），但 Redux 的 middleware 生态更成熟。选型建议：小项目用 Zustand，组件级状态用 Jotai，大型企业项目用 Redux Toolkit。',
    tags: ['React', '状态管理'],
    createdAt: '2026-06-15T09:00:00.000Z',
    qa: [
      {
        id: 'qa-6-1',
        question: 'Zustand 可以和 React Context 混用吗？',
        answer: '可以。Zustand store 独立于 React 组件树，你可以在 Zustand 管理全局状态的同时用 Context 传递局部的主题或 UI 状态，两者不冲突。',
        createdAt: '2026-06-15T11:30:00.000Z',
      },
      {
        id: 'qa-6-2',
        question: '从 Redux 迁移到 Zustand 工作量大吗？',
        answer: '中等。核心逻辑可以复用，但需要重写 store 定义和组件中的 useSelect/useDispatch 调用，建议按模块逐步迁移。',
        createdAt: '2026-06-15T15:45:00.000Z',
      },
    ],
  },
  {
    id: 'note-7',
    title: 'Docker 多阶段构建优化镜像体积',
    content: 'Node.js 应用 Docker 镜像常常超过 1GB，通过多阶段构建可以压缩到 100MB 以内。方案：1. 第一阶段（builder）使用 node:20-alpine 安装依赖并编译 TypeScript，COPY package*.json 后执行 npm ci --production=false；2. 第二阶段（runner）使用更小的 base 镜像，仅 COPY --from=builder 编译产物和 node_modules；3. 进一步优化：使用 node:20-slim 替代 alpine（glibc 兼容性更好）；4. 利用 .dockerignore 排除 .git、node_modules、test 文件；5. 使用 docker scan 检查镜像安全漏洞；6. 配合 BuildKit 缓存 mount 加速 npm ci：RUN --mount=type=cache,target=/root/.npm npm ci。最终镜像从 1.2GB 降至 95MB。',
    tags: ['Docker', '部署'],
    createdAt: '2026-06-14T16:20:00.000Z',
    qa: [
      {
        id: 'qa-7-1',
        question: 'alpine 和 slim 镜像有什么区别？',
        answer: 'alpine 基于 musl libc（非 glibc），某些 npm 包可能编译失败；slim 基于 Debian 去除非必要文件，保持 glibc 兼容。Node.js 项目推荐 slim。',
        createdAt: '2026-06-14T18:00:00.000Z',
      },
    ],
  },
  {
    id: 'note-8',
    title: 'Git rebase vs merge：团队协作最佳实践',
    content: 'rebase 和 merge 的核心区别：rebase 重写提交历史产生线性记录，merge 保留分支历史产生合并节点。团队实践建议：1. 个人特性分支开发时使用 rebase 保持与主干同步，减少冲突积累；2. 合并到主干时使用 --no-ff merge，保留特性分支的完整开发记录；3. 绝不要对已推送到远程的公共分支执行 rebase，这会导致其他开发者历史冲突；4. 使用 git pull --rebase 替代默认的 pull（merge），避免产生无意义的合并提交；5. 配置 git config --global pull.rebase true 设为默认行为。对于持续集成，建议保护主干分支只接受 squash merge，保持提交历史整洁。',
    tags: ['Git', '工作流'],
    createdAt: '2026-06-13T13:45:00.000Z',
    qa: [
      {
        id: 'qa-8-1',
        question: '什么场景下应该禁止使用 rebase？',
        answer: '任何已推送到共享远程仓库的分支都应禁止 rebase。此外，发布标签（tag）对应的提交历史绝不能被 rebase 修改。',
        createdAt: '2026-06-13T15:30:00.000Z',
      },
    ],
  },
  {
    id: 'note-9',
    title: 'XSS 与 CSRF 防护实战总结',
    content: '前端安全两大威胁的防护要点：XSS（跨站脚本）防护：1. 对所有用户输入进行 HTML 转义，使用 DOMPurify 库处理富文本；2. 设置 Content-Security-Policy 头限制脚本来源；3. Cookie 设置 HttpOnly 和 SameSite 属性；4. 避免使用 innerHTML、v-html、dangerouslySetInnerHTML。CSRF（跨站请求伪造）防护：1. 使用 SameSite=Strict 或 Lax 的 Cookie 策略；2. 在表单中嵌入 CSRF Token 并在服务端校验；3. 关键操作使用 POST 而非 GET；4. 检查 Origin 和 Referer 头。额外建议：启用 HSTS 头强制 HTTPS，配置 X-Content-Type-Options: nosniff 防止 MIME 嗅探。',
    tags: ['安全', '前端'],
    createdAt: '2026-06-12T08:30:00.000Z',
    qa: [
      {
        id: 'qa-9-1',
        question: 'SameSite=Lax 和 Strict 有什么区别？',
        answer: 'Strict 完全禁止第三方请求携带 Cookie（包括从外部链接跳转）；Lax 允许顶级导航的 GET 请求携带 Cookie。大多数网站推荐 Lax，Strict 可能影响用户体验。',
        createdAt: '2026-06-12T10:00:00.000Z',
      },
      {
        id: 'qa-9-2',
        question: 'CSP 如何配置才能不影响正常功能？',
        answer: '建议分阶段部署：先用 Content-Security-Policy-Report-Only 观察违规报告，确认无误后再切换为强制模式。初期可以使用较宽松的策略，逐步收紧。',
        createdAt: '2026-06-12T14:30:00.000Z',
      },
    ],
  },
  {
    id: 'note-10',
    title: 'RESTful API 设计规范与常见误区',
    content: 'RESTful API 设计核心原则与常见错误：正确做法：1. 资源名用复数名词（/users、/articles）；2. 用 HTTP 方法表达操作语义（GET 查询、POST 创建、PUT 全量更新、PATCH 部分更新、DELETE 删除）；3. 使用嵌套路由表达资源关系（/users/:id/articles）；4. 分页使用 cursor-based 而非 offset-based（大数据量下性能更稳定）；5. 版本化 API（/v1/users）；6. 统一错误格式 { code, message, details }。常见误区：1. 在 URL 中使用动词（/getUser 应为 GET /users/:id）；2. 忽略幂等性设计（PUT 和 DELETE 必须幂等）；3. 返回 200 状态码但 body 中包含错误信息；4. 过度嵌套资源路径（超过 2 层应考虑重新设计）。',
    tags: ['API', '后端'],
    createdAt: '2026-06-11T15:00:00.000Z',
    qa: [
      {
        id: 'qa-10-1',
        question: 'cursor-based 分页如何实现？',
        answer: '使用有序字段（如 id 或 createdAt）作为游标：GET /articles?cursor=abc123&limit=20。服务端返回 { data, nextCursor }，客户端用 nextCursor 请求下一页。适合无限滚动场景。',
        createdAt: '2026-06-11T17:15:00.000Z',
      },
    ],
  },
]

export default notes
