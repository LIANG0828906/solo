import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store';
import ScoreBoard from './components/ScoreBoard';
import { CATEGORY_CONFIG, CategoryType, GradeType } from './types';

const App = () => {
  const {
    students,
    showModal,
    selectedStudent,
    animatedScores,
    fetchRecords,
    fetchRanking,
    submitRecord,
    setSelectedStudent,
    setShowModal,
    getStudentScore
  } = useStore();

  useEffect(() => {
    fetchRecords();
    fetchRanking();
  }, [fetchRecords, fetchRanking]);

  const handleStudentClick = (student: typeof students[0]) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedStudent(null), 300);
  };

  const handleGrade = (category: CategoryType, grade: GradeType) => {
    if (selectedStudent) {
      submitRecord(selectedStudent.id, category, grade);
    }
  };

  const rows = useMemo(() => {
    const rowMap = new Map<number, typeof students>();
    students.forEach(student => {
      if (!rowMap.has(student.seatRow)) {
        rowMap.set(student.seatRow, []);
      }
      rowMap.get(student.seatRow)!.push(student);
    });
    return Array.from(rowMap.values()).map(row => 
      row.sort((a, b) => a.seatCol - b.seatCol)
    );
  }, [students]);

  return (
    <div>
      <motion.header
        className="page-header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>白鹿洞书院</h1>
        <p>学规考核 · 文会积分 · 月课评定</p>
      </motion.header>

      <motion.div
        className="lecture-hall"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="hall-screen"></div>
        
        <div className="hall-window left">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="hall-window-pane"></div>
          ))}
        </div>
        
        <div className="hall-window right">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="hall-window-pane"></div>
          ))}
        </div>

        <div className="students-area">
          {rows.map((row, rowIndex) => (
            <motion.div
              key={rowIndex}
              className="student-row"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + rowIndex * 0.15 }}
            >
              {row.map(student => (
                <motion.div
                  key={student.id}
                  className="student-seat"
                  onClick={() => handleStudentClick(student)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="desk"></div>
                  <motion.div
                    className="student-tag"
                    animate={animatedScores[student.id] ? {
                      scale: [1, 1.1, 1],
                      transition: { duration: 0.3 }
                    } : {}}
                  >
                    {student.name}
                    <span className="student-score">{getStudentScore(student.id)}</span>
                    
                    {animatedScores[student.id] && (
                      <motion.span
                        className={`score-animation ${animatedScores[student.id].type}`}
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: [1, 1, 0], y: [0, -20, -40] }}
                        transition={{ duration: 1 }}
                      >
                        {animatedScores[student.id].type === 'add' ? '+' : '-'}
                        {animatedScores[student.id].score}
                      </motion.span>
                    )}
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <ScoreBoard />

      <AnimatePresence>
        {showModal && selectedStudent && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <motion.div
              className="bamboo-scroll"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="close-button" onClick={handleCloseModal}>
                ×
              </button>
              
              <div className="bamboo-scroll-content">
                <h2 className="modal-title">学规考核</h2>
                <div className="modal-student-name">{selectedStudent.name}</div>

                {(Object.keys(CATEGORY_CONFIG) as CategoryType[]).map(category => (
                  <motion.div
                    key={category}
                    className="category-section"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="category-title">
                      {CATEGORY_CONFIG[category].name}
                    </div>
                    <div className="category-scores">
                      <span className="score-badge good">
                        优秀 +{CATEGORY_CONFIG[category].good}
                      </span>
                      <span className="score-badge bad">
                        不合格 {CATEGORY_CONFIG[category].bad}
                      </span>
                    </div>
                    <div className="grade-buttons">
                      <motion.button
                        className="ring-button good"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleGrade(category, 'good')}
                      >
                        优
                      </motion.button>
                      <motion.button
                        className="ring-button bad"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleGrade(category, 'bad')}
                      >
                        劣
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
