import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import type { DB } from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const file = path.join(__dirname, '..', '..', 'data', 'db.json')

const defaultData: DB = {
  users: [
    { id: 'user-demo-1', username: '书虫小明', password: '123456' },
    { id: 'user-demo-2', username: '爱读书的猫', password: '123456' },
  ],
  books: [],
  dropPoints: [
    { id: 'dp-1', name: '城市书房·朝阳店', lat: 39.9087, lng: 116.4074, address: '北京市朝阳区建国路88号' },
    { id: 'dp-2', name: '西西弗书店·国贸店', lat: 39.9137, lng: 116.4554, address: '北京市朝阳区建国门外大街1号' },
    { id: 'dp-3', name: 'Page One·三里屯', lat: 39.9367, lng: 116.4484, address: '北京市朝阳区三里屯路19号' },
    { id: 'dp-4', name: '万圣书园·五道口', lat: 39.9927, lng: 116.3404, address: '北京市海淀区成府路27号' },
    { id: 'dp-5', name: '单向空间·朝阳大悦城', lat: 39.9247, lng: 116.5124, address: '北京市朝阳区朝阳北路101号' },
    { id: 'dp-6', name: '模范书局·杨梅竹', lat: 39.8957, lng: 116.3934, address: '北京市西城区杨梅竹斜街31号' },
  ],
  driftLogs: [],
  chatMessages: [],
}

async function initMockBooks(db: Low<DB>) {
  if (db.data.books.length > 0) return

  const sampleBooks = [
    {
      title: '百年孤独',
      author: '加西亚·马尔克斯',
      isbn: '9787544253994',
      publishYear: 2011,
      description: '魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事，以及加勒比海沿岸小镇马孔多的百年兴衰。',
      coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=1200&fit=crop',
      dropPointId: 'dp-1',
      ownerId: 'user-demo-1',
    },
    {
      title: '三体',
      author: '刘慈欣',
      isbn: '9787536692930',
      publishYear: 2008,
      description: '中国科幻文学的里程碑之作，讲述了地球文明和三体文明在宇宙中的相遇、交流与对抗。',
      coverUrl: 'https://images.unsplash.com/photo-1614544048536-0d28caf77e4b?w=800&h=1200&fit=crop',
      dropPointId: 'dp-1',
      ownerId: 'user-demo-2',
    },
    {
      title: '活着',
      author: '余华',
      isbn: '9787506365437',
      publishYear: 2012,
      description: '讲述了农村人福贵悲惨的人生遭遇，一个历尽世间沧桑和磨难的老人的人生感言。',
      coverUrl: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&h=1200&fit=crop',
      dropPointId: 'dp-2',
      ownerId: 'user-demo-1',
    },
    {
      title: '小王子',
      author: '安托万·德·圣-埃克苏佩里',
      isbn: '9787020042494',
      publishYear: 2003,
      description: '一个来自B-612星球的小王子的星际旅行故事，一部关于爱与责任的童话。',
      coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=1200&fit=crop',
      dropPointId: 'dp-3',
      ownerId: 'user-demo-2',
    },
    {
      title: '人类简史',
      author: '尤瓦尔·赫拉利',
      isbn: '9787508647357',
      publishYear: 2014,
      description: '从认知革命、农业革命到科学革命，讲述了智人如何从非洲草原上的普通动物演变成地球的主宰。',
      coverUrl: 'https://images.unsplash.com/photo-1543002588