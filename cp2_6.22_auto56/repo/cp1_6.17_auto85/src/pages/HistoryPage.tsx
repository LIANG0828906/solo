import HistoryList from '@/components/HistoryList';
import styles from './HistoryPage.module.css';

export default function HistoryPage() {
  return (
    <div className={styles.page}>
      <HistoryList />
    </div>
  );
}
