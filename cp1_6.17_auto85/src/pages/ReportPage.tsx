import { useNavigate } from 'react-router-dom';
import TrainingReport from '@/components/TrainingReport';
import { useTrainingStore } from '@/stores/trainingStore';
import styles from './ReportPage.module.css';

export default function ReportPage() {
  const { currentReport } = useTrainingStore();
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <h1 className={styles.title}>训练报告</h1>
        {currentReport && (
          <div className={styles.actionBadge}>{currentReport.actionName}</div>
        )}
      </div>

      <div className={styles.content}>
        <TrainingReport />
      </div>
    </div>
  );
}
