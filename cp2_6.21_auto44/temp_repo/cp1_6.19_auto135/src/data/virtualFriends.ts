import type { Profile, PersonalityDimension } from '../engine/types'

const friendNames = [
  '小夜曲', '节奏狂', '词匠', '氛围控', '实验派',
  '旋律达人', 'BeatMaker', '诗人', '梦旅人', '解构者',
  '和声精灵', '贝斯手', '民谣者', '电音客', '前卫君',
  '唱作人', '鼓手', '吟游诗人', '氛围感', '创新家',
]

function generateProfile(index: number): Profile {
  const name = friendNames[index]
  const baseScores = [
    [85, 45, 60, 70, 40],
    [40, 90, 35, 55, 65],
    [55, 35, 88, 60, 42],
    [60, 40, 45, 92, 55],
    [45, 55, 40, 50, 95],
    [80, 50, 55, 65, 50],
    [35, 85, 45, 50, 70],
    [50, 40, 82, 70, 48],
    [65, 35, 55, 88, 45],
    [55, 60, 35, 55, 90],
    [78, 55, 62, 58, 52],
    [48, 82, 40, 60, 68],
    [62, 45, 78, 68, 45],
    [45, 70, 42, 75, 72],
    [52, 48, 50, 60, 92],
    [75, 52, 80, 62, 55],
    [38, 88, 30, 50, 75],
    [58, 42, 75, 80, 50],
    [68, 50, 55, 90, 60],
    [50, 62, 48, 52, 88],
  ]

  const dimensions: Record<PersonalityDimension, number> = {
    Melody: baseScores[index][0],
    Rhythm: baseScores[index][1],
    Lyric: baseScores[index][2],
    Mood: baseScores[index][3],
    Complexity: baseScores[index][4],
  }

  const dims: PersonalityDimension[] = ['Melody', 'Rhythm', 'Lyric', 'Mood', 'Complexity']
  const sorted = dims.sort((a, b) => dimensions[b] - dimensions[a])

  return {
    id: `friend_${index}`,
    nickname: name,
    dimensions,
    primaryType: sorted[0],
    secondaryType: sorted[1],
  }
}

export const virtualFriends: Profile[] = Array.from({ length: 20 }, (_, i) =>
  generateProfile(i)
)
