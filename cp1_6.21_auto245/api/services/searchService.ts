import axios from 'axios'
import type { SearchResult } from '../types'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_API_KEY = process.env.TMDB_API_KEY

interface SearchCacheEntry {
  results: SearchResult[]
  timestamp: number
}

const searchCache = new Map<string, SearchCacheEntry>()
const CACHE_TTL = 5 * 60 * 1000

const mockShows: SearchResult[] = [
  {
    tmdbId: 1399,
    name: '权力的游戏',
    posterPath: '/7WUHnWGx5OO145IRxPDUkQSh4C7.jpg',
    firstAirDate: '2011-04-17',
    overview: '七大王国的贵族家族争夺王位的控制权，而一个被遗忘的种族在北方苏醒。'
  },
  {
    tmdbId: 66732,
    name: '怪奇物语',
    posterPath: '/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    firstAirDate: '2016-07-15',
    overview: '当一个小男孩神秘失踪时，他的母亲、警察局长和他的朋友们必须面对可怕的超自然力量才能让他回来。'
  },
  {
    tmdbId: 71446,
    name: '绝命毒师',
    posterPath: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    firstAirDate: '2008-01-20',
    overview: '一位身患绝症的高中化学老师转向制造冰毒，以确保他的家人在他去世后的未来。'
  },
  {
    tmdbId: 60625,
    name: '瑞克和莫蒂',
    posterPath: '/82m7Zgq1J5rQZ8W4q7kL7fJ8qYp.jpg',
    firstAirDate: '2013-12-02',
    overview: '一个疯狂的科学家和他容易受影响的孙子的奇妙冒险。'
  },
  {
    tmdbId: 90462,
    name: '星期三',
    posterPath: '/9PFonX4XpAWt49dHnAal8Hm0krF.jpg',
    firstAirDate: '2022-11-23',
    overview: '星期三·亚当斯在永封学院就读期间，试图掌握她新兴的通灵能力。'
  },
  {
    tmdbId: 110316,
    name: '最后生还者',
    posterPath: '/uKvVjHNqB5VmOoYZ0eL5Zgav1pT.jpg',
    firstAirDate: '2023-01-15',
    overview: '在一场毁灭性的全球流行病之后，乔尔和艾莉穿越美国，在旅途中相互依靠生存。'
  }
]

export async function searchShows(query: string): Promise<SearchResult[]> {
  const cacheKey = query.toLowerCase()
  const cached = searchCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.results
  }

  let results: SearchResult[]

  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
    results = mockShows.filter(show => 
      show.name.toLowerCase().includes(query.toLowerCase()) ||
      show.overview.toLowerCase().includes(query.toLowerCase())
    )
  } else {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/search/tv`, {
        params: {
          api_key: TMDB_API_KEY,
          query,
          language: 'zh-CN',
          include_adult: false,
          page: 1
        },
        timeout: 3000
      })

      results = response.data.results.slice(0, 10).map((item: any) => ({
        tmdbId: item.id,
        name: item.name,
        posterPath: item.poster_path || '',
        firstAirDate: item.first_air_date || '',
        overview: item.overview || ''
      }))
    } catch (error) {
      console.error('TMDB search error:', error)
      results = mockShows.filter(show => 
        show.name.toLowerCase().includes(query.toLowerCase()) ||
        show.overview.toLowerCase().includes(query.toLowerCase())
      )
    }
  }

  searchCache.set(cacheKey, {
    results,
    timestamp: Date.now()
  })

  return results
}

export async function getShowDetails(tmdbId: number): Promise<any> {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
    const mockShow = mockShows.find(s => s.tmdbId === tmdbId)
    if (mockShow) {
      return {
        id: mockShow.tmdbId,
        name: mockShow.name,
        poster_path: mockShow.posterPath,
        first_air_date: mockShow.firstAirDate,
        overview: mockShow.overview,
        genres: [{ id: 1, name: '剧情' }, { id: 2, name: '悬疑' }],
        number_of_episodes: 10,
        number_of_seasons: 1,
        status: 'Returning Series'
      }
    }
    return null
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'zh-CN'
      },
      timeout: 3000
    })
    return response.data
  } catch (error) {
    console.error('TMDB details error:', error)
    return null
  }
}
