import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import type { DatabaseSchema } from '../../shared/types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../../db.json');

const defaultData: DatabaseSchema = {
  clients: [
    {
      id: 'client-1',
      name: '张伟',
      age: 28,
      goal: 'muscle',
      location: 'gym',
      baselineScores: { squat: 25, pushup: 30, plank: 90, flexibility: 5, endurance: 6 },
      createdAt: '2026-06-01T08:00:00.000Z',
    },
    {
      id: 'client-2',
      name: '李娜',
      age: 35,
      goal: 'fat-loss',
      location: 'home',
      baselineScores: { squat: 10, pushup: 8, plank: 30, flexibility: 3, endurance: 4 },
      createdAt: '2026-06-01T09:00:00.000Z',
    },
  ],
  exercises: [
    { id: 'ex-01', name: '杠铃卧推', muscleGroup: '胸部', mediaUrl: '', difficulty: 3, description: '平躺于卧推架，双手握杠铃与肩同宽，下放至胸前再推起，主要锻炼胸大肌' },
    { id: 'ex-02', name: '上斜哑铃卧推', muscleGroup: '胸部', mediaUrl: '', difficulty: 3, description: '躺在上斜凳上，双手持哑铃从两侧向上推起，重点刺激上胸' },
    { id: 'ex-03', name: '俯卧撑', muscleGroup: '胸部', mediaUrl: '', difficulty: 1, description: '双手撑地与肩同宽，身体保持直线，屈臂下放再撑起' },
    { id: 'ex-04', name: '龙门架夹胸', muscleGroup: '胸部', mediaUrl: '', difficulty: 3, description: '站于龙门架中间，双手拉绳索向胸前合拢，感受胸肌收缩' },
    { id: 'ex-05', name: '双杠臂屈伸', muscleGroup: '胸部', mediaUrl: '', difficulty: 4, description: '双手撑于平行杠，身体下放再撑起，锻炼下胸和三头' },
    { id: 'ex-06', name: '引体向上', muscleGroup: '背部', mediaUrl: '', difficulty: 4, description: '双手握单杠，悬挂后拉起身体至下巴过杠' },
    { id: 'ex-07', name: '杠铃划船', muscleGroup: '背部', mediaUrl: '', difficulty: 3, description: '俯身双手握杠铃，拉向腹部，锻炼背阔肌' },
    { id: 'ex-08', name: '高位下拉', muscleGroup: '背部', mediaUrl: '', difficulty: 2, description: '坐于器械，双手宽握下拉至胸前' },
    { id: 'ex-09', name: '坐姿划船', muscleGroup: '背部', mediaUrl: '', difficulty: 2, description: '坐于器械，双手拉把手至腹部，感受背部收缩' },
    { id: 'ex-10', name: '直臂下压', muscleGroup: '背部', mediaUrl: '', difficulty: 2, description: '站于龙门架前，双臂伸直下压绳索' },
    { id: 'ex-11', name: '哑铃推举', muscleGroup: '肩部', mediaUrl: '', difficulty: 2, description: '坐姿双手持哑铃从肩部向上推起' },
    { id: 'ex-12', name: '侧平举', muscleGroup: '肩部', mediaUrl: '', difficulty: 2, description: '站姿双手持哑铃向两侧抬起至肩高' },
    { id: 'ex-13', name: '前平举', muscleGroup: '肩部', mediaUrl: '', difficulty: 2, description: '站姿单手持哑铃向前抬起至肩高' },
    { id: 'ex-14', name: '面拉', muscleGroup: '肩部', mediaUrl: '', difficulty: 2, description: '站于龙门架，双手拉绳索至面部两侧，锻炼后肩' },
    { id: 'ex-15', name: '杠铃弯举', muscleGroup: '手臂', mediaUrl: '', difficulty: 2, description: '站姿双手握杠铃，弯举至胸前' },
    { id: 'ex-16', name: '三头绳索下压', muscleGroup: '手臂', mediaUrl: '', difficulty: 2, description: '站于龙门架，双手握绳索向下压' },
    { id: 'ex-17', name: '锤式弯举', muscleGroup: '手臂', mediaUrl: '', difficulty: 2, description: '站姿双手持哑铃，拳眼朝上弯举' },
    { id: 'ex-18', name: '窄距卧推', muscleGroup: '手臂', mediaUrl: '', difficulty: 3, description: '平躺卧推架，双手窄握推起杠铃，重点锻炼三头肌' },
    { id: 'ex-19', name: '平板支撑', muscleGroup: '核心', mediaUrl: '', difficulty: 1, description: '双肘撑地，身体保持直线，坚持不动' },
    { id: 'ex-20', name: '仰卧卷腹', muscleGroup: '核心', mediaUrl: '', difficulty: 1, description: '仰卧屈膝，双手抱头卷起上身' },
    { id: 'ex-21', name: '俄罗斯转体', muscleGroup: '核心', mediaUrl: '', difficulty: 2, description: '坐姿双脚离地，双手持重物左右转体' },
    { id: 'ex-22', name: '悬垂举腿', muscleGroup: '核心', mediaUrl: '', difficulty: 4, description: '双手悬挂于单杠，直腿抬起至水平' },
    { id: 'ex-23', name: '杠铃深蹲', muscleGroup: '腿部', mediaUrl: '', difficulty: 3, description: '双肩扛杠铃，下蹲至大腿平行地面再站起' },
    { id: 'ex-24', name: '腿举', muscleGroup: '腿部', mediaUrl: '', difficulty: 2, description: '坐于腿举器械，双脚蹬踏板推起重量' },
    { id: 'ex-25', name: '罗马尼亚硬拉', muscleGroup: '腿部', mediaUrl: '', difficulty: 3, description: '双手持杠铃，从站姿俯身下放至腿后侧拉伸' },
    { id: 'ex-26', name: '保加利亚分腿蹲', muscleGroup: '腿部', mediaUrl: '', difficulty: 3, description: '后脚搭于凳上，前脚单腿下蹲' },
    { id: 'ex-27', name: '腿弯举', muscleGroup: '腿部', mediaUrl: '', difficulty: 2, description: '俯卧于器械，双腿弯曲抬起重量' },
    { id: 'ex-28', name: '臀推', muscleGroup: '臀部', mediaUrl: '', difficulty: 2, description: '上背靠于凳上，杠铃置于髋部，向上挺髋' },
    { id: 'ex-29', name: '哑铃弓步蹲', muscleGroup: '臀部', mediaUrl: '', difficulty: 2, description: '双手持哑铃，前后弓步下蹲' },
    { id: 'ex-30', name: '波比跳', muscleGroup: '全身', mediaUrl: '', difficulty: 3, description: '下蹲撑地跳回平板支撑，再跳起双手过头' },
  ],
  trainingPlans: [
    {
      id: 'plan-1',
      clientId: 'client-1',
      weekStart: '2026-06-09',
      days: [
        {
          dayIndex: 1,
          duration: 45,
          focusAreas: ['胸部', '手臂'],
          exercises: [
            { exerciseId: 'ex-01', sets: 4, reps: '8-10', restSeconds: 90, order: 1 },
            { exerciseId: 'ex-03', sets: 3, reps: '12-15', restSeconds: 60, order: 2 },
            { exerciseId: 'ex-15', sets: 3, reps: '10-12', restSeconds: 60, order: 3 },
            { exerciseId: 'ex-16', sets: 3, reps: '10-12', restSeconds: 60, order: 4 },
          ],
        },
        {
          dayIndex: 3,
          duration: 50,
          focusAreas: ['背部', '肩部'],
          exercises: [
            { exerciseId: 'ex-06', sets: 4, reps: '6-8', restSeconds: 120, order: 1 },
            { exerciseId: 'ex-08', sets: 3, reps: '10-12', restSeconds: 90, order: 2 },
            { exerciseId: 'ex-11', sets: 3, reps: '10-12', restSeconds: 60, order: 3 },
            { exerciseId: 'ex-12', sets: 3, reps: '12-15', restSeconds: 60, order: 4 },
          ],
        },
        {
          dayIndex: 5,
          duration: 50,
          focusAreas: ['腿部', '核心'],
          exercises: [
            { exerciseId: 'ex-23', sets: 4, reps: '8-10', restSeconds: 120, order: 1 },
            { exerciseId: 'ex-25', sets: 3, reps: '8-10', restSeconds: 90, order: 2 },
            { exerciseId: 'ex-19', sets: 3, reps: '30秒', restSeconds: 60, order: 3 },
            { exerciseId: 'ex-21', sets: 3, reps: '15', restSeconds: 60, order: 4 },
          ],
        },
      ],
      createdAt: '2026-06-09T08:00:00.000Z',
    },
  ],
  sessions: [],
  weeklyReports: [],
};

let dbInstance: Low<DatabaseSchema> | null = null;

export async function getDb(): Promise<Low<DatabaseSchema>> {
  if (dbInstance) return dbInstance;
  const adapter = new JSONFile<DatabaseSchema>(dbPath);
  dbInstance = new Low<DatabaseSchema>(adapter, defaultData);
  await dbInstance.read();
  if (!dbInstance.data.clients || dbInstance.data.clients.length === 0) {
    dbInstance.data = defaultData;
  }
  await dbInstance.write();
  return dbInstance;
}
