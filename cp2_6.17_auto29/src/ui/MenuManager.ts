import { useGameStore } from '../store/gameStore';

export interface MenuRenderState {
  currentScreen: string;
  levels: { id: number; name: string }[];
  currentLevel: number;
  resultStars: number;
  fragments: number;
  totalFragments: number;
}

export class MenuManager {
  mounted: boolean = false;
  startTime: number = 0;

  constructor() {
    this.startTime = performance.now();
  }

  onStartGame = () => {
    const s = useGameStore.getState();
    const levelId = s.currentLevel;
    s.startGame(levelId);
  };

  onSelectLevel = (levelId: number) => {
    useGameStore.setState({ currentLevel: levelId });
  };

  onPlayLevel = (levelId: number) => {
    useGameStore.getState().startGame(levelId);
  };

  onBackToMenu = () => {
    useGameStore.getState().goToMenu();
  };

  onGoLevelSelect = () => {
    useGameStore.getState().goToLevelSelect();
  };

  onRestart = () => {
    useGameStore.getState().resetLevel();
  };
}

export function formatResultMessage(fragments: number, total: number): string {
  if (fragments >= total && total > 0) return '完美通关！所有碎片已收集！';
  if (fragments >= 5) return '出色！获得额外评分奖励！';
  if (fragments >= 3) return '不错！继续努力寻找更多时间碎片。';
  if (fragments >= 1) return '完成关卡！试着收集更多碎片吧。';
  return '完成关卡！';
}

export { };
