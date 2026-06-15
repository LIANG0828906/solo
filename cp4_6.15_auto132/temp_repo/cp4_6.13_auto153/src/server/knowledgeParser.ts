import { v4 as uuidv4 } from 'uuid';

export interface Node {
  id: string;
  name: string;
  category: 'person' | 'location' | 'event' | 'concept';
  frequency: number;
  context: string;
}

export interface Edge {
  source: string;
  target: string;
  relation: 'contains' | 'belongs_to' | 'causes' | 'related';
  label: string;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

const keywordLibrary: Record<string, ('person' | 'location' | 'event' | 'concept')[]> = {
  person: ['张三', '李四', '王五', '赵六', '教授', '博士', '科学家', '研究者', '作者', '专家', '学者', '工程师', '教师', '医生', '学生', '研究员', '分析师', '设计师', '程序员', '经理', '总监', '总裁', '董事长', '创始人', '发明家', '诺贝尔', '爱因斯坦', '牛顿', '达尔文', '霍金', '图灵'],
  location: ['北京', '上海', '广州', '深圳', '中国', '美国', '日本', '欧洲', '亚洲', '实验室', '研究所', '大学', '城市', '国家', '地区', '公司', '机构', '中心', '基地', '园区', '硅谷', '中关村', '华尔街', '剑桥', '牛津', '哈佛', '麻省理工', '斯坦福'],
  event: ['会议', '实验', '研究', '发现', '发明', '发布', '成立', '发展', '突破', '改革', '创新', '合作', '竞争', '投资', '并购', '上市', '发布', '展览', '论坛', '峰会', '研讨会', '讲座', '培训', '比赛', '评选', '颁奖', '庆祝', '纪念'],
  concept: ['人工智能', '机器学习', '深度学习', '神经网络', '算法', '数据', '模型', '技术', '科学', '理论', '方法', '系统', '平台', '框架', '应用', '服务', '产品', '解决方案', '架构', '设计', '开发', '测试', '部署', '运维', '安全', '隐私', '伦理', '法规', '标准', '规范', '协议', '接口', 'API', '云计算', '大数据', '区块链', '物联网', '5G', '量子计算', '生物技术', '新能源', '可持续发展']
};

const relationTriggers: Record<string, { relation: Edge['relation']; label: string }> = {
  '包含': { relation: 'contains', label: '包含' },
  '包括': { relation: 'contains', label: '包括' },
  '由...组成': { relation: 'contains', label: '组成' },
  '属于': { relation: 'belongs_to', label: '属于' },
  '是...的一部分': { relation: 'belongs_to', label: '属于' },
  '导致': { relation: 'causes', label: '导致' },
  '引起': { relation: 'causes', label: '引起' },
  '产生': { relation: 'causes', label: '产生' },
  '使得': { relation: 'causes', label: '使得' },
  '促进': { relation: 'causes', label: '促进' },
  '推动': { relation: 'causes', label: '推动' },
  '相关': { relation: 'related', label: '相关' },
  '关联': { relation: 'related', label: '关联' },
  '与...有关': { relation: 'related', label: '有关' },
  '影响': { relation: 'related', label: '影响' },
  '基于': { relation: 'related', label: '基于' },
  '依赖': { relation: 'related', label: '依赖' }
};

function extractConcepts(text: string): Map<string, { category: Node['category']; positions: number[] }> {
  const concepts = new Map<string, { category: Node['category']; positions: number[] }>();
  
  for (const [category, keywords] of Object.entries(keywordLibrary)) {
    for (const keyword of keywords) {
      let index = text.indexOf(keyword);
      while (index !== -1) {
        const existing = concepts.get(keyword);
        if (existing) {
          existing.positions.push(index);
        } else {
          concepts.set(keyword, {
            category: category as Node['category'],
            positions: [index]
          });
        }
        index = text.indexOf(keyword, index + 1);
      }
    }
  }
  
  return concepts;
}

function extractContext(text: string, keyword: string, maxLength: number = 100): string {
  const index = text.indexOf(keyword);
  if (index === -1) return keyword;
  
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + keyword.length + 50);
  let context = text.slice(start, end);
  
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';
  
