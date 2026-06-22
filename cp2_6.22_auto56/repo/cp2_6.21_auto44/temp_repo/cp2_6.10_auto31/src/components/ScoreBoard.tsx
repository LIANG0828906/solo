import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { CATEGORY_CONFIG } from '../types';

const ScoreBoard = () => {
  const { ranking, isLoading, expandedAward, setExpandedAward, getStudentRecords, resetMonth } = useStore();
  
  const maxScore = ranking.length > 0 ? Math.max(...ranking.map(r => r.totalScore)) : 0;
  
  const handleCoinClick = (studentId: string) => {
    if (expandedAward === studentId) {
      setExpandedAward(null);
    } else {
      setExpandedAward(studentId);
    }
  };
  
  const getCoinText = (award?: string) => {
    switch (award) {
      case 'first': return '状元';
      case 'second': return '榜眼';
      case 'third': return '探花';
      default: return '';
    }
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };
  
  const awardWinners = ranking.filter(r => r.award);
  
  if (isLoading) {
    return (
      <div className="scoreboard">
        <div className="loading">正在加载排行数据...</div>
      </div>
    );
  }
  
  return (
    <div className="scoreboard">
      <div className="scoreboard-header">
        <h2 className="scoreboard-title">文会积分榜</h2>
        <p className="scoreboard-subtitle">{new Date().getFullYear()}年{new Date().getMonth() + 1}月</p>
      </div>
      
      {awardWinners.length > 0 && (
        <div className="awards-section">
          {awardWinners.map(item => (
            <motion.div
              key={item.studentId}
              className="award-item"
              onClick={() => handleCoinClick(item.studentId)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: item.rank! * 0.1 }}
            >
              <motion.div
                className={`award-coin ${item.award}`}
                whileHover={{ y: -5 }}
                animate={{
                  boxShadow: expandedAward === item.studentId 
                    ? '0 0 20px rgba(255, 215, 0, 0.8)' 
                    : '0 4px 15px rgba(184, 134, 11, 0.5)'
                }}
              >
                {getCoinText(item.award)}
              </motion.div>
              <div className="award-name">{item.studentName}</div>
              <div className="award-score">{item.totalScore} 分</div>
              
              <AnimatePresence>
                {expandedAward === item.studentId && (
                  <motion.div
                    className="award-detail"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {getStudentRecords(item.studentId).length > 0 ? (
                      getStudentRecords(item.studentId).map(record => (
                        <div key={record.id} className="timeline-item">
                          <div className="timeline-date">{formatDate(record.timestamp)}</div>
                          <div>
                            {CATEGORY_CONFIG[record.category].name} - 
                            {record.grade === 'good' ? '优秀' : '不合格'}
                            <span className={`timeline-score ${record.score > 0 ? 'positive' : 'negative'}`}>
                              {' '}{record.score > 0 ? '+' : ''}{record.score}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">暂无考核记录</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
      
      {ranking.length > 0 ? (
        <>
          <div className="ranking-chart">
            {ranking.map((item, index) => (
              <motion.div
                key={item.studentId}
                className="ranking-bar-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <motion.div
                  className="ranking-bar"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((item.totalScore / maxScore) * 250, 10)}px` }}
                  transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                >
                  <span className="ranking-bar-score">{item.totalScore}</span>
                </motion.div>
                <span className="ranking-bar-name">{item.studentName}</span>
                <span className="ranking-bar-rank">第{item.rank}名</span>
              </motion.div>
            ))}
          </div>
          
          <table className="ranking-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>姓名</th>
                <th>积分</th>
                <th>奖项</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(item => (
                <tr key={item.studentId}>
                  <td>{item.rank}</td>
                  <td>{item.studentName}</td>
                  <td>{item.totalScore}</td>
                  <td>{getCoinText(item.award) || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div className="empty-state">本月暂无考核记录，请先为生徒评定成绩</div>
      )}
      
      <button className="reset-button" onClick={resetMonth}>
        重置本月数据
      </button>
    </div>
  );
};

export default ScoreBoard;
