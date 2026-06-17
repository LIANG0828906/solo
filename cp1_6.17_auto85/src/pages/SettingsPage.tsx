import { useTrainingStore } from '@/stores/trainingStore';
import type { ActionType } from '@/types';
import styles from './SettingsPage.module.css';

const actions: { key: ActionType; label: string; icon: string; desc: string }[] = [
  { key: 'squat', label: '深蹲', icon: '🦵', desc: '锻炼腿部和臀部肌肉' },
  { key: 'pushup', label: '俯卧撑', icon: '💪', desc: '锻炼胸部、肩部和三头肌' },
  { key: 'pullup', label: '引体向上', icon: '🏋️', desc: '锻炼背部和二头肌' },
];

export default function SettingsPage() {
  const { currentAction, setCurrentAction, history } = useTrainingStore();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>设置</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>默认训练动作</h2>
        <p className={styles.sectionDesc}>
          选择你最常进行的训练动作，打开应用时将默认选中
        </p>

        <div className={styles.actionList}>
          {actions.map((action) => (
            <button
              key={action.key}
              className={`${styles.actionCard} ${
                currentAction === action.key ? styles.active : ''
              }`}
              onClick={() => setCurrentAction(action.key)}
            >
              <div className={styles.actionIcon}>{action.icon}</div>
              <div className={styles.actionInfo}>
                <div className={styles.actionName}>{action.label}</div>
                <div className={styles.actionDesc}>{action.desc}</div>
              </div>
              <div className={styles.checkMark}>
                {currentAction === action.key && '✓'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>数据统计</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{history.length}</div>
            <div className={styles.statLabel}>训练次数</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {history.length > 0
                ? Math.round(
                    history.reduce((sum, r) => sum + r.totalScore, 0) /
                      history.length
                  )
                : 0}
            </div>
            <div className={styles.statLabel}>平均评分</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {Math.round(
                history.reduce((sum, r) => sum + r.duration, 0) / 60
              )}
            </div>
            <div className={styles.statLabel}>总时长(分钟)</div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>关于</h2>
        <div className={styles.about}>
          <p>FitPose v1.0.0</p>
          <p className={styles.aboutDesc}>
            基于 MediaPipe Pose 的智能健身姿态评估系统
          </p>
        </div>
      </div>
    </div>
  );
}
