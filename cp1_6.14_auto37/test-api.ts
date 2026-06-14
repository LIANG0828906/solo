import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const baseURL = 'http://localhost:5000/api'
const request = axios.create({ baseURL, timeout: 10000 })

let testUserToken = ''
let testUser2Token = ''
let testCapsuleId = ''
let testDriftId = ''
let testUserId = ''

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function test(name: string, fn: () => Promise<void>) {
  console.log(`\n▶️  ${name}`)
  try {
    await fn()
    console.log(`✅ ${name} - 通过`)
  } catch (error: any) {
    console.log(`❌ ${name} - 失败`)
    console.log(`   错误: ${error.response?.data?.message || error.message}`)
    throw error
  }
}

async function runTests() {
  console.log('='.repeat(60))
  console.log('🚀 开始运行 API 测试')
  console.log('='.repeat(60))

  try {
    await test('健康检查', async () => {
      const res = await request.get('/health')
      if (res.data.status !== 'ok') throw new Error('健康检查失败')
    })

    await test('获取统计数据（未登录）', async () => {
      const res = await request.get('/capsules/stats')
      if (typeof res.data.totalCapsules !== 'number') throw new Error('统计数据格式错误')
      console.log(`   总胶囊数: ${res.data.totalCapsules}`)
    })

    const randomSuffix = Math.floor(Math.random() * 10000)
    const testUsername = `testuser_${randomSuffix}`
    const testUsername2 = `testuser2_${randomSuffix}`

    await test('用户注册 - 用户1', async () => {
      const res = await request.post('/auth/register', {
        username: testUsername,
        password: '123456',
      })
      if (!res.data.token) throw new Error('注册未返回token')
      testUserToken = res.data.token
      testUserId = res.data.user.id
      console.log(`   用户名: ${testUsername}`)
    })

    await sleep(100)

    await test('用户注册 - 用户2', async () => {
      const res = await request.post('/auth/register', {
        username: testUsername2,
        password: '123456',
      })
      if (!res.data.token) throw new Error('注册未返回token')
      testUser2Token = res.data.token
      console.log(`   用户名: ${testUsername2}`)
    })

    await sleep(100)

    await test('重复用户名注册（应该失败）', async () => {
      try {
        await request.post('/auth/register', {
          username: testUsername,
          password: '123456',
        })
        throw new Error('应该返回400错误')
      } catch (error: any) {
        if (error.response?.status !== 400) {
          throw new Error(`预期400，实际${error.response?.status}`)
        }
      }
    })

    await test('用户登录', async () => {
      const res = await request.post('/auth/login', {
        username: testUsername,
        password: '123456',
      })
      if (!res.data.token) throw new Error('登录未返回token')
      testUserToken = res.data.token
    })

    await test('错误密码登录（应该失败）', async () => {
      try {
        await request.post('/auth/login', {
          username: testUsername,
          password: 'wrongpass',
        })
        throw new Error('应该返回401错误')
      } catch (error: any) {
        if (error.response?.status !== 401) {
          throw new Error(`预期401，实际${error.response?.status}`)
        }
      }
    })

    await test('创建胶囊 - 开封时间小于24小时（应该失败）', async () => {
      try {
        const openDate = new Date()
        openDate.setHours(openDate.getHours() + 1)

        await request.post(
          '/capsules',
          {
            type: 'text',
            content: '测试内容',
            openDate: openDate.toISOString(),
          },
          { headers: { Authorization: `Bearer ${testUserToken}` } }
        )
        throw new Error('应该返回400错误')
      } catch (error: any) {
        if (error.response?.status !== 400) {
          throw new Error(`预期400，实际${error.response?.status}`)
        }
      }
    })

    await sleep(100)

    await test('创建文字胶囊（25小时后开封）', async () => {
      const openDate = new Date()
      openDate.setHours(openDate.getHours() + 25)

      const res = await request.post(
        '/capsules',
        {
          type: 'text',
          content: '这是一个测试胶囊，用于验证API是否正常工作。',
          openDate: openDate.toISOString(),
        },
        { headers: { Authorization: `Bearer ${testUserToken}` } }
      )

      if (!res.data.capsule?.id) throw new Error('未返回胶囊ID')
      testCapsuleId = res.data.capsule.id
      console.log(`   胶囊ID: ${testCapsuleId}`)
      console.log(`   开封时间: ${openDate.toLocaleString()}`)
    })

    async function setCapsuleOpenDateToPast(capsuleId: string) {
      const dbPath = path.join(__dirname, 'data', 'db.json')
      const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
      const capsule = dbData.capsules.find((c: any) => c.id === capsuleId)
      if (capsule) {
        const pastDate = new Date()
        pastDate.setMinutes(pastDate.getMinutes() - 1)
        capsule.openDate = pastDate.toISOString()
        fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2))
        console.log(`   已将胶囊 ${capsuleId} 的开封时间修改为过去时间`)
      }
    }

    await test('修改胶囊开封时间为过去（测试辅助）', async () => {
      await setCapsuleOpenDateToPast(testCapsuleId)
    })

    await sleep(100)

    await test('创建胶囊 - 文字超过500字（应该失败）', async () => {
      try {
        const openDate = new Date()
        openDate.setHours(openDate.getHours() + 48)

        await request.post(
          '/capsules',
          {
            type: 'text',
            content: 'a'.repeat(501),
            openDate: openDate.toISOString(),
          },
          { headers: { Authorization: `Bearer ${testUserToken}` } }
        )
        throw new Error('应该返回400错误')
      } catch (error: any) {
        if (error.response?.status !== 400) {
          throw new Error(`预期400，实际${error.response?.status}`)
        }
      }
    })

    await test('获取胶囊列表（分页）', async () => {
      const res = await request.get('/capsules', {
        headers: { Authorization: `Bearer ${testUserToken}` },
        params: { page: 1, pageSize: 12 },
      })

      if (!Array.isArray(res.data.capsules)) throw new Error('胶囊列表格式错误')
      console.log(`   胶囊数量: ${res.data.capsules.length}, 总数: ${res.data.total}`)
    })

    await test('获取胶囊列表（limit参数分页）', async () => {
      const res = await request.get('/capsules', {
        headers: { Authorization: `Bearer ${testUserToken}` },
        params: { page: 1, limit: 12 },
      })

      if (!Array.isArray(res.data.capsules)) throw new Error('胶囊列表格式错误')
    })

    await test('未登录访问胶囊列表（应该失败）', async () => {
      try {
        await request.get('/capsules')
        throw new Error('应该返回401错误')
      } catch (error: any) {
        if (error.response?.status !== 401) {
          throw new Error(`预期401，实际${error.response?.status}`)
        }
      }
    })

    await test('开封胶囊', async () => {
      const res = await request.post(
        `/capsules/${testCapsuleId}/open`,
        {},
        { headers: { Authorization: `Bearer ${testUserToken}` } }
      )

      if (!res.data.capsule?.isOpened) throw new Error('胶囊未被标记为已开封')
      console.log(`   开封时间: ${res.data.capsule.openedAt}`)
    })

    await test('重复开封胶囊', async () => {
      const res = await request.post(
        `/capsules/${testCapsuleId}/open`,
        {},
        { headers: { Authorization: `Bearer ${testUserToken}` } }
      )
      if (!res.data.capsule?.isOpened) throw new Error('重复开封失败')
    })

    await test('漂流胶囊', async () => {
      const res = await request.post(
        `/capsules/${testCapsuleId}/drift`,
        {},
        { headers: { Authorization: `Bearer ${testUserToken}` } }
      )

      if (!res.data.drift?.id) throw new Error('未返回漂流ID')
      testDriftId = res.data.drift.id
      console.log(`   漂流ID: ${testDriftId}`)
      console.log(`   接收用户: ${res.data.drift.toUserId}`)
    })

    await test('重复漂流同一胶囊（应该失败）', async () => {
      try {
        await request.post(
          `/capsules/${testCapsuleId}/drift`,
          {},
          { headers: { Authorization: `Bearer ${testUserToken}` } }
        )
        throw new Error('应该返回400错误')
      } catch (error: any) {
        if (error.response?.status !== 400) {
          throw new Error(`预期400，实际${error.response?.status}`)
        }
      }
    })

    await sleep(100)

    await test('用户2获取漂流瓶列表', async () => {
      const res = await request.get('/drifts', {
        headers: { Authorization: `Bearer ${testUser2Token}` },
        params: { page: 1, pageSize: 12 },
      })

      if (!Array.isArray(res.data.drifts)) throw new Error('漂流瓶列表格式错误')
      console.log(`   收到漂流瓶数量: ${res.data.drifts.length}`)
    })

    await test('用户2获取漂流瓶列表（limit参数）', async () => {
      const res = await request.get('/drifts', {
        headers: { Authorization: `Bearer ${testUser2Token}` },
        params: { page: 1, limit: 12 },
      })

      if (!Array.isArray(res.data.drifts)) throw new Error('漂流瓶列表格式错误')
    })

    await test('回复漂流瓶', async () => {
      const res = await request.post(
        `/drifts/${testDriftId}/reply`,
        { reply: '这是一条匿名回复，测试功能是否正常。' },
        { headers: { Authorization: `Bearer ${testUser2Token}` } }
      )

      if (!res.data.drift?.reply) throw new Error('回复未保存')
      console.log(`   回复内容: ${res.data.drift.reply}`)
    })

    await test('重复回复漂流瓶（应该失败）', async () => {
      try {
        await request.post(
          `/drifts/${testDriftId}/reply`,
          { reply: '重复回复' },
          { headers: { Authorization: `Bearer ${testUser2Token}` } }
        )
        throw new Error('应该返回400错误')
      } catch (error: any) {
        if (error.response?.status !== 400) {
          throw new Error(`预期400，实际${error.response?.status}`)
        }
      }
    })

    await test('获取更新后的统计数据', async () => {
      const res = await request.get('/capsules/stats')
      console.log(`   总胶囊: ${res.data.totalCapsules}`)
      console.log(`   已开封: ${res.data.openedCapsules}`)
      console.log(`   未开封: ${res.data.unopenedCapsules}`)
      console.log(`   今日开封: ${res.data.todayOpened}`)
      console.log(`   今日漂流: ${res.data.todayDrifted}`)
      console.log(`   开封率: ${(res.data.openRate * 100).toFixed(1)}%`)
    })

    console.log('\n' + '='.repeat(60))
    console.log('🎉 所有测试通过！')
    console.log('='.repeat(60))
  } catch (error) {
    console.log('\n' + '='.repeat(60))
    console.log('❌ 测试失败')
    console.log('='.repeat(60))
    process.exit(1)
  }
}

runTests()
