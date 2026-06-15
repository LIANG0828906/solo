export interface RegionData {
  province: string;
  cities: { city: string; regions: string[] }[];
}

export const regionData: RegionData[] = [
  {
    province: '浙江省',
    cities: [
      { city: '杭州市', regions: ['西湖区', '龙井村', '梅家坞'] },
      { city: '湖州市', regions: ['安吉县', '长兴县'] },
      { city: '绍兴市', regions: ['新昌县', '嵊州市'] },
      { city: '金华市', regions: ['东阳市', '武义县'] },
    ],
  },
  {
    province: '福建省',
    cities: [
      { city: '南平市', regions: ['武夷山市', '建瓯市'] },
      { city: '泉州市', regions: ['安溪县', '永春县'] },
      { city: '宁德市', regions: ['福鼎市', '政和县', '福安市'] },
      { city: '福州市', regions: ['闽侯县', '罗源县'] },
    ],
  },
  {
    province: '云南省',
    cities: [
      { city: '西双版纳', regions: ['勐海县', '勐腊县', '景洪市'] },
      { city: '普洱市', regions: ['思茅区', '宁洱县'] },
      { city: '临沧市', regions: ['凤庆县', '双江县'] },
      { city: '大理州', regions: ['大理市', '巍山县'] },
    ],
  },
  {
    province: '湖南省',
    cities: [
      { city: '岳阳市', regions: ['君山区', '湘阴县'] },
      { city: '益阳市', regions: ['安化县', '桃江县'] },
      { city: '长沙市', regions: ['长沙县', '望城区'] },
    ],
  },
  {
    province: '安徽省',
    cities: [
      { city: '黄山市', regions: ['黄山区', '祁门县', '休宁县'] },
      { city: '六安市', regions: ['金寨县', '霍山县'] },
      { city: '池州市', regions: ['石台县', '贵池区'] },
    ],
  },
  {
    province: '江苏省',
    cities: [
      { city: '苏州市', regions: ['吴中区', '虎丘区'] },
      { city: '无锡市', regions: ['宜兴市'] },
      { city: '南京市', regions: ['雨花台区', '江宁区'] },
    ],
  },
  {
    province: '四川省',
    cities: [
      { city: '雅安市', regions: ['名山区', '雨城区'] },
      { city: '成都市', regions: ['蒲江县', '邛崃市'] },
      { city: '乐山市', regions: ['峨眉山市', '沐川县'] },
    ],
  },
  {
    province: '广东省',
    cities: [
      { city: '潮州市', regions: ['潮安区', '饶平县'] },
      { city: '江门市', regions: ['新会区', '台山市'] },
      { city: '英德市', regions: ['英红镇', '横石塘镇'] },
    ],
  },
  {
    province: '台湾省',
    cities: [
      { city: '南投县', regions: ['鹿谷乡', '鱼池乡'] },
      { city: '新北市', regions: ['坪林区', '石碇区'] },
      { city: '嘉义县', regions: ['梅山乡', '阿里山乡'] },
    ],
  },
  {
    province: '贵州省',
    cities: [
      { city: '遵义市', regions: ['湄潭县', '凤冈县'] },
      { city: '贵阳市', regions: ['花溪区', '开阳县'] },
      { city: '黔南州', regions: ['都匀市', '贵定县'] },
    ],
  },
];

export const getProvinces = (): string[] => regionData.map((r) => r.province);

export const getCities = (province: string): string[] => {
  const p = regionData.find((r) => r.province === province);
  return p ? p.cities.map((c) => c.city) : [];
};

export const getRegions = (province: string, city: string): string[] => {
  const p = regionData.find((r) => r.province === province);
  const c = p?.cities.find((x) => x.city === city);
  return c ? c.regions : [];
};
