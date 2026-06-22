export interface OrganelleInfo {
  name: string
  nameZh: string
  icon: string
  description: string
  detailUrl: string
}

export const ORGANELLE_DATA: Record<string, OrganelleInfo> = {
  cellMembrane: {
    name: 'Cell Membrane',
    nameZh: '细胞膜',
    icon: '🫧',
    description:
      '细胞膜是包裹在细胞外表面的半透膜，由磷脂双分子层和蛋白质组成。它控制物质进出细胞，维持细胞内环境的稳定，并参与细胞间的信号传导和识别。细胞膜的选择透过性使细胞能够有选择地吸收营养物质并排出代谢废物。',
    detailUrl: 'https://en.wikipedia.org/wiki/Cell_membrane',
  },
  nucleus: {
    name: 'Nucleus',
    nameZh: '细胞核',
    icon: '🔮',
    description:
      '细胞核是细胞的控制中心，含有遗传物质DNA。它被双层核膜包裹，核膜上有核孔允许物质进出。细胞核负责存储遗传信息、控制基因表达、调节细胞周期，并通过mRNA指导蛋白质合成，是细胞生命活动的核心调控者。',
    detailUrl: 'https://en.wikipedia.org/wiki/Cell_nucleus',
  },
  mitochondria: {
    name: 'Mitochondria',
    nameZh: '线粒体',
    icon: '⚡',
    description:
      '线粒体是细胞的"动力工厂"，通过有氧呼吸将营养物质转化为ATP（三磷酸腺苷），为细胞提供能量。线粒体具有双层膜结构——外膜光滑，内膜向内折叠形成嵴，增大了表面积以进行高效的氧化磷酸化反应。线粒体还含有自身的DNA。',
    detailUrl: 'https://en.wikipedia.org/wiki/Mitochondrion',
  },
  er: {
    name: 'Endoplasmic Reticulum',
    nameZh: '内质网',
    icon: '🔗',
    description:
      '内质网是由膜围成的管道和扁囊组成的网状结构，与核膜相连。粗面内质网表面附有核糖体，负责蛋白质的合成和转运；滑面内质网无核糖体，参与脂质合成、糖原代谢和解毒作用。内质网是细胞内物质运输的重要通道。',
    detailUrl: 'https://en.wikipedia.org/wiki/Endoplasmic_reticulum',
  },
  golgi: {
    name: 'Golgi Apparatus',
    nameZh: '高尔基体',
    icon: '📦',
    description:
      '高尔基体由一系列扁平膜囊堆叠而成，是细胞的加工和分选中心。它接收来自内质网的蛋白质和脂质，进行糖基化等修饰加工，然后将其分类包装成囊泡，运送到细胞内外特定位置。高尔基体在分泌蛋白的加工和溶酶体的形成中起关键作用。',
    detailUrl: 'https://en.wikipedia.org/wiki/Golgi_apparatus',
  },
  lysosome: {
    name: 'Lysosome',
    nameZh: '溶酶体',
    icon: '💧',
    description:
      '溶酶体是细胞内的消化车间，含有60多种水解酶，能够分解蛋白质、核酸、多糖和脂质等生物大分子。溶酶体负责消化吞噬进入细胞的物质、回收细胞内衰老的细胞器（自噬），并在细胞凋亡过程中释放水解酶促进细胞分解。',
    detailUrl: 'https://en.wikipedia.org/wiki/Lysosome',
  },
}
