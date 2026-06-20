export interface Spot {
  x: number;
  y: number;
  disease: string;
}

export interface AnalyzeResult {
  spots: Spot[];
  diseaseName: string;
  severity: 'mild' | 'moderate' | 'severe';
  suggestions: string[];
  timestamp: number;
  thumbnail: string;
}

export interface HistoryItem extends AnalyzeResult {
  id: string;
}

const DISEASES = [
  { name: '白粉病', symptoms: '叶片表面白色粉状斑点' },
  { name: '锈病', symptoms: '红褐色锈状斑点' },
  { name: '炭疽病', symptoms: '圆形褐色凹陷病斑' },
  { name: '黑斑病', symptoms: '黑色不规则病斑' },
  { name: '灰霉病', symptoms: '灰色霉层覆盖' },
  { name: '叶斑病', symptoms: '黄色或褐色圆形斑点' }
];

const SUGGESTIONS: Record<string, Record<string, string[]>> = {
  '白粉病': {
    mild: [
      '及时摘除受感染的叶片并集中销毁',
      '增加通风透光，降低环境湿度',
      '使用小苏打溶液（5g/L）喷施叶面'
    ],
    moderate: [
      '剪除所有病叶并带出园外销毁',
      '喷施三唑酮或腈菌唑等杀菌剂',
      '适当减少氮肥施用，增施磷钾肥'
    ],
    severe: [
      '全面清理病株，严重者整株拔除',
      '连续喷施戊唑醇或氟硅唑2-3次',
      '对周围健康植株进行预防性喷药'
    ]
  },
  '锈病': {
    mild: [
      '发现病叶立即摘除并烧毁',
      '保持植株间距，改善通风条件',
      '叶面喷施石硫合剂稀释液'
    ],
    moderate: [
      '彻底清除所有受感染部位',
      '喷施代森锰锌或三唑酮可湿性粉剂',
      '避免傍晚浇水，减少叶面结露'
    ],
    severe: [
      '将严重病株隔离或销毁处理',
      '使用苯醚甲环唑连续喷施3次，间隔7天',
      '全面消毒种植环境和工具'
    ]
  },
  '炭疽病': {
    mild: [
      '及时剪除病叶并远离种植区销毁',
      '保证环境通风干燥，避免高温高湿',
      '喷施多菌灵可湿性粉剂进行保护'
    ],
    moderate: [
      '清除所有病叶和病枝，集中烧毁',
      '喷施咪鲜胺或溴菌腈乳油',
      '减少空气湿度，加强通风透光'
    ],
    severe: [
      '整株清理病残体，严重植株彻底移除',
      '使用吡唑醚菌酯连续防治2-3次',
      '对土壤和栽培基质进行消毒处理'
    ]
  },
  '黑斑病': {
    mild: [
      '发现病叶立即摘除并集中销毁',
      '保持叶面干燥，浇水时避免淋叶',
      '叶面喷施代森锰锌保护剂'
    ],
    moderate: [
      '全部剪除染病部位，清理落叶',
      '喷施百菌清或甲基托布津可湿性粉剂',
      '增施钾肥提高植株抗病能力'
    ],
    severe: [
      '彻底清除病株，防止病害扩散',
      '使用苯醚甲环唑或丙环唑治疗',
      '更换或消毒栽培土壤'
    ]
  },
  '灰霉病': {
    mild: [
      '及时摘除病花病叶并销毁',
      '加强通风，降低室内湿度',
      '喷施腐霉利可湿性粉剂预防'
    ],
    moderate: [
      '全面清理受感染的花、叶、果',
      '喷施异菌脲或嘧霉胺悬浮剂',
      '控制浇水，避免叶面积水'
    ],
    severe: [
      '将病株彻底移除并销毁',
      '使用啶酰菌胺或氟唑菌酰胺治疗',
      '全面熏蒸消毒种植环境'
    ]
  },
  '叶斑病': {
    mild: [
      '摘除病叶，集中深埋或烧毁',
      '保持通风透光，避免株丛过密',
      '喷施波尔多液进行保护'
    ],
    moderate: [
      '清理所有病叶和病残组织',
      '喷施多菌灵或甲基硫菌灵',
      '适当增施磷钾肥，增强植株抗性'
    ],
    severe: [
      '彻底清除病株，防止蔓延',
      '使用戊唑醇或苯醚甲环唑治疗',
      '对种植区域进行全面消毒'
    ]
  }
};

export class Analyzer {
  analyze(imageData: ImageData): AnalyzeResult {
    const { width, height } = imageData;
    const disease = this.getRandomDisease();
    const severity = this.getRandomSeverity();
    const spots = this.generateRandomSpots(width, height, severity, disease.name);
    const suggestions = this.getSuggestions(disease.name, severity);
    const timestamp = Date.now();

    return {
      spots,
      diseaseName: disease.name,
      severity,
      suggestions,
      timestamp,
      thumbnail: ''
    };
  }

  private generateRandomSpots(
    width: number,
    height: number,
    severity: 'mild' | 'moderate' | 'severe',
    disease: string
  ): Spot[] {
    const spotCountMap = { mild: 3, moderate: 6, severe: 10 };
    const count = spotCountMap[severity] + Math.floor(Math.random() * 3);
    const spots: Spot[] = [];

    const margin = 50;
    const minX = margin;
    const maxX = width - margin;
    const minY = margin;
    const maxY = height - margin;

    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      let attempts = 0;
      const maxAttempts = 50;

      do {
        x = Math.floor(Math.random() * (maxX - minX) + minX);
        y = Math.floor(Math.random() * (maxY - minY) + minY);
        attempts++;
      } while (this.isOverlapping(spots, x, y) && attempts < maxAttempts);

      if (attempts < maxAttempts) {
        spots.push({ x, y, disease });
      }
    }

    return spots;
  }

  private isOverlapping(spots: Spot[], x: number, y: number): boolean {
    const minDistance = 40;
    return spots.some(spot => {
      const dx = spot.x - x;
      const dy = spot.y - y;
      return Math.sqrt(dx * dx + dy * dy) < minDistance;
    });
  }

  private getRandomDisease() {
    return DISEASES[Math.floor(Math.random() * DISEASES.length)];
  }

  private getRandomSeverity(): 'mild' | 'moderate' | 'severe' {
    const rand = Math.random();
    if (rand < 0.4) return 'mild';
    if (rand < 0.8) return 'moderate';
    return 'severe';
  }

  private getSuggestions(disease: string, severity: 'mild' | 'moderate' | 'severe'): string[] {
    return SUGGESTIONS[disease]?.[severity] || SUGGESTIONS['叶斑病'][severity];
  }
}
