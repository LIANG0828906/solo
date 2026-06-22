export interface Song {
  id: number
  title: string
  artist: string
  cover: string
  duration: number
}

export const songs: Song[] = [
  {
    id: 1,
    title: "夜空中最亮的星",
    artist: "逃跑计划",
    cover: "https://picsum.photos/seed/song1/300/300",
    duration: 252
  },
  {
    id: 2,
    title: "平凡之路",
    artist: "朴树",
    cover: "https://picsum.photos/seed/song2/300/300",
    duration: 298
  },
  {
    id: 3,
    title: "匆匆那年",
    artist: "王菲",
    cover: "https://picsum.photos/seed/song3/300/300",
    duration: 278
  },
  {
    id: 4,
    title: "起风了",
    artist: "买辣椒也用券",
    cover: "https://picsum.photos/seed/song4/300/300",
    duration: 325
  },
  {
    id: 5,
    title: "成都",
    artist: "赵雷",
    cover: "https://picsum.photos/seed/song5/300/300",
    duration: 328
  },
  {
    id: 6,
    title: "晴天",
    artist: "周杰伦",
    cover: "https://picsum.photos/seed/song6/300/300",
    duration: 269
  },
  {
    id: 7,
    title: "演员",
    artist: "薛之谦",
    cover: "https://picsum.photos/seed/song7/300/300",
    duration: 245
  },
  {
    id: 8,
    title: "后来",
    artist: "刘若英",
    cover: "https://picsum.photos/seed/song8/300/300",
    duration: 288
  }
]
