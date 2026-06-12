import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Board from './components/Board';
import { User } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [teamName, setTeamName] = useState<string>('');

  useEffect(() => {
    const savedUser = localStorage.getItem('brainstorm_user');
    const savedTeam = localStorage.getItem('brainstorm_team');
    if (savedUser && savedTeam) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setTeamName(savedTeam);
      } catch (e) {
        console.error('Failed to parse saved user');
      }
    }
  }, []);

  const handleLogin = (nickname: string, team: string, color: string) => {
    const newUser: User = {
      id: uuidv4(),
      nickname,
      color,
      teamName: team,
      votesRemaining: 5,
    };
    setUser(newUser);
    setTeamName(team);
    localStorage.setItem('brainstorm_user', JSON.stringify(newUser));
    localStorage.setItem('brainstorm_team', team);
  };

  if (!user || !teamName) {
    return <Login onLogin={handleLogin} />;
  }

  return <Board teamName={teamName} user={user} />;
};

export default App;
