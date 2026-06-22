import { v4 as uuidv4 } from 'uuid';
import type { Material, Project, MaterialType, ProjectStatus } from '@/types';
import { addDays, formatISO, subDays } from 'date-fns';

const textileNames = ['羊毛线', '棉线', '马海毛', '真丝线', '亚麻线', '腈纶线', '山羊绒', '冰丝线', '羊毛毡', '刺绣线'];
const woodNames = ['松木方', '橡木片', '胡桃木', '樱桃木', '枫木板', '桦木', '榉木棒', '椴木夹板', '沙比利', '柚木'];
const paintNames = ['丙烯红', '丙烯蓝', '丙烯黄', '水彩绿', '油画白', '墨汁', '国画颜料', '金属漆金', '荧光粉', '哑光黑'];
const otherNames = ['串珠', '丝带', '拉链', '纽扣', '魔术贴', '松紧带', '衬布', '棉絮', '手工胶', '双面胶'];
const units = ['卷', '团', '米', '克', '块', '瓶', '支', '个', '包', '片'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateMaterials(count: number): Material[] {
  const materials: Material[] = [];
  const types: MaterialType[] = ['textile', 'wood', 'paint', 'other'];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const type = randomItem(types);
    let name = '';
    if (type === 'textile') name = randomItem(textileNames);
    else if (type === 'wood') name = randomItem(woodNames);
    else if (type === 'paint') name = randomItem(paintNames);
    else name = randomItem(otherNames);

    const initialQty = randomInt(5, 50);
    const remaining = randomInt(1, initialQty);
    const purchaseOffset = randomInt(0, 180);
    const expiryOffset = randomInt(-5, 365);

    materials.push({
      id: uuidv4(),
      name,
      type,
      quantity: remaining,
      initialQuantity: initialQty,
      unit: randomItem(units),
      purchaseDate: formatISO(subDays(now, purchaseOffset), { representation: 'date' }),
      expiryDate: formatISO(addDays(now, expiryOffset), { representation: 'date' }),
      notified: false,
    });
  }
  return materials;
}

export function generateSampleProjects(materials: Material[]): Project[] {
  const projects: Project[] = [];
  const covers = [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600',
    'https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?w=600',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600',
    'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600',
  ];

  const sampleData = [
    { name: '手工编织毛衣', desc: '给自己织一件温暖的冬日毛衣，使用马海毛与羊毛混纺。', status: 'completed' as ProjectStatus, progress: 100, hours: 48 },
    { name: '木制首饰盒', desc: '胡桃木手作首饰盒，黄铜镶嵌，磁吸开合。', status: 'in-progress' as ProjectStatus, progress: 65, hours: 24 },
    { name: '手绘帆布袋', desc: '原创设计图案，丙烯颜料手绘，防水处理。', status: 'in-progress' as ProjectStatus, progress: 30, hours: 8 },
    { name: '刺绣小挂画', desc: '欧式刺绣挂饰，搭配复古画框，客厅装饰。', status: 'pending' as ProjectStatus, progress: 0, hours: 16 },
    { name: '羊毛毡小动物', desc: '戳戳乐系列，做一只猫咪和一只柴犬。', status: 'completed' as ProjectStatus, progress: 100, hours: 12 },
  ];

  const now = new Date();
  sampleData.forEach((data, idx) => {
    const useMaterials = materials.slice(idx * 2, idx * 2 + 2).map(m => ({
      materialId: m.id,
      usedQuantity: Math.min(m.quantity, randomInt(1, 3)),
    }));

    projects.push({
      id: uuidv4(),
      name: data.name,
      estimatedHours: data.hours,
      progress: data.progress,
      status: data.status,
      coverImage: covers[idx % covers.length],
      description: data.desc,
      materials: useMaterials,
      createdAt: formatISO(subDays(now, (idx + 1) * 7), { representation: 'complete' }),
      completedAt: data.status === 'completed'
        ? formatISO(subDays(now, idx * 3), { representation: 'complete' })
        : null,
    });
  });

  return projects;
}
