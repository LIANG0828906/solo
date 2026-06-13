import { useState, useCallback } from 'react';
import DayPanel from './DayPanel';
import MapView from './MapView';

type Preference = 'food' | 'history' | 'nature' | 'shopping';

interface Spot {
  id: string;
  name: string;
  category: Preference;
  description: string;
  fullDescription: string;
  duration: number;
  lat: number;
  lng: number;
}

interface DayPlan {
  day: number;
  spots: Spot[];
}

const DAY_COLORS = ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#00ACC1', '#F4511E'];
const PREF_CONFIG: Record<Preference, { icon: string; label: string }> = {
  food: { icon: '🍜', label: '美食' },
  history: { icon: '🏛️', label: '历史' },
  nature: { icon: '🌿', label: '自然' },
  shopping: { icon: '🛍️', label: '购物' },
};

const CITY_COORDS: Record<string, [number, number]> = {
  '京都': [35.01, 135.77], '东京': [35.68, 139.69], '大阪': [34.69, 135.50],
  '巴黎': [48.86, 2.35], '伦敦': [51.51, -0.13], '纽约': [40.71, -74.01],
  '罗马': [41.90, 12.50], '首尔': [37.57, 126.98], '曼谷': [13.76, 100.50],
  '新加坡': [1.35, 103.82], '上海': [31.23, 121.47], '北京': [39.90, 116.40],
  '成都': [30.57, 104.07], '杭州': [30.27, 120.15], '西安': [34.26, 108.94],
  '香港': [22.32, 114.17], '台北': [25.03, 121.57], '悉尼': [-33.87, 151.21],
  '迪拜': [25.20, 55.27], '巴塞罗那': [41.39, 2.17],
};

