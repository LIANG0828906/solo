import type { Bubble, Connection, ReportContent } from './types';
import { COLOR_EMOTION_MAP } from './constants';

const getArea = (d: number) => Math.PI * Math.pow(d / 2, 2);

const getEmotion = (color: string) =>
  COLOR_EMOTION_MAP[color] || { category: 'order', tag: '通用' };

const getBubblesByCategory = (bubbles: Bubble[], category: string) =>
  bubbles.filter((b) => getEmotion(b.color).category === category);

const getTotalArea = (bubbles: Bubble[]) =>
  bubbles.reduce((sum, b) => sum + getArea(b.diameter), 0);

const areConnected = (
  aId: string,
  bId: string,
  connections: Connection[]
): boolean => {
  return connections.some(
    (c) =>
      (c.sourceId === aId && c.targetId === bId) ||
      (c.sourceId === bId && c.targetId === aId)
  );
};

export function generateReport(
  bubbles: Bubble[],
  connections: Connection[]
): ReportContent {
  if (bubbles.length === 0) {
    return {
      zoning: '当前画布中尚无功能气泡，建议先添加主要功能分区以开展场地布局分析。',
      circulation: '暂无气泡连接关系，动线系统尚未建立。请在创建功能分区后通过连线建立空间联系。',
      ecology: '生态体系评价暂无数据支撑。建议添加绿色系气泡以表征自然生态要素，综合评估场地生态格局。',
    };
  }

  const totalArea = getTotalArea(bubbles);

  const sortedByArea = [...bubbles].sort(
    (a, b) => getArea(b.diameter) - getArea(a.diameter)
  );
  const primary = sortedByArea[0];
  const secondary = sortedByArea[1];

  let zoning = '';
  const primaryEmo = getEmotion(primary.color);
  const primaryPct = ((getArea(primary.diameter) / totalArea) * 100).toFixed(0);
  zoning = `主功能区为「${primary.name}」（${primaryEmo.tag}，占比${primaryPct}%）`;
  if (secondary) {
    const secondaryEmo = getEmotion(secondary.color);
    const secondaryPct = (
      (getArea(secondary.diameter) / totalArea) *
      100
    ).toFixed(0);
    zoning += `，次功能区「${secondary.name}」（${secondaryEmo.tag}，占比${secondaryPct}%）`;
    zoning += `，二者共同构建场地核心空间结构，主次分明，功能复合度良好。`;
  } else {
    zoning += `，为场地单一核心，建议补充次级功能以增强空间多样性与使用弹性。`;
  }

  const bubbleCount = bubbles.length;
  const connCount = connections.length;
  const ratio = bubbleCount > 0 ? connCount / bubbleCount : 0;
  const conflictCount = connections.filter((c) => c.label === '冲突').length;
  const strongCount = connections.filter((c) => c.label === '强相关').length;

  let circulation = '';
  if (connCount === 0) {
    circulation = `当前气泡数${bubbleCount}个，但尚未建立连线，动线系统缺位。建议通过"连接"工具建立功能间的流线关系，完善交通组织。`;
  } else {
    circulation = `动线连线${connCount}条，连泡比${ratio.toFixed(2)}`;
    if (ratio < 0.5) {
      circulation += `，动线网络偏稀疏，空间联系较弱。`;
    } else if (ratio < 1.2) {
      circulation += `，动线丰富度适中，空间联系均衡。`;
    } else {
      circulation += `，动线网络密集，交叉风险升高。`;
    }
    if (conflictCount > 0) {
      circulation += `检测到${conflictCount}处"冲突"标签连线，建议优化空间布局以消解功能矛盾；`;
    }
    if (strongCount > 0) {
      circulation += `${strongCount}处"强相关"连接可组织为核心主动线，提升空间效率。`;
    } else if (conflictCount === 0) {
      circulation += `整体动线结构清晰，建议进一步强化核心功能间的直接联系。`;
    }
  }

  const natureBubbles = getBubblesByCategory(bubbles, 'nature');
  const warningBubbles = getBubblesByCategory(bubbles, 'warning');
  const natureArea = getTotalArea(natureBubbles);
  const warningArea = getTotalArea(warningBubbles);
  const natureRatio = totalArea > 0 ? natureArea / totalArea : 0;
  const warningRatio = totalArea > 0 ? warningArea / totalArea : 0;

  let ecology = '';
  if (natureBubbles.length === 0) {
    ecology = `场地尚未设置生态要素（绿色系气泡），建议引入绿地、水体等自然空间，提升场地生态品质与环境舒适度。`;
  } else {
    ecology = `生态要素面积占比${(natureRatio * 100).toFixed(0)}%`;
    if (natureRatio >= 0.3) {
      ecology += `，达到30%以上阈值，生态格局良好，绿色空间充足，能有效改善场地微气候与环境品质。`;
    } else {
      ecology += `，未达30%理想占比，建议适当扩大绿地、湿地等生态空间规模，增强场地自然渗透能力。`;
    }
    if (warningBubbles.length > 0) {
      const hasConflictConnection = natureBubbles.some((n) =>
        warningBubbles.some((w) => areConnected(n.id, w.id, connections))
      );
      ecology += `警示类要素占比${(warningRatio * 100).toFixed(0)}%`;
      if (hasConflictConnection) {
        ecology += `，且与生态空间直接相连，存在生态冲突风险，建议增设缓冲隔离带降低干扰影响。`;
      } else {
        ecology += `，当前与生态空间无直接连接，空间隔离尚可，应持续监控避免后续功能冲突。`;
      }
    }
  }

  return { zoning, circulation, ecology };
}
