import React, { useEffect } from 'react';
import { FileTree } from './components/FileTree';
import { SearchBar } from './components/SearchBar';
import { GraphView } from './components/GraphView';
import { StatsBar } from './components/StatsBar';
import { CycleModal } from './components/CycleModal';
import { useGraphStore } from './store';
import styles from './App.module.css';

const App: React.FC = () => {
  const loadDemo = useGraphStore((s) => s.loadDemo);
  const showFileTree = useGraphStore((s) => s.showFileTree);
  const toggleFileTree = useGraphStore((s) => s.toggleFileTree);
  const breadcrumbs = useGraphStore((s) => s.breadcrumbs);
  const getNodeById = useGraphStore((s) => s.getNodeById);
  const goBack = useGraphStore((s) => s.goBack);
  const graph = useGraphStore((s) => s.graph);

  useEffect(() => {
    loadDemo();
  }, [loadDemo]);

  return (
    <div className={styles.app}>
      <button
        type="button"
        className={styles.hamburger}
        onClick={toggleFileTree}
        aria-label="toggle file tree"
      >
        ☰
      </button>

      <div className={showFileTree ? '' : styles.panelHidden}>
        <FileTree />
      </div>

      <div className={styles.main}>
        <div className={styles.topBar}>
          <div className={styles.appHeader}>
            <div className={styles.brand}>
              <span className={styles.brandIcon}>🕸️</span>
              <div>
                <div className={styles.brandName}>Deptrail</div>
                <div className={styles.brandSub}>
                  {graph ? `解析 ${graph.nodes.filter((n) => !n.isDirectory).length} 个文件` : '语义化依赖分析'}
                </div>
              </div>
            </div>
            {breadcrumbs.length > 0 && (
              <div className={styles.breadcrumbs}>
                <span className={styles.crumb} onClick={() => goBack(0)}>
                  🏠 根
                </span>
                {breadcrumbs.map((id, i) => {
                  const node = getNodeById(id);
                  const isLast = i === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={id}>
                      <span className={styles.crumbSep}>/</span>
                      <span
                        className={`${styles.crumb} ${isLast ? styles.active : ''}`}
                        onClick={() => !isLast && goBack(i + 1)}
                      >
                        📄 {node?.name ?? id.slice(0, 6)}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className={styles.graphArea}>
          <div className={styles.searchWrap}>
            <SearchBar />
          </div>
          <div className={styles.graphInner}>
            <GraphView />
          </div>
          <StatsBar />
        </div>
      </div>

      <CycleModal />
    </div>
  );
};

export default App;
