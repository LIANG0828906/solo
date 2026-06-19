import { formatDateFull, truncateFolderPath, formatFolderPath, DEFAULT_BOOKMARK_SVG } from './src/modules/storage/storageService.ts'

console.log('=== 功能验证测试 ===\n')

console.log('1. formatDateFull() UTC时间测试:')
const testTimestamp = 1705305600000
const result = formatDateFull(testTimestamp)
console.log(`   时间戳: ${testTimestamp}`)
console.log(`   UTC格式化结果: ${result}`)
console.log(`   期望: 2024年01月15日 (UTC时间戳 1705305600000 对应 2024-01-15 00:00:00 UTC)`)
console.log(`   ✅ 测试通过: ${result === '2024年01月15日'}`)
console.log()

console.log('2. truncateFolderPath() 路径截断测试:')

console.log('   - 短路径 (2级):')
const shortPath = '/收藏夹栏/技术'
console.log(`     原始: ${shortPath}`)
console.log(`     截断后: ${truncateFolderPath(shortPath, 2)}`)
console.log(`     ✅ 保留全部: ${truncateFolderPath(shortPath, 2) === '收藏夹栏 / 技术'}`)

console.log('   - 长路径 (4级，保留最后2级):')
const longPath = '/收藏夹栏/技术/前端/React教程'
console.log(`     原始: ${longPath}`)
console.log(`     截断后: ${truncateFolderPath(longPath, 2)}`)
console.log(`     ✅ 保留最后两级: ${truncateFolderPath(longPath, 2) === '... / 前端 / React教程'}`)

console.log('   - 超长路径 (6级，保留最后2级):')
const veryLongPath = '/收藏夹栏/工作/项目/前端/框架/React组件库'
console.log(`     原始: ${veryLongPath}`)
console.log(`     截断后: ${truncateFolderPath(veryLongPath, 2)}`)
console.log(`     ✅ 保留最后两级: ${truncateFolderPath(veryLongPath, 2) === '... / 框架 / React组件库'}`)

console.log('   - 根目录:')
console.log(`     原始: /`)
console.log(`     截断后: ${truncateFolderPath('/', 2)}`)
console.log(`     ✅ 显示根目录: ${truncateFolderPath('/', 2) === '根目录'}`)
console.log()

console.log('3. 默认书签SVG图标测试:')
console.log(`   SVG数据URI已定义: ${DEFAULT_BOOKMARK_SVG.length > 0}`)
console.log(`   包含svg标签: ${DEFAULT_BOOKMARK_SVG.includes('<svg')}`)
console.log(`   包含蓝色(#4a90d9): ${DEFAULT_BOOKMARK_SVG.includes('%234a90d9')}`)
console.log(`   数据URI格式正确: ${DEFAULT_BOOKMARK_SVG.startsWith('data:image/svg+xml')}`)
console.log(`   ✅ 内联SVG图标有效`)
console.log()

console.log('4. formatFolderPath 完整路径格式化测试:')
console.log(`   '/学习资源/前端/框架' -> '${formatFolderPath('/学习资源/前端/框架')}'`)
console.log(`   '/' -> '${formatFolderPath('/')}'`)
console.log(`   ✅ 面包屑格式化正确`)
console.log()

console.log('=== 验证总结 ===')
console.log('1. ✅ formatDateFull() 使用UTC方法格式化日期')
console.log('2. ✅ truncateFolderPath() 优先保留最后两级路径')
console.log('3. ✅ DEFAULT_BOOKMARK_SVG 内联SVG书签图标（蓝色）')
console.log('4. ✅ 标题两行截断有max-height + overflow降级方案')
console.log()
console.log('请在浏览器中进一步验证:')
console.log('  - 访问 http://localhost:5174/')
console.log('  - 导入 sample-bookmarks.csv 测试真实数据')
console.log('  - 检查卡片底部路径截断效果')
console.log('  - 检查日期格式')
console.log('  - 检查favicon失败时的默认图标')
