import type { CaseEntry } from '@/types';

export const mockCases: CaseEntry[] = [
  {
    id: 'case-001',
    caseNumber: '吳字第一二四號',
    caseType: 'homicide',
    plaintiff: '王阿狗',
    receiveTime: '光緒二十六年三月十五日辰時',
    urgency: 'high',
    status: 'pending',
    paperContent: `具狀人王阿狗，年四十歲，係本縣東鄉人，為兄長被殺慘無人道，籲請緝兇抵償事。

緣民兄王阿牛，於本月十三日午後，攜銀五兩前往城內採買農具。行至西門外三里橋地方，遇有素識之張三，兩人因舊欠細故口角爭毆。據路人李老四目睹，張三拾起路旁石塊，猛擊民兄頭部，當即倒地。張三見勢不妙，拔腿逃去。

民聞訊趕至，兄已氣絕。現場遺有兇器石塊一枚，沾有血跡；另有銀包一個，內剩銀三兩。伏乞大老爺明鏡高懸，緝拿兇犯到案，依律懲辦，以儆兇頑而慰亡靈。

為此上叩，伏乞
太老爺台前施行。
光緒二十六年三月十五日 具狀人王阿狗`,
    witnesses: [
      { id: 'w-001', name: '李老四', avatar: '👨‍🌾', testimony: '那日午後，我在田裡幹活，親眼看見張三與王阿牛爭吵，張三拾起石頭打了王阿牛頭部一下，王阿牛當即倒下。', selected: false },
      { id: 'w-002', name: '趙寡婦', avatar: '👩', testimony: '我在橋邊洗衣服，聽到吵鬧聲，抬頭看時，見一個穿藍衣的漢子往東跑了，後來才知道出了人命。', selected: false },
    ],
    evidences: [
      { id: 'e-001', name: '兇器石塊', icon: '🪨', description: '現場遺留的帶血石塊，重約二斤', selected: false },
      { id: 'e-002', name: '銀包', icon: '💰', description: '死者遺留的銀包，內有銀三兩', selected: false },
      { id: 'e-003', name: '驗屍格', icon: '📋', description: '忤作驗屍報告：頭部有鈍器傷一處，顱骨碎裂，係致命傷', selected: false },
    ],
    defendantInjured: false,
    testimonyConflict: false,
  },
  {
    id: 'case-002',
    caseNumber: '吳字第一二五號',
    caseType: 'land',
    plaintiff: '陳大富',
    receiveTime: '光緒二十六年三月十五日巳時',
    urgency: 'medium',
    status: 'pending',
    paperContent: `具狀人陳大富，年五十五歲，係本縣南鄉人，為田界被佔墾種無理，籲請勘丈清界事。

緣民有祖遺水田十畝，坐落南鄉陳家灣，東至李大貴田界，西至大路，南至山腳，北至張天保田界。有咸豐年間契據為憑。

詎有鄰人李大貴，去年秋間，乘民外出經商之際，私將界碑向民田內移動三尺，侵佔民田約五分餘。民歸後與其理論，李大貴蠻不講理，反稱民侵佔其田。

現有舊時契據一紙，四至分明；另有原界碑殘段可證。伏乞大老爺委派差役，會同地保勘丈，釐清界址，判令李大貴退還侵佔田地。

為此上叩，伏乞
太老爺台前施行。
光緒二十六年三月十五日 具狀人陳大富`,
    witnesses: [
      { id: 'w-003', name: '陳阿土', avatar: '👴', testimony: '我在這裡住了一輩子，那塊田向來是陳家的，界碑原來在那棵老槐樹下，去年被人動過。', selected: false },
      { id: 'w-004', name: '王地保', avatar: '🧔', testimony: '我是本地地保，這片田地的界址向來清楚，李大貴向來為人蠻橫，這事我略有耳聞。', selected: false },
    ],
    evidences: [
      { id: 'e-004', name: '咸豐契據', icon: '📜', description: '咸豐三年立的紅契，四至分明，有官印', selected: false },
      { id: 'e-005', name: '界碑殘段', icon: '🗿', description: '原界碑的殘塊，上有「陳界」字樣', selected: false },
      { id: 'e-006', name: '魚鱗圖冊', icon: '🗺️', description: '縣衙存檔的魚鱗圖冊，標明田畝四至', selected: false },
    ],
    defendantInjured: false,
    testimonyConflict: true,
  },
  {
    id: 'case-003',
    caseNumber: '吳字第一二六號',
    caseType: 'marriage',
    plaintiff: '劉周氏',
    receiveTime: '光緒二十六年三月十五日午時',
    urgency: 'low',
    status: 'pending',
    paperContent: `具狀人劉周氏，年四十二歲，係本縣北鄉人，為媳婦不孝翁姑，屢教不悛，籲請判令離異事。

緣民子劉阿福，前年娶妻張氏。初來時尚稱守分，豈料半年後，性情大變，對待翁姑言語頂撞，飲食不周。每日睡至日上三竿，家務全不料理。更有甚者，昨日因細故，竟敢將民推搡倒地，致民左臂受傷。

民子懦弱，無奈婦何。現有鄰居可證，另有民左臂傷痕可驗。伏乞大老爺俯念民婦年老無依，判令張氏與民子離異，以全孝道而肅閨門。

為此上叩，伏乞
太老爺台前施行。
光緒二十六年三月十五日 具狀人劉周氏`,
    witnesses: [
      { id: 'w-005', name: '鄰居王媽', avatar: '👵', testimony: '劉家媳婦確實潑辣，經常聽到她罵婆婆，左鄰右舍都知道。', selected: false },
      { id: 'w-006', name: '劉阿福', avatar: '👨', testimony: '媳婦確實不孝，我娘說的都是實話，我實在管不住她。', selected: false },
      { id: 'w-007', name: '張氏', avatar: '👩‍🦰', testimony: '我是被冤枉的，婆婆向來挑剔，我每日操勞家務，反被誣陷不孝。那天是婆婆自己跌倒的。', selected: false },
    ],
    evidences: [
      { id: 'e-007', name: '傷痕照片', icon: '🩹', description: '劉周氏左臂有輕微擦傷', selected: false },
      { id: 'e-008', name: '婚書', icon: '💌', description: '光緒二十四年訂立的婚書', selected: false },
    ],
    defendantInjured: true,
    testimonyConflict: true,
  },
  {
    id: 'case-004',
    caseNumber: '吳字第一二七號',
    caseType: 'homicide',
    plaintiff: '趙文華',
    receiveTime: '光緒二十六年三月十六日寅時',
    urgency: 'high',
    status: 'pending',
    paperContent: `具狀人趙文華，年五十歲，係本縣城內人，為兒子被毆傷致死，慘遭橫禍，籲請緝拿兇首依律抵償事。

緣民子趙小虎，年二十歲，平日經營豆腐生意。本月十五日晚飯後，外出收賬，行至城內城隍廟前，遇有當地惡霸周虎帶領家丁數人，將民子圍住毆打。據聞係因民子日前無意中撞了周虎一下，未及賠禮，因此挾嫌報復。

民聞訊趕至，兒子已被打得遍體鱗傷，抬回家中不到一個時辰便氣絕身亡。伏乞大老爺速派差役，將周虎及其家丁一併拿獲到案，嚴加審訊，依律懲辦，以儆兇橫而慰亡兒。

為此上叩，伏乞
太老爺台前施行。
光緒二十六年三月十六日 具狀人趙文華`,
    witnesses: [
      { id: 'w-008', name: '店夥計小張', avatar: '🧑', testimony: '我當時在店裡，聽到外面吵鬧，出去看時，見周虎帶著三個家丁，將趙小虎圍住拳打腳踢，打得他躺在地上不能動彈。', selected: false },
      { id: 'w-009', name: '城隍廟廟祝', avatar: '🧙', testimony: '那晚確實有人在廟前打架，我燒了香出來看，見幾個人打一個，被打的那個小伙子後來被人抬走了。', selected: false },
    ],
    evidences: [
      { id: 'e-009', name: '驗屍報告', icon: '📋', description: '死者全身多處軟組織挫傷，肋骨斷了三根，係內臟大出血致死', selected: false },
      { id: 'e-010', name: '血衣', icon: '👕', description: '死者被毆時穿的布衫，沾滿血跡', selected: false },
      { id: 'e-011', name: '木棍', icon: '🥢', description: '現場遺留的木棍一根，上有血跡', selected: false },
    ],
    defendantInjured: false,
    testimonyConflict: false,
  },
  {
    id: 'case-005',
    caseNumber: '吳字第一二八號',
    caseType: 'land',
    plaintiff: '孫老漢',
    receiveTime: '光緒二十六年三月十六日卯時',
    urgency: 'medium',
    status: 'pending',
    paperContent: `具狀人孫老漢，年六十八歲，係本縣西鄉人，為祖傳宅基地被族侄強佔蓋房，籲請判令退還事。

緣民有祖傳宅基地一塊，約二分餘，坐落西鄉孫家莊，有乾隆年間紅契為據。去年春，民外出探親，族侄孫二狗乘民不在，強行在民宅基地上蓋草房三間。

民歸後與其理論，孫二狗蠻不講理，反稱此宅基地係其祖產。現有紅契一紙，四至分明，另有族長可證。伏乞大老爺判令孫二狗拆房退地，以維民產而儆刁頑。

為此上叩，伏乞
太老爺台前施行。
光緒二十六年三月十六日 具狀人孫老漢`,
    witnesses: [
      { id: 'w-010', name: '孫氏族長', avatar: '👴', testimony: '這塊宅基地向來是孫老漢祖上留下的，族譜上有記載，孫二狗強佔是實。', selected: false },
      { id: 'w-011', name: '鄰居李婆婆', avatar: '👵', testimony: '我在這裡住了幾十年，那塊地從前是孫老漢家的菜園子，去年被孫二狗蓋了房子。', selected: false },
    ],
    evidences: [
      { id: 'e-012', name: '乾隆紅契', icon: '📜', description: '乾隆五十七年的紅契，有歷年稅契為證', selected: false },
      { id: 'e-013', name: '孫氏族譜', icon: '📚', description: '族譜中記載宅基地的歸屬', selected: false },
      { id: 'e-014', name: '現場照片', icon: '🏠', description: '宅基地上蓋起的三間草房', selected: false },
    ],
    defendantInjured: false,
    testimonyConflict: false,
  },
];
