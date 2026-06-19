import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { COLORS } from '../utils/pixelArt';

const statusBarSelector = (state: {
  stats: { mood: number; hunger: number; cleanliness: number; energy: number };
  level: number;
  experience: number;
}) => ({
  stats: state.stats,
  level: state.level,
  experience: state.experience,
});

const statusMessages = [
  { key: 'mood_high', condition: (s: { mood: number }) => s.mood >= 80, text: '心情很好呢~' },
  { key: 'mood_good', condition: (s: { mood: number }) => s.mood >= 60 && s.mood < 80, text: '心情不错哦！' },
  { key: 'mood_low', condition: (s: { mood: number }) => s.mood >= 30 && s.mood < 60, text: '有点无聊...' },
  { key: 'mood_sad', condition: (s: { mood: number }) => s.mood > 0 && s.mood < 30, text: '呜呜，不开心...' },
  { key: 'hunger_high', condition: (s: { hunger: number }) => s.hunger >= 80, text: '吃得饱饱的~' },
  { key: 'hunger_ok', condition: (s: { hunger: number }) => s.hunger >= 60 && s.hunger < 80, text: '还不饿呢' },
  { key: 'hunger_low', condition: (s: { hunger: number }) => s.hunger >= 30 && s.hunger < 60, text: '有点饿了' },
  { key: 'hunger_starving', condition: (s: { hunger: number }) => s.hunger > 0 && s.hunger < 30, text: '好饿啊...想吃东西...' },
  { key: 'clean_high', condition: (s: { cleanliness: number }) => s.cleanliness >= 80, text: '干干净净的！' },
  { key: 'clean_ok', condition: (s: { cleanliness: number }) => s.cleanliness >= 60 && s.cleanliness < 80, text: '还挺干净的' },
  { key: 'clean_low', condition: (s: { cleanliness: number }) => s.cleanliness >= 30 && s.cleanliness < 60, text: '有点脏了...' },
  { key: 'clean_dirty', condition: (s: { cleanliness: number }) => s.cleanliness > 0 && s.cleanliness < 30, text: '脏兮兮的...该洗澡了...' },
  { key: 'energy_high', condition: (s: { energy: number }) => s.energy >= 80, text: '精力充沛！' },
  { key: 'energy_ok', condition: (s: { energy: number }) => s.energy >= 60 && s.energy < 80, text: '状态不错~' },
  { key: 'energy_low', condition: (s: { energy: number }) => s.energy >= 30 && s.energy < 60, text: '有点累了...' },
  { key: 'energy_tired', condition: (s: { energy: number }) => s.energy > 0 && s.energy < 30, text: '好累...想睡觉...' },
  { key: 'faint', condition: (s: { mood: number; hunger: number; cleanliness: number; energy: number }) => Math.min(s.mood, s.hunger, s.cleanliness, s.energy) <= 0, text: '...晕倒了...快照顾我...' },
];

export default function StatusBar() {
  const { stats, level, experience } = useGameStore(statusBarSelector);
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const availableMessages = statusMessages.filter((msg) => msg.condition(stats));

    if (availableMessages.length === 0) {
      setCurrentMessage('状态正常~');
      return;
    }

    const getLowestStat = () => {
      const statNames = [
        { name: 'mood', value: stats.mood },
        { name: 'hunger', value: stats.hunger },
        { name: 'cleanliness', value: stats.cleanliness },
        { name: 'energy', value: stats.energy },
      ];
      return statNames.sort((a, b) => a.value - b.value)[0].name;
    };

    const lowestStat = getLowestStat();
    const priorityMessages = availableMessages.filter((msg) =>
      msg.key.startsWith(lowestStat)
    );

    const messagePool = priorityMessages.length > 0 ? priorityMessages : availableMessages;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messagePool.length);
    }, 2000);

    setCurrentMessage(messagePool[messageIndex % messagePool.length].text);

    return () => clearInterval(interval);
  }, [stats, messageIndex]);

  const expProgress = (experience / 20) * 100;

  return (
    <div className="status-bar-container" style={{ borderColor: COLORS.SPRITE_OUTLINE }}>
      <div className="level-info">
        <span className="level-label">Lv.{level}</span>
        <div className="exp-bar-container">
          <div
            className="exp-bar-fill"
            style={{
              width: `${expProgress}%`,
              backgroundColor: COLORS.BAR_YELLOW,
            }}
          />
          <span className="exp-text">{experience}/20</span>
        </div>
      </div>
      <div className="marquee-container">
        <div className="marquee-text" style={{ color: COLORS.SPRITE_OUTLINE }}>
          {currentMessage}
        </div>
      </div>
    </div>
  );
}
