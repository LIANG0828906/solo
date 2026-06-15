import { useState, useEffect, useCallback, useRef } from 'react';
import MapContainer from '@/modules/map/MapContainer';
import QuizPanel from '@/modules/quiz/QuizPanel';
import Leaderboard from '@/modules/leaderboard/Leaderboard';
import { addEntry, getLatestEntryId } from '@/modules/leaderboard/StorageService';
import type { CountryInfo, QuizResult, LeaderboardEntry } from '@/types';
import './App.css';

function App() {
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answeredCountries, setAnsweredCountries] = useState<string[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);
  const [latestEntryId, setLatestEntryId] = useState<string | null>(null);
  const sessionSavedRef = useRef(false);

  const handleCountryClick = useCallback((country: CountryInfo) => {
    setSelectedCountry(country);
    setIsQuizOpen(true);

    if (score === 0 && answeredCountries.length === 0) {
      setSessionStartTime(Date.now());
      sessionSavedRef.current = false;
    }
  }, [score, answeredCountries.length]);

  const handleAnswer = useCallback((result: QuizResult) => {
    if (result.isCorrect) {
      setScore((prev) => prev + result.scoreGained);
      setStreak(result.streak);

      if (selectedCountry && !answeredCountries.includes(selectedCountry.name)) {
        setAnsweredCountries((prev) => [...prev, selectedCountry.name]);
      }
    } else {
      setStreak(0);

      if (score > 0 && !sessionSavedRef.current) {
        const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
        const entry: LeaderboardEntry = addEntry(
          score,
          streak,
          duration,
          answeredCountries
        );
        setLatestEntryId(entry.id);
        setLeaderboardRefresh((prev) => prev + 1);
        sessionSavedRef.current = true;
      }
    }
  }, [selectedCountry, answeredCountries, score, streak, sessionStartTime]);

  const handleCloseQuiz = useCallback(() => {
    setIsQuizOpen(false);

    setTimeout(() => {
      setSelectedCountry(null);
    }, 300);
  }, []);

  const handleNewSession = useCallback(() => {
    if (score > 0 && !sessionSavedRef.current) {
      const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
      const entry: LeaderboardEntry = addEntry(
        score,
        streak,
        duration,
        answeredCountries
      );
      setLatestEntryId(entry.id);
      setLeaderboardRefresh((prev) => prev + 1);
    }

    setScore(0);
    setStreak(0);
    setAnsweredCountries([]);
    setSessionStartTime(Date.now());
    sessionSavedRef.current = false;
  }, [score, streak, sessionStartTime, answeredCountries]);

  useEffect(() => {
    const latestId = getLatestEntryId();
    setLatestEntryId(latestId);
  }, []);

  return (
    <div className="app-container">
      <div className="app-header">
        <div className="header-title">
          <span className="title-icon">🌍</span>
          <h1 className="title-text">地理知识探索</h1>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-label">当前得分</span>
            <span className="stat-value">{score}</span>
          </div>
          {streak > 0 && (
            <div className="stat-item streak-item">
              <span className="stat-label">连击</span>
              <span className="stat-value">🔥 {streak}</span>
            </div>
          )}
          {answeredCountries.length > 0 && (
            <div className="stat-item">
              <span className="stat-label">已答题国家</span>
              <span className="stat-value">{answeredCountries.length}</span>
            </div>
          )}
          {score > 0 && (
            <button className="reset-button" onClick={handleNewSession}>
              新游戏
            </button>
          )}
        </div>
      </div>

      <div className="map-container">
        <MapContainer onCountryClick={handleCountryClick} />
      </div>

      <QuizPanel
        isOpen={isQuizOpen}
        country={selectedCountry}
        currentScore={score}
        currentStreak={streak}
        onClose={handleCloseQuiz}
        onAnswer={handleAnswer}
      />

      <Leaderboard
        latestEntryId={latestEntryId}
        refreshTrigger={leaderboardRefresh}
      />
    </div>
  );
}

export default App;
