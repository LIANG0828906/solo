export interface FeedbackEntry {
  stageDesc: string;
  soundEffect: string;
  colorFilter: string;
}

export const feedbackMap: Record<string, FeedbackEntry> = {
  '勇敢面对': {
    stageDesc: '风暴中的城堡废墟，闪电照亮残垣断壁',
    soundEffect: '雷鸣与狂风',
    colorFilter: '#1a1a2e',
  },
  '悄悄逃离': {
    stageDesc: '月光下的密道，微弱的火把映照石壁',
    soundEffect: '滴水与回声',
    colorFilter: '#16213e',
  },
  '寻求帮助': {
    stageDesc: '热闹的城镇广场，灯笼高挂人群聚集',
    soundEffect: '人声与钟声',
    colorFilter: '#2d1b69',
  },
  '隐藏真相': {
    stageDesc: '阴暗的书房，烛光摇曳映照古旧地图',
    soundEffect: '纸张翻动与低语',
    colorFilter: '#0f3460',
  },
  '正面对决': {
    stageDesc: '悬崖之巅，狂风呼啸剑拔弩张',
    soundEffect: '金属碰撞与风啸',
    colorFilter: '#e94560',
  },
  '智取诡计': {
    stageDesc: '迷宫般的地下通道，机关暗门遍布',
    soundEffect: '齿轮转动与水流',
    colorFilter: '#533483',
  },
};

export const defaultFeedback: FeedbackEntry = {
  stageDesc: '未知的舞台，等待剧情揭晓...',
  soundEffect: '寂静',
  colorFilter: '#0D1117',
};
