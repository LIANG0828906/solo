import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import { pets, hosts, allReviews, bookings, addBooking, getBookingsByHostAndDate } from './data.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get('/api/pets', (req, res) => {
  setTimeout(() => {
    res.json(pets)
  }, 100)
})

app.get('/api/pets/:id', (req, res) => {
  const pet = pets.find(p => p.id === req.params.id)
  if (!pet) {
    return res.status(404).json({ error: '宠物不存在' })
  }
  res.json(pet)
})

app.get('/api/hosts', (req, res) => {
  setTimeout(() => {
    const { city, petType, minPrice, maxPrice, sortBy, page = 1, limit = 9 } = req.query
    
    let filtered = [...hosts]
    
    if (city) {
      filtered = filtered.filter(h => h.city === city)
    }
    
    if (petType && petType !== 'all') {
      filtered = filtered.filter(h => h.petTypes.includes(petType))
    }
    
    if (minPrice) {
      filtered = filtered.filter(h => h.price >= Number(minPrice))
    }
    
    if (maxPrice) {
      filtered = filtered.filter(h => h.price <= Number(maxPrice))
    }
    
    if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'reviews') {
      filtered.sort((a, b) => b.reviewCount - a.reviewCount)
    }
    
    const pageNum = Number(page)
    const limitNum = Number(limit)
    const startIdx = (pageNum - 1) * limitNum
    const paginated = filtered.slice(startIdx, startIdx + limitNum)
    
    res.json({
      data: paginated,
      total: filtered.length,
      page: pageNum,
      totalPages: Math.ceil(filtered.length / limitNum)
    })
  }, 200)
})

app.get('/api/hosts/:id', (req, res) => {
  setTimeout(() => {
    const host = hosts.find(h => h.id === req.params.id)
    if (!host) {
      return res.status(404).json({ error: '寄养家庭不存在' })
    }
    res.json(host)
  }, 100)
})

app.get('/api/hosts/:id/reviews', (req, res) => {
  setTimeout(() => {
    const hostId = req.params.id
    const hostReviews = allReviews
      .filter(r => r.hostId === hostId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    res.json(hostReviews)
  }, 100)
})

app.post('/api/reviews', (req, res) => {
  const { hostId, petId, userName, rating, content } = req.body
  
  if (!hostId || !rating || !content) {
    return res.status(400).json({ error: '请填写完整评价信息' })
  }
  
  const newReview = {
    id: uuidv4(),
    hostId,
    petId: petId || null,
    userName: userName || '匿名用户',
    userAvatar: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20chinese%20person%20avatar%20portrait&image_size=square`,
    rating: Math.min(5, Math.max(1, Number(rating))),
    content,
    date: new Date().toISOString().split('T')[0]
  }
  
  allReviews.unshift(newReview)
  
  const host = hosts.find(h => h.id === hostId)
  if (host) {
    const hostReviews = allReviews.filter(r => r.hostId === hostId)
    const avgRating = hostReviews.reduce((sum, r) => sum + r.rating, 0) / hostReviews.length
    host.rating = Math.round(avgRating * 10) / 10
    host.reviewCount = hostReviews.length
  }
  
  res.status(201).json(newReview)
})

app.get('/api/bookings', (req, res) => {
  res.json(bookings)
})

app.post('/api/bookings/check', (req, res) => {
  const { hostId, date } = req.body
  
  if (!hostId || !date) {
    return res.status(400).json({ error: '缺少必要参数' })
  }
  
  const host = hosts.find(h => h.id === hostId)
  if (!host) {
    return res.status(404).json({ error: '寄养家庭不存在' })
  }
  
  const existingBookings = getBookingsByHostAndDate(hostId, date)
  const isHostDateBooked = host.bookedDates.includes(date)
  const hasConflict = existingBookings.length > 0 || isHostDateBooked
  
  if (hasConflict) {
    const today = new Date(date)
    const suggestedDates = []
    
    for (let i = 1; i <= 14; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() + i)
      const dateStr = checkDate.toISOString().split('T')[0]
      const dayBookings = getBookingsByHostAndDate(hostId, dateStr)
      if (!host.bookedDates.includes(dateStr) && dayBookings.length === 0) {
        suggestedDates.push(dateStr)
        if (suggestedDates.length >= 3) break
      }
    }
    
    return res.json({
      available: false,
      conflict: true,
      suggestedDates
    })
  }
  
  res.json({
    available: true,
    conflict: false
  })
})

app.post('/api/bookings', (req, res) => {
  const { hostId, petId, petName, userName, date, notes } = req.body
  
  if (!hostId || !petId || !date) {
    return res.status(400).json({ error: '请填写完整预约信息' })
  }
  
  const host = hosts.find(h => h.id === hostId)
  if (!host) {
    return res.status(404).json({ error: '寄养家庭不存在' })
  }
  
  const existingBookings = getBookingsByHostAndDate(hostId, date)
  const isHostDateBooked = host.bookedDates.includes(date)
  
  if (existingBookings.length > 0 || isHostDateBooked) {
    const today = new Date(date)
    const suggestedDates = []
    for (let i = 1; i <= 14; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() + i)
      const dateStr = checkDate.toISOString().split('T')[0]
      const dayBookings = getBookingsByHostAndDate(hostId, dateStr)
      if (!host.bookedDates.includes(dateStr) && dayBookings.length === 0) {
        suggestedDates.push(dateStr)
        if (suggestedDates.length >= 3) break
      }
    }
    
    return res.status(409).json({
      error: '该日期已被预约',
      suggestedDates
    })
  }
  
  const booking = addBooking({
    hostId,
    petId,
    petName: petName || '未知宠物',
    userName: userName || '宠物主人',
    hostName: host.name,
    date,
    price: host.price,
    notes: notes || ''
  })
  
  if (!host.bookedDates.includes(date)) {
    host.bookedDates.push(date)
  }
  
  res.status(201).json({
    booking,
    notifications: {
      owner: {
        title: '预约成功！',
        message: `您已成功预约${host.name}，日期：${date}`
      },
      host: {
        title: '新的预约请求',
        message: `${userName || '宠物主人'}预约了您的服务，日期：${date}，宠物：${petName || '未知宠物'}`
      }
    }
  })
})

app.get('/api/stats', (req, res) => {
  res.json({
    totalHosts: hosts.length,
    totalPets: pets.length,
    totalBookings: bookings.length,
    totalReviews: allReviews.length,
    avgRating: (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
  })
})

app.listen(PORT, () => {
  console.log(`宠物寄养社区平台后端服务已启动: http://localhost:${PORT}`)
})
