import { useEffect } from 'react';
import { Leaf, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import StatCard from '../components/StatCard';
import PlantCard from '../components/PlantCard';
import Calendar from '../components/Calendar';
import { usePlantStore } from '../stores/plantStore';
import { getCompletedThisMonth, getPendingTasks, getWitheredCount } from '../engine/reminderEngine';
import './Home.css';

export default function Home() {
  const plants = usePlantStore(s => s.plants);
  const tasks = usePlantStore(s => s.tasks);
  const fetchPlants = usePlantStore(s => s.fetchPlants);
  const fetchTasks = usePlantStore(s => s.fetchTasks);

  useEffect(() => {
    fetchPlants();
    fetchTasks();
  }, [fetchPlants, fetchTasks]);

  const totalPlants = plants.length;
  const completedThisMonth = getCompletedThisMonth(tasks);
  const pendingTasks = getPendingTasks(tasks).length;
  const witheredCount = getWitheredCount(plants);
  const recentPlants = plants.slice(0, 4);

  return (
    <div className="home-container">
      <h1 className="page-title">我的花园</h1>

      <div className="stats-row">
        <StatCard label="植物总数" value={totalPlants} icon={<Leaf size={24} />} />
        <StatCard label="本月已办" value={completedThisMonth} icon={<CheckSquare size={24} />} />
        <StatCard label="待办任务" value={pendingTasks} icon={<Clock size={24} />} />
        <StatCard label="枯死告警" value={witheredCount} icon={<AlertTriangle size={24} />} />
      </div>

      <div className="home-layout">
        <div className="home-section plants-section">
          <div className="section-header">
            <h2 className="section-title">最近植物</h2>
            <a href="/plants" className="section-link">查看全部 →</a>
          </div>
          {recentPlants.length === 0 ? (
            <div className="empty-state">
              <Leaf size={48} color="#95A5A6" />
              <p>还没有植物，快去创建第一株吧</p>
              <a href="/plants" className="primary-btn">添加植物</a>
            </div>
          ) : (
            <div className="plants-masonry">
              {recentPlants.map(p => <PlantCard key={p.id} plant={p} />)}
            </div>
          )}
        </div>

        <div className="home-section calendar-section">
          <div className="section-header">
            <h2 className="section-title">养护日历</h2>
          </div>
          <Calendar />
        </div>
      </div>
    </div>
  );
}
