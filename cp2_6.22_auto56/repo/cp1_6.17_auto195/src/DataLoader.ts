import { EventBus, CountryEnergyData, YearlyData } from './EventBus';

const MOCK_CSV_DATA = `name,code,primaryEnergy,year,renewable,fossil,nuclear,totalConsumption
中国,CN,fossil,2000,2,82,16,1250
中国,CN,fossil,2005,3,80,17,1980
中国,CN,fossil,2010,6,77,17,3020
中国,CN,fossil,2015,11,72,17,3850
中国,CN,fossil,2020,15,68,17,4200
美国,US,fossil,2000,4,75,21,2300
美国,US,fossil,2005,5,73,22,2450
美国,US,fossil,2010,8,70,22,2380
美国,US,fossil,2015,11,67,22,2320
美国,US,fossil,2020,14,64,22,2180
德国,DE,renewable,2000,3,70,27,420
德国,DE,renewable,2005,6,65,29,430
德国,DE,renewable,2010,14,56,30,435
德国,DE,renewable,2015,26,45,29,390
德国,DE,renewable,2020,42,30,28,340
法国,FR,nuclear,2000,4,20,76,310
法国,FR,nuclear,2005,5,21,74,315
法国,FR,nuclear,2010,7,18,75,300
法国,FR,nuclear,2015,12,15,73,275
法国,FR,nuclear,2020,18,12,70,250
日本,JP,fossil,2000,3,60,37,620
日本,JP,fossil,2005,3,62,35,600
日本,JP,fossil,2010,4,65,31,590
日本,JP,fossil,2015,8,78,14,540
日本,JP,fossil,2020,12,74,14,510
印度,IN,fossil,2000,3,85,12,280
印度,IN,fossil,2005,4,83,13,420
印度,IN,fossil,2010,5,80,15,680
印度,IN,fossil,2015,8,76,16,920
印度,IN,fossil,2020,12,72,16,1150
巴西,BR,renewable,2000,40,52,8,210
巴西,BR,renewable,2005,42,50,8,250
巴西,BR,renewable,2010,45,47,8,320
巴西,BR,renewable,2015,48,44,8,370
巴西,BR,renewable,2020,52,40,8,390
俄罗斯,RU,fossil,2000,1,77,22,650
俄罗斯,RU,fossil,2005,1,76,23,700
俄罗斯,RU,fossil,2010,2,74,24,720
俄罗斯,RU,fossil,2015,3,72,25,710
俄罗斯,RU,fossil,2020,4,70,26,690
加拿大,CA,nuclear,2000,12,58,30,340
加拿大,CA,nuclear,2005,14,56,30,350
加拿大,CA,nuclear,2010,16,54,30,345
加拿大,CA,nuclear,2015,20,51,29,330
加拿大,CA,nuclear,2020,24,48,28,310
瑞典,SE,renewable,2000,28,35,37,70
瑞典,SE,renewable,2005,32,30,38,72
瑞典,SE,renewable,2010,42,22,36,75
瑞典,SE,renewable,2015,55,15,30,73
瑞典,SE,renewable,2020,65,10,25,68`;

export class DataLoader {
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  public load(): void {
    setTimeout(() => {
      const data = this.parseCSV(MOCK_CSV_DATA);
      this.eventBus.emit('data-loaded', data);
    }, 500);
  }

  private parseCSV(csv: string): CountryEnergyData[] {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',');
    const dataRows = lines.slice(1);

    const countryMap = new Map<string, CountryEnergyData>();

    for (const row of dataRows) {
      const values = row.split(',');
      const name = values[headers.indexOf('name')];
      const code = values[headers.indexOf('code')];
      const primaryEnergy = values[headers.indexOf('primaryEnergy')] as 'renewable' | 'fossil' | 'nuclear';
      const year = parseInt(values[headers.indexOf('year')], 10);
      const renewable = parseFloat(values[headers.indexOf('renewable')]);
      const fossil = parseFloat(values[headers.indexOf('fossil')]);
      const nuclear = parseFloat(values[headers.indexOf('nuclear')]);
      const totalConsumption = parseFloat(values[headers.indexOf('totalConsumption')]);

      const yearlyData: YearlyData = { year, renewable, fossil, nuclear, totalConsumption };

      if (!countryMap.has(code)) {
        countryMap.set(code, {
          name,
          code,
          primaryEnergy,
          yearlyData: [],
        });
      }

      countryMap.get(code)!.yearlyData.push(yearlyData);
    }

    return Array.from(countryMap.values());
  }
}
