const BASE_URL = '/api'

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

export function getGardenZones() {
  return request('/garden-zones')
}

export function getRotationPlans(zoneId) {
  return request(`/rotation-plans?zoneId=${encodeURIComponent(zoneId)}`)
}

export function getHarvestRecords() {
  return request('/harvest-records')
}
