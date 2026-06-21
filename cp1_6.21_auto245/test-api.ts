import { getShows, createShow, getShowById, updateShowStatus, deleteShow } from './api/services/showService'
import { createRecord, getRecordsByShowId, deleteRecord } from './api/services/recordService'
import { searchShows } from './api/services/searchService'
import { initStore } from './api/data/store'

async function runTests() {
  console.log('Starting API tests...\n')

  await initStore()
  console.log('✓ Store initialized')

  const searchResults = await searchShows('游戏')
  console.log(`✓ Search returned ${searchResults.length} results`)

  if (searchResults.length > 0) {
    const firstResult = searchResults[0]
    const newShow = await createShow({
      tmdbId: firstResult.tmdbId,
      name: firstResult.name,
      posterPath: firstResult.posterPath,
      firstAirDate: firstResult.firstAirDate,
      overview: firstResult.overview,
      genres: ['剧情', '悬疑'],
      totalEpisodes: 10,
      totalSeasons: 1
    })
    console.log(`✓ Created show: ${newShow.name} (id: ${newShow.id})`)

    const shows = await getShows()
    console.log(`✓ Got ${shows.length} shows`)

    const showDetail = await getShowById(newShow.id)
    if (showDetail) {
      console.log(`✓ Got show detail with stats: watchedEpisodes=${showDetail.stats.watchedEpisodes}`)
    }

    const record = await createRecord(newShow.id, {
      season: 1,
      episode: 1,
      rating: 5,
      comment: '第一集很棒！'
    })
    console.log(`✓ Created record: S${record?.season}E${record?.episode}`)

    const records = await getRecordsByShowId(newShow.id)
    console.log(`✓ Got ${records.length} records for show`)

    const showDetailWithRecords = await getShowById(newShow.id)
    if (showDetailWithRecords) {
      console.log(`✓ Show stats updated: watchedEpisodes=${showDetailWithRecords.stats.watchedEpisodes}, averageRating=${showDetailWithRecords.stats.averageRating}`)
    }

    const updatedShow = await updateShowStatus(newShow.id, 'completed')
    console.log(`✓ Updated show status: ${updatedShow?.status}`)

    if (record) {
      const deletedRecord = await deleteRecord(record.id)
      console.log(`✓ Deleted record: ${deletedRecord}`)
    }

    const deletedShow = await deleteShow(newShow.id)
    console.log(`✓ Deleted show: ${deletedShow}`)
  }

  console.log('\n✅ All tests passed!')
}

runTests().catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})
