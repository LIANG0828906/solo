import { v4 as uuidv4 } from 'uuid';
import { StoryParagraph, StoryboardPanel, ShotType } from '../../types';

const SHOT_TYPES: ShotType[] = ['远景', '全景', '中景', '近景', '特写'];

const SCENE_KEYWORDS = [
  { kw: ['走进', '推开', '门前', '进入', '到达'], desc: '人物抵达场景入口，推门而入', shot: '中景' as ShotType },
  { kw: ['看着', '注视', '凝视', '目光', '望向'], desc: '人物眼神聚焦于某处，表情细腻', shot: '特写' as ShotType },
  { kw: ['大声说', '喊道', '怒吼', '尖叫'], desc: '人物情绪激动地发声，嘴部大张', shot: '近景' as ShotType },
  { kw: ['坐下', '站起', '转身', '蹲下', '倒下'], desc: '人物做出大幅度肢体动作', shot: '中景' as ShotType },
  { kw: ['天空', '远处', '城市', '山脉', '大海'], desc: '开阔的环境全貌展示', shot: '远景' as ShotType },
  { kw: ['房间里', '屋内', '客厅', '卧室', '办公室'], desc: '完整展示室内空间与布局', shot: '全景' as ShotType },
  { kw: ['握住', '拿起', '放下', '递出', '触摸'], desc: '手部与物体的接触细节', shot: '特写' as ShotType },
  { kw: ['微笑', '皱眉', '流泪', '惊讶', '愤怒'], desc: '面部表情特写，情绪明显', shot: '特写' as ShotType },
  { kw: ['并肩', '相对', '对峙', '拥抱'], desc: '两人以上互动关系', shot: '中景' as ShotType },
  { kw: ['奔跑', '追赶', '逃跑', '跳跃'], desc: '人物高速运动中的姿态', shot: '全景' as ShotType },
];

function extractDialogue(text: string): string {
  const matches = text.match(/[""「『]([^""」』]+)[""」』]/g);
  if (matches && matches.length > 0) {
    return matches.map((m) => m.replace(/^[""「『]|[""」』]$/g, '')).join(' / ');
  }
  return '';
}

function analyzeParagraph(text: string, fallbackIndex: number): { description: string; shotType: ShotType; dialogue: string } {
  const dialogue = extractDialogue(text);

  for (const rule of SCENE_KEYWORDS) {
    if (rule.kw.some((k) => text.includes(k))) {
      return { description: rule.desc, shotType: rule.shot, dialogue };
    }
  }

  const descriptionPatterns = [
    '展示当前场景整体氛围与人物状态',
    '人物正在进行对话交流，环境烘托情绪',
    '关键角色动作展示，推进故事节奏',
    '环境细节描写，交代背景信息',
    '人物内心世界外化的画面呈现',
  ];

  return {
    description: descriptionPatterns[fallbackIndex % descriptionPatterns.length],
    shotType: SHOT_TYPES[fallbackIndex % SHOT_TYPES.length],
    dialogue,
  };
}

export function generateStoryboard(paragraphs: StoryParagraph[]): Promise<StoryboardPanel[]> {
  return new Promise((resolve, reject) => {
    const delay = 400 + Math.random() * 2200;

    setTimeout(() => {
      try {
        const panels: StoryboardPanel[] = paragraphs.map((p, idx) => {
          const analysis = analyzeParagraph(p.content, idx);
          return {
            id: uuidv4(),
            sceneNumber: idx + 1,
            shotType: analysis.shotType,
            description: analysis.description,
            dialogue: analysis.dialogue || p.content.slice(0, 40) + (p.content.length > 40 ? '…' : ''),
            sourceParagraphIndex: idx,
          };
        });
        resolve(panels);
      } catch (err) {
        reject(err);
      }
    }, delay);
  });
}
