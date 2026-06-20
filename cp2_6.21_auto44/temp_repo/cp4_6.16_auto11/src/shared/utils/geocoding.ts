interface SearchResult {
  name: string;
  lat: number;
  lng: number;
  address: string;
}

interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    [key: string]: string | undefined;
  };
  boundingbox: string[];
  [key: string]: unknown;
}

function formatName(result: NominatimResponse): string {
  const addr = result.address;
  if (!addr) {
    const parts = result.display_name.split(',');
    return parts[0]?.trim() || result.display_name;
  }

  const parts: string[] = [];
  if (addr.road) {
    if (addr.house_number) {
      parts.push(`${addr.road} ${addr.house_number}`);
    } else {
      parts.push(addr.road);
    }
  }
  if (!parts.length && (addr.neighbourhood || addr.suburb)) {
    parts.push(addr.neighbourhood || addr.suburb || '');
  }
  if (!parts.length && (addr.city || addr.town || addr.village)) {
    parts.push(addr.city || addr.town || addr.village || '');
  }

  return parts[0] || result.display_name.split(',')[0]?.trim() || 'Unknown Location';
}

function formatAddress(result: NominatimResponse): string {
  return result.display_name;
}

export async function searchLocation(query: string): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&addressdetails=1&limit=10`;

  const response = await fetch(url, {
    headers: {
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'User-Agent': 'TravelMemoir/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding request failed: ${response.status}`);
  }

  const data = (await response.json()) as NominatimResponse[];

  return data.map((item) => ({
    name: formatName(item),
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    address: formatAddress(item),
  }));
}
