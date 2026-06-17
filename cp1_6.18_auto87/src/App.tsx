import { useMoodStore } from './store';
import WeatherCanvas from './components/WeatherCanvas';
import MoodPicker from './components/MoodPicker';
import InfoCard from './components/InfoCard';
import { getCurrentWeekNumber } from './data';

function App() {
  const currentWeek = useMoodStore((state) => state.currentWeek);
  const goToPrevWeek = useMoodStore((state) => state.goToPrevWeek);
  const goToNextWeek = useMoodStore((state) => state.goToNextWeek);
  const setMoodPickerOpen = useMoodStore((state) => state.setMoodPickerOpen);

  const maxWeek = getCurrentWeekNumber();
  const canGoPrev = currentWeek > 1;
  const canGoNext = currentWeek < maxWeek;

  const handleCheckin = () => {
    setMoodPickerOpen(true);
  };

  return (
    <>
      <div className="toolbar">
        <h1 className="toolbar__title">第 {currentWeek} 周情绪气象</h1>
        <div className="toolbar__nav">
          <button
            className="toolbar__btn"
            onClick={goToPrevWeek}
            disabled={!canGoPrev}
            aria-label="上一周"
          >
            ‹
          </button>
          <button
            className="toolbar__btn"
            onClick={goToNextWeek}
            disabled={!canGoNext}
            aria-label="下一周"
          >
            ›
          </button>
        </div>
      </div>

      <WeatherCanvas />

      <InfoCard />

      <button
        className="checkin-btn"
        onClick={handleCheckin}
        aria-label="打卡记录心情"
      >
        ✏️
      </button>

      <MoodPicker />
    </>
  );
}

export default App;
