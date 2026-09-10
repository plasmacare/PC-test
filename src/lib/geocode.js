// Free, keyless geocoding via OpenStreetMap's Nominatim service.
// No API key, no dashboard setup, no allocation needed.

export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en' },
  })
  if (!res.ok) throw new Error('Reverse geocode failed')
  const data = await res.json()
  return data?.display_name ? { formatted_address: data.display_name } : null
}

export async function autosuggest(query) {
  if (!query || query.length < 3) return []
  const params = new URLSearchParams({
    format: 'json',
    q: query,
    addressdetails: '1',
    limit: '5',
    countrycodes: 'in',
  })
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en' },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.map((item) => ({
    placeName: item.display_name.split(',')[0],
    placeAddress: item.display_name,
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
  }))
}
