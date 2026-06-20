import { Routes, Route } from 'react-router-dom';
import TaskList from './TaskList';
import TaskDetail from './TaskDetail';

export default function TaskModule() {
  return (
    <Routes>
      <Route path="/" element={<TaskList />} />
      <Route path="/task/:id" element={<TaskDetail />} />
    </Routes>
  );
}