const SPOT_TEMPLATES: Record<Preference, { name: string[]; desc: string[]; full: string[] }> = {
  food: {
    name: ['老街市场', '本地风味馆', '夜市小吃街', '百年茶楼', '匠人料理店', '街角甜品铺', '传统早茶店', '海鲜排档', '香料集市', '和食料理', '手工面坊', '居酒屋', '法式烘焙坊', '河畔餐厅', '屋顶酒吧餐厅'],
    desc: ['品尝地道风味美食', '体验传统烹饪技艺', '探索特色食材与调料', '享受精致餐饮体验'],
    full: ['这里汇集了数十年的烹饪传承，每一道菜品都凝聚着匠人的心血。从食材挑选到烹制手法，无不体现着对美食的极致追求。推荐尝试招牌菜品，定能让你回味无穷。', '走进这家店，仿佛穿越时光。传统的烹饪方式保留了食材最本真的味道，老师傅的手艺让人叹为观止。这里不只是用餐，更是一场味觉的文化之旅。', '热闹的市场里弥漫着诱人的香气，摊贩们的叫卖声此起彼伏。各种地道小吃琳琅满目，每一口都是对当地饮食文化的深度体验。来此必能找到你的心头好。', '精致的摆盘、细腻的口感、独特的风味，这里的每一道菜都是一件艺术品。厨师将传统与创新完美融合，用味蕾带你领略不一样的美食境界。'],
  },
  history: {
    name: ['古城遗址', '历史博物馆', '千年古寺', '皇家宫殿', '传统街区', '文化纪念堂', '石碑古迹', '古城墙遗址', '民俗文化馆', '古代书院', '宗庙祠堂', '历史遗迹公园', '传统手工艺坊', '文化遗产中心', '考古遗址'],
    desc: ['探寻千年历史文化', '感受古建筑的魅力', '了解当地历史传承', '欣赏珍贵文物古迹'],
    full: ['踏入这片古老的土地，仿佛穿越回千年之前。精美的建筑、深邃的历史，每一块砖石都在诉说着往昔的辉煌。漫步其间，你能深刻感受到岁月的沉淀与文明的厚重。', '馆内珍藏了数千件珍贵文物，从古代器具到精美书画，完整展现了这片土地的历史脉络。互动展区让历史变得生动有趣，是了解当地文化的绝佳窗口。', '庄严的建筑群历经风雨依然屹立，精美的雕刻和彩绘令人叹为观止。这里不仅是宗教圣地，更是建筑艺术的瑰宝。晨钟暮鼓间，感受心灵的宁静与历史的厚重。', '保存完好的古街区展现了传统建筑的独特魅力，青石板路上留下了岁月的痕迹。漫步其中，两旁的老字号店铺和传统手工作坊让你仿佛置身于历史长河之中。'],
  },
  nature: {
    name: ['山间瀑布', '湖畔公园', '竹林步道', '海边栈道', '花园植物园', '山顶观景台', '河谷溪流', '湿地保护区', '森林氧吧', '温泉疗养地', '海湾观景点', '郊野公园', '岩洞奇观', '日落观景地', '星空营地'],
    desc: ['亲近自然放松身心', '欣赏壮丽的自然风光', '呼吸新鲜空气', '探索生态奇观'],
    full: ['沿着蜿蜒的山路前行，耳畔是清脆的鸟鸣和潺潺的溪流声。当壮观的瀑布出现在眼前，水雾弥漫间彩虹若隐若现，这一刻你会觉得所有的跋涉都是值得的。', '碧波荡漾的湖面倒映着远山，岸边的樱花树在微风中轻轻摇曳。租一艘小船划向湖心，或是在岸边的长椅上静静发呆，都是与自然对话的最好方式。', '走进这片绿色的海洋，高耸的竹林遮天蔽日，阳光透过缝隙洒下斑驳的光影。空气中弥漫着竹叶的清香，脚步声在竹林中回响，让人忘却尘世的喧嚣。', '站在悬崖边的栈道上，脚下是湛蓝的大海，远处海天一线。海风拂面，浪花拍打着礁石，溅起朵朵白色的水花。这里是观赏日落的绝佳地点，金色的余晖洒满海面，美不胜收。'],
  },
  shopping: {
    name: ['特色商业街', '创意集市', '品牌折扣村', '手工艺品市场', '免税购物中心', '古董跳蚤市场', '设计师买手店', '地下商业街', '百货旗舰店', '纪念品一条街', '潮流买手店', '药妆连锁店', '电子产品街', '文创园区', '时尚商圈'],
    desc: ['淘到心仪好物', '体验购物乐趣', '发现独特纪念品', '享受优惠折扣'],
    full: ['这条历史悠久的商业街汇集了各类特色店铺，从传统手工艺品到时尚潮流单品，应有尽有。漫步其间，不仅能淘到心仪好物，还能感受到浓厚的商业文化氛围。', '周末的创意集市总是充满惊喜，独立设计师们带着自己的作品前来摆摊。手工首饰、限量版印刷品、创意家居用品……每一件都是独一无二的艺术品。', '这里是购物爱好者的天堂，众多国际品牌以优惠的价格出售。宽敞明亮的购物环境、贴心的服务，让你尽情享受购物的乐趣。记得带足行李箱哦！', '古色古香的跳蚤市场里藏着无数宝贝，从古董家具到复古服饰，每一件物品都有自己的故事。与摊主讨价还价也是一种独特的文化体验，说不定就能淘到意想不到的珍品。'],
  },
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function shuffleArr<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateRouteData(destination: string, days: number, preferences: Preference[]): DayPlan[] {
  const coords = CITY_COORDS[destination] || [35.0 + (hashStr(destination) % 100) * 0.01, 135.0 + (hashStr(destination + 'lng') % 100) * 0.01];
  const seed = hashStr(destination + Date.now().toString());
  const plans: DayPlan[] = [];
  const usedNames = new Set<string>();

  for (let d = 1; d <= days; d++) {
    const spots: Spot[] = [];
    const spotCount = 3 + ((seed + d * 7) % 3);

    for (let s = 0; s < spotCount; s++) {
      const cat = preferences[(d * 3 + s) % preferences.length];
      const template = SPOT_TEMPLATES[cat];
      const nameIdx = (seed + d * 13 + s * 17) % template.name.length;
      let name = template.name[nameIdx];

      let attempt = 0;
      while (usedNames.has(name) && attempt < 10) {
        const altIdx = (seed + d * 13 + s * 17 + attempt * 7 + 3) % template.name.length;
        name = template.name[altIdx];
        attempt++;
      }
      usedNames.add(name);

      const descIdx = (seed + d * 11 + s * 19) % template.desc.length;
      const fullIdx = (seed + d * 23 + s * 29) % template.full.length;
      const duration = [30, 45, 60, 90, 120][(seed + d * 7 + s * 11) % 5];
      const latOffset = ((seed + d * 31 + s * 37) % 1000 - 500) * 0.00004;
      const lngOffset = ((seed + d * 41 + s * 43) % 1000 - 500) * 0.00004;

      spots.push({
        id: `spot-${d}-${s}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        category: cat,
        description: template.desc[descIdx],
        fullDescription: template.full[fullIdx],
        duration,
        lat: coords[0] + latOffset + s * 0.003,
        lng: coords[1] + lngOffset + s * 0.004,
      });
    }

    const shuffledSpots = shuffleArr(spots, seed + d);
    plans.push({ day: d, spots: shuffledSpots });
  }

  return plans;
}

export default function App() {
  const [destination, setDestination] = useState('京都');
  const [days, setDays] = useState(3);
  const [preferences, setPreferences] = useState<Preference[]>(['food', 'history']);
  const [plans, setPlans] = useState<DayPlan[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [expandedSpots, setExpandedSpots] = useState<Set<string>>(new Set());
  const [isGenerated, setIsGenerated] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!destination.trim() || preferences.length === 0) return;
    const newPlans = generateRouteData(destination.trim(), days, preferences);
    setPlans(newPlans);
    setExpandedDays(new Set([1]));
    setExpandedSpots(new Set());
    setIsGenerated(true);
  }, [destination, days, preferences]);

  const toggleDay = useCallback((day: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }, []);

  const toggleSpot = useCallback((spotId: string) => {
    setExpandedSpots(prev => {
      const next = new Set(prev);
      if (next.has(spotId)) next.delete(spotId);
      else next.add(spotId);
      return next;
    });
  }, []);

  const handleMoveSpot = useCallback((fromDay: number, fromIndex: number, toDay: number, toIndex: number) => {
    setPlans(prev => {
      const next = prev.map(p => ({ ...p, spots: [...p.spots] }));
      const sourcePlan = next.find(p => p.day === fromDay);
      const targetPlan = next.find(p => p.day === toDay);
      if (!sourcePlan || !targetPlan) return prev;

      const [movedSpot] = sourcePlan.spots.splice(fromIndex, 1);
      if (!movedSpot) return prev;
      targetPlan.spots.splice(toIndex, 0, movedSpot);

      return next;
    });

    setExpandedDays(prev => {
      const next = new Set(prev);
      next.add(toDay);
      return next;
    });
  }, []);

  const handleExport = useCallback(() => {
    if (typeof html2canvas === 'undefined') return;

    const overlay = document.createElement('div');
    overlay.className = 'export-overlay';
    overlay.innerHTML = `
      <div class="export-overlay-title">${destination} ${days}日旅行路线规划</div>
      <div class="export-overlay-map" id="export-map-area">
        <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:16px;">地图区域</div>
      </div>
      <table class="export-overlay-table">
        <thead>
          <tr>
            <th>天数</th>
            <th>景点名称</th>
            <th>类别</th>
            <th>建议时长</th>
            <th>简介</th>
          </tr>
        </thead>
        <tbody>
          ${plans.map(plan => plan.spots.map((spot, idx) => `
            <tr class="${idx === 0 ? 'day-row' : ''}">
              <td>${idx === 0 ? '第' + plan.day + '天' : ''}</td>
              <td>${spot.name}</td>
              <td>${PREF_CONFIG[spot.category].icon} ${PREF_CONFIG[spot.category].label}</td>
              <td>${spot.duration}分钟</td>
              <td>${spot.description}</td>
            </tr>
          `).join('')).join('')}
        </tbody>
      </table>
    `;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      html2canvas(overlay, {
        width: 1920,
        height: 1080,
        scale: 1,
        useCORS: true,
      }).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `${destination}_旅行路线规划.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        document.body.removeChild(overlay);
      }).catch(() => {
        document.body.removeChild(overlay);
      });
    });
  }, [destination, days, plans]);

  const togglePreference = (pref: Preference) => {
    setPreferences(prev =>
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const coords = CITY_COORDS[destination] || [35.0, 135.0];

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-title">
          <span className="app-title-icon">🗺️</span>
          旅行路线规划
        </div>
        <button
          className="export-btn"
          onClick={handleExport}
          disabled={!isGenerated}
        >
          📥 导出PNG
        </button>
      </header>

      <div className="input-panel">
        <div className="input-group">
          <span className="input-label">目的地</span>
          <input
            className="input-field"
            type="text"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            placeholder="输入城市名称"
          />
        </div>

        <div className="input-group">
          <span className="input-label">天数</span>
          <div className="days-selector">
            {[1, 2, 3, 4, 5, 6, 7].map(d => (
              <button
                key={d}
                className={`day-btn ${days === d ? 'active' : ''}`}
                onClick={() => setDays(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <span className="input-label">兴趣偏好</span>
          <div className="preferences">
            {(Object.keys(PREF_CONFIG) as Preference[]).map(pref => (
              <div
                key={pref}
                className={`pref-chip ${preferences.includes(pref) ? 'active' : ''}`}
                onClick={() => togglePreference(pref)}
              >
                <span className="pref-icon">{PREF_CONFIG[pref].icon}</span>
                {PREF_CONFIG[pref].label}
              </div>
            ))}
          </div>
        </div>

        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={!destination.trim() || preferences.length === 0}
        >
          ✨ 生成路线
        </button>
      </div>

      <div className="content-split">
        <div className="left-panel">
          {!isGenerated ? (
            <div className="empty-state">
              <div className="empty-icon">🌍</div>
              <div className="empty-title">开始规划你的旅行</div>
              <div className="empty-desc">
                输入目的地城市，选择天数和兴趣偏好，点击"生成路线"即可获得个性化的旅行路线规划
              </div>
            </div>
          ) : (
            plans.map(plan => (
              <DayPanel
                key={plan.day}
                plan={plan}
                dayColor={DAY_COLORS[(plan.day - 1) % DAY_COLORS.length]}
                isExpanded={expandedDays.has(plan.day)}
                expandedSpots={expandedSpots}
                onToggleDay={() => toggleDay(plan.day)}
                onToggleSpot={toggleSpot}
                onMoveSpot={handleMoveSpot}
                totalDays={plans.length}
              />
            ))
          )}
        </div>

        <div className="right-panel">
          {!isGenerated ? (
            <div className="map-placeholder">
              <div className="map-placeholder-icon">📍</div>
              <div className="map-placeholder-text">生成路线后在此显示地图</div>
            </div>
          ) : (
            <MapView
              plans={plans}
              center={coords}
            />
          )}
        </div>
      </div>
    </div>
  );
}