  if (context.length > maxLength) {
    context = context.slice(0, maxLength - 3) + '...';
  }
  
  return context;
}

function identifyRelations(text: string, nodes: Node[]): Edge[] {
  const edges: Edge[] = [];
  const nodeMap = new Map<string, Node>();
  nodes.forEach(node => nodeMap.set(node.name, node));
  
  const sentences = text.split(/[。！？；\n]/);
  
  for (const sentence of sentences) {
    if (sentence.trim().length < 5) continue;
    
    const presentNodes = nodes.filter(n => sentence.includes(n.name));
    if (presentNodes.length < 2) continue;
    
    for (const [trigger, config] of Object.entries(relationTriggers)) {
      if (sentence.includes(trigger)) {
        const triggerIndex = sentence.indexOf(trigger);
        
        for (let i = 0; i < presentNodes.length; i++) {
          for (let j = 0; j < presentNodes.length; j++) {
            if (i === j) continue;
            
            const source = presentNodes[i];
            const target = presentNodes[j];
            const sourceIndex = sentence.indexOf(source.name);
            const targetIndex = sentence.indexOf(target.name);
            
            if (sourceIndex < triggerIndex && targetIndex > triggerIndex) {
              const edgeExists = edges.some(
                e => e.source === source.id && e.target === target.id && e.relation === config.relation
              );
              
              if (!edgeExists) {
                edges.push({
                  source: source.id,
                  target: target.id,
                  relation: config.relation,
                  label: config.label
                });
              }
            }
          }
        }
      }
    }
  }
  
  return edges;
}

function generateCooccurrenceEdges(text: string, nodes: Node[]): Edge[] {
  const edges: Edge[] = [];
  const sentences = text.split(/[。！？；\n]/);
  const nodeMap = new Map<string, Node>();
  nodes.forEach(node => nodeMap.set(node.name, node));
  
  const cooccurrenceCount = new Map<string, number>();
  
  for (const sentence of sentences) {
    const presentNodes = nodes.filter(n => sentence.includes(n.name));
    
    for (let i = 0; i < presentNodes.length; i++) {
      for (let j = i + 1; j < presentNodes.length; j++) {
        const key = [presentNodes[i].id, presentNodes[j].id].sort().join('-');
        cooccurrenceCount.set(key, (cooccurrenceCount.get(key) || 0) + 1);
      }
    }
  }
  
  for (const [key, count] of cooccurrenceCount) {
    if (count >= 1) {
      const [sourceId, targetId] = key.split('-');
      const edgeExists = edges.some(
        e => (e.source === sourceId && e.target === targetId) || 
             (e.source === targetId && e.target === sourceId)
      );
      
      if (!edgeExists) {
        edges.push({
          source: sourceId,
          target: targetId,
          relation: 'related',
          label: '共现'
        });
      }
    }
  }
  
  return edges;
}

export function parseText(text: string): GraphData {
  const concepts = extractConcepts(text);
  
  const sortedConcepts = Array.from(concepts.entries())
    .sort((a, b) => b[1].positions.length - a[1].positions.length);
  
  const topConcepts = sortedConcepts.slice(0, Math.max(15, Math.min(30, sortedConcepts.length)));
  
  const nodes: Node[] = topConcepts.map(([name, data]) => ({
    id: uuidv4(),
    name,
    category: data.category,
    frequency: data.positions.length,
    context: extractContext(text, name)
  }));
  
  const relationEdges = identifyRelations(text, nodes);
  const cooccurrenceEdges = generateCooccurrenceEdges(text, nodes);
  
  const allEdges = [...relationEdges];
  
  const existingPairs = new Set(
    allEdges.map(e => [e.source, e.target].sort().join('-'))
  );
  
  for (const edge of cooccurrenceEdges) {
    const pairKey = [edge.source, edge.target].sort().join('-');
    if (!existingPairs.has(pairKey)) {
      allEdges.push(edge);
      existingPairs.add(pairKey);
    }
  }
  
  return {
    nodes,
    edges: allEdges.slice(0, 100)
  };
}