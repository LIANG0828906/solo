import React, { useEffect, useState } from 'react';
import { AssignmentBoard } from './assignment/AssignmentBoard';
import { store } from './store';
import { AppState } from './types';

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>(store.getState());

  useEffect(() => {
    const unsub = store.subscribe(() => setState({ ...store.getState() }));
    return unsub;
  }, []);

  return (
    <div className="app-root">
      <nav className="top-nav">
        <div className="logo-circle">校</div>
        <div className="nav-title">学生作业互评与评分一致性分析系统</div>
        <div className="nav-actions">
          <select
            value={state.userRole}
            onChange={(e) => {
              if (e.target.value === 'teacher') store.setCurrentUser('T001');
              else store.setCurrentUser('S001');
              store.toggleRole();
            }}
          >
            <option value="teacher">教师视角</option>
            <option value="student">学生视角</option>
          </select>
          {state.userRole === 'student' && (
            <select
              value={state.currentUserId}
              onChange={(e) => store.setCurrentUser(e.target.value)}
            >
              {state.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </nav>
      <AssignmentBoard />
    </div>
  );
};

export default App;
