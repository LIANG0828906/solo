import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  MilitaryReport,
  WeatherData,
  WindDirection,
  UrgencyLevel,
  EnemyCount,
  DecryptStep,
  EncryptResponse,
  DecryptResponse,
  FANQIE_MAP,
  WUXING_MAP,
} from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const windDirections: WindDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const urgencyLevels: UrgencyLevel[] = ['normal', 'urgent', 'emergency'];
const enemyCounts: EnemyCount[] = ['hundred', 'thousand', 'tenThousand'];

const enemyDescriptions = [
  { plain: '北虏三千骑出没', encrypted: '火生土-甲子-北虏三千骑出没' },
  { plain: '东虏千人夜袭', encrypted: '木生火-丙寅-东虏千人夜袭' },
  { plain: '西番万骑压境', encrypted: '金生水-庚申-西番万骑压境' },
  { plain: '南蛮数百人犯边', encrypted: '火克金-丁巳-南蛮数百人犯边' },
  { plain: '北敌万人围城', encrypted: '水克火-壬子-北敌万人围城' },
  { plain: '东胡八千骑寇边', encrypted: '木克土-甲寅-东胡八千骑寇边' },
  { plain: '西戎三千骑来袭', encrypted: '金克木-甲申-西戎三千骑来袭' },
  { plain: '南寇五百人骚扰', encrypted: '土克水-戊子-南寇五百人骚扰' },
  { plain: '北狄千骑掠境', encrypted: '水生木-癸亥-北狄千骑掠境' },
  { plain: '土蛮万人入寇', encrypted: '土生金-戊戌-土蛮万人入寇' },
];

function generateWeather(): WeatherData {
  return {
    windDirection: windDirections[Math.floor(Math.random() * windDirections.length)],
    windSpeed: Math.floor(Math.random() * 5),
  };
}

function getUrgencyFromEnemyCount(count: EnemyCount): UrgencyLevel {
  switch (count) {
    case 'hundred': return 'normal';
    case 'thousand': return 'urgent';
    case 'tenThousand': return 'emergency';
  }
}

function generateReport(): MilitaryReport {
  const desc = enemyDescriptions[Math.floor(Math.random() * enemyDescriptions.length)];
  const enemyCount = enemyCounts[Math.floor(Math.random() * enemyCounts.length)];
  const urgency = getUrgencyFromEnemyCount(enemyCount);
  
  return {
    id: uuidv4(),
    encryptedText: desc.encrypted,
    plainText: desc.plain,
    urgency,
    sourcePosition: {
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
    },
    enemyCount,
    receivedAt: Date.now(),
    isDecrypted: false,
  };
}

function performFanqieDecrypt(text: string): string {
  const parts = text.split('-');
  if (parts.length < 3) return text;
  
  const wuxingPart = parts[0];
  const result = wuxingPart.split('').map(char => {
    if (FANQIE_MAP[char]) {
      const { sheng, yun } = FANQIE_MAP[char];
      return `${char}(${sheng}+${yun})`;
    }
    return char;
  }).join('');
  
  return result;
}

function performWuxingDecrypt(text: string): string {
  const parts = text.split('-');
  if (parts.length < 2) return text;
  
  const wuxingPart = parts[0];
  const result = wuxingPart.split('').map(char => {
    if (WUXING_MAP[char]) {
      const { num, dir } = WUXING_MAP[char];
      return `${char}→${num}(${dir})`;
    }
    return char;
  }).join('');
  
  return result;
}

app.get('/api/encrypt', (_req, res) => {
  const report = generateReport();
  const weather = generateWeather();
  
  const response: EncryptResponse = {
    report,
    weather,
  };
  
  res.json(response);
});

app.post('/api/decrypt', (req, res) => {
  const { reportId, step } = req.body as { reportId: string; step: DecryptStep };
  
  if (!reportId || !step) {
    return res.status(400).json({ success: false, error: 'Missing parameters' });
  }
  
  const report = generateReport();
  let response: DecryptResponse;
  
  switch (step) {
    case 'fanqie':
      response = {
        success: true,
        stepResult: performFanqieDecrypt(report.encryptedText),
        nextStep: 'wuxing',
      };
      break;
      
    case 'wuxing':
      response = {
        success: true,
        stepResult: performWuxingDecrypt(report.encryptedText),
        nextStep: 'complete',
      };
      break;
      
    case 'complete':
      response = {
        success: true,
        plainText: report.plainText,
        nextStep: 'idle',
      };
      break;
      
    default:
      response = {
        success: false,
        error: 'Invalid step',
      };
  }
  
  res.json(response);
});

app.get('/api/weather', (_req, res) => {
  res.json(generateWeather());
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
