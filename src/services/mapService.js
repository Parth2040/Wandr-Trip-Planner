const axios = require('axios');

const CATEGORY_TAGS = {
  'Historical Places': ['historic=*', 'tourism=museum'],
  Nature: ['natural=water', 'natural=peak', 'tourism=viewpoint'],
  'Religious Places': ['amenity=place_of_worship'],
  'Food Spots': ['amenity=restaurant', 'amenity=cafe'],
  'Popular Spots': ['tourism=attraction', 'tourism=yes'],
  'Top Rated': ['tourism=attraction', 'leisure=park'],
  'Hidden Gems': ['tourism=artwork', 'tourism=gallery'],
  'Adventure Sports': ['leisure=sports_centre', 'sport=*'],
  Parks: ['leisure=park', 'leisure=garden'],
  Beaches: ['natural=beach'],
  Bars: ['amenity=bar'],
  Casinos: ['amenity=casino'],
};

const GOOGLE_KEYWORDS = {
  'Historical Places': ['historical landmark', 'museum', 'fort'],
  Nature: ['nature attraction', 'waterfall', 'national park'],
  'Religious Places': ['temple', 'church', 'mosque'],
  'Food Spots': ['restaurant', 'food market', 'street food'],
  'Popular Spots': ['tourist attraction', 'city landmark'],
  'Top Rated': ['top rated attraction'],
  'Hidden Gems': ['hidden gem attractions'],
  'Adventure Sports': ['adventure sports', 'outdoor adventure'],
  Parks: ['city park', 'botanical garden'],
  Beaches: ['beach'],
  Bars: ['bar', 'cocktail bar'],
  Casinos: ['casino'],
};

const APPROVED_FOOD_BRANDS = [
  "McDonald's",
  'KFC',
  'Burger King',
  'Subway',
  'Starbucks',
  "Domino's",
  'Pizza Hut',
  'Cafe Coffee Day',
  'Costa Coffee',
  'Taco Bell',
  'Hard Rock Cafe',
  'Dunkin Donuts',
  'Baskin Robbins',
  "Chili's",
  'TGI Fridays',
  "Papa John's",
  "Wendy's",
];

const LANDMARK_INJECTIONS = {
  agra: ['Taj Mahal', 'Agra Fort'],
  delhi: ['Red Fort', 'India Gate', 'Qutub Minar'],
  paris: ['Eiffel Tower', 'Louvre Museum'],
  mumbai: ['Gateway of India', 'Marine Drive'],
  tokyo: ['Tokyo Tower', 'Senso-ji Temple'],
  dubai: ['Burj Khalifa', 'Palm Jumeirah'],
  newyork: ['Statue of Liberty', 'Times Square'],
  hongkong: ['Victoria Peak', 'Tian Tan Buddha'],
};

const parseTag = (tag) => {
  const [key, value] = tag.split('=');
  return { key, value };
};

const normalizeText = (value = '') => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const roundCoordinate = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(5) : 'na';
};

const isApprovedFoodBrand = (name = '') => {
  const normalized = normalizeText(name);
  return APPROVED_FOOD_BRANDS.some((brand) => normalized.includes(normalizeText(brand)));
};

const isFoodCategory = (value = '') => {
  const normalized = normalizeText(value);
  return ['food', 'restaurant', 'cafe'].some((keyword) => normalized.includes(keyword));
};

const dedupePlaces = (places) => {
  const byKey = new Map();
  for (const place of places) {
    const key =
      place.placeId ||
      place.place_id ||
      `${normalizeText(place.name)}:${roundCoordinate(place.lat)}:${roundCoordinate(place.lon)}`;
    if (!key) {
      continue;
    }

    if (!byKey.has(key)) {
      byKey.set(key, place);
      continue;
    }

    const current = byKey.get(key);
    const currentScore = (current.rating || 0) * (current.userRatingsTotal || 1);
    const nextScore = (place.rating || 0) * (place.userRatingsTotal || 1);
    if (nextScore > currentScore) {
      byKey.set(key, place);
    }
  }

  return [...byKey.values()];
};

const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
};

const geocodeLocation = async (locationName) => {
  // Nominatim converts a location text query into map coordinates.
  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: {
      q: locationName,
      format: 'json',
      limit: 1,
    },
    headers: {
      'User-Agent': 'Wandr-Travel-Planner/1.0',
    },
  });

  if (!response.data || response.data.length === 0) {
    throw new Error('Location not found. Please try a different place.');
  }

  return {
    lat: Number(response.data[0].lat),
    lon: Number(response.data[0].lon),
    displayName: response.data[0].display_name,
  };
};

const getLandmarkPlaces = async ({ locationName, lat, lon }) => {
  const key = normalizeText(locationName);
  const matchedKey = Object.keys(LANDMARK_INJECTIONS).find((city) => key.includes(city));
  if (!matchedKey) {
    return [];
  }

  const names = LANDMARK_INJECTIONS[matchedKey];
  const geocoded = await Promise.all(
    names.map(async (name) => {
      try {
        const result = await geocodeLocation(`${name}, ${locationName}`);
        return {
          id: `landmark-${normalizeText(name)}`,
          placeId: `landmark-${normalizeText(name)}`,
          name,
          category: 'Landmark',
          lat: result.lat,
          lon: result.lon,
          rating: 5,
          userRatingsTotal: 10000,
          source: 'landmark',
          distanceKm: Number(haversineDistanceKm(lat, lon, result.lat, result.lon).toFixed(2)),
        };
      } catch (error) {
        return null;
      }
    })
  );

  return geocoded.filter(Boolean);
};

const fetchGooglePlaces = async ({ locationName, lat, lon, interests, foodBrandsOnly = false }) => {
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!googleApiKey) {
    return [];
  }

  const keywords = dedupePlaces(
    interests.flatMap((interest) =>
      (GOOGLE_KEYWORDS[interest] || [interest]).map((keyword) => ({ name: keyword }))
    )
  )
    .map((item) => item.name)
    .slice(0, 8);

  if (!keywords.length) {
    keywords.push('tourist attraction');
  }

  const responses = await Promise.all(
    keywords.map((keyword) =>
      axios
        .get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
          params: {
            query: `${keyword} in ${locationName}`,
            location: `${lat},${lon}`,
            radius: 25000,
            key: googleApiKey,
          },
          timeout: 15000,
        })
        .then((response) => response.data.results || [])
        .catch(() => [])
    )
  );

  const flattened = responses.flat();
  const deduped = dedupePlaces(
    flattened
      .filter((place) => place.geometry?.location)
      .filter((place) => (place.rating || 0) >= 3.5 && (place.user_ratings_total || 0) >= 100)
      .map((place) => ({
        id: place.place_id,
        placeId: place.place_id,
        name: place.name,
        category: place.types?.[0] || 'Point of Interest',
        lat: place.geometry.location.lat,
        lon: place.geometry.location.lng,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        source: 'google',
        distanceKm: Number(haversineDistanceKm(lat, lon, place.geometry.location.lat, place.geometry.location.lng).toFixed(2)),
      }))
  );

  const filtered = foodBrandsOnly
    ? deduped.filter((place) => isFoodCategory(place.category) && isApprovedFoodBrand(place.name))
    : deduped;

  return filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
};

const fetchOverpassPlaces = async ({ lat, lon, interests, foodBrandsOnly = false }) => {
  // Build the selected interest tags for the Overpass query.
  const selectedTags = interests
    .flatMap((interest) => CATEGORY_TAGS[interest] || [])
    .map(parseTag);

  if (selectedTags.length === 0) {
    return [];
  }

  const queryParts = selectedTags
    .map(({ key, value }) => {
      if (value === '*') {
        return `node["${key}"](around:26000,${lat},${lon});`;
      }
      return `node["${key}"="${value}"](around:26000,${lat},${lon});`;
    })
    .join('\n');

  const overpassQuery = `[out:json][timeout:35];\n(\n${queryParts}\n);\nout body;`;

  const MAX_RETRIES = 2;
  let response;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      response = await axios.post('https://overpass-api.de/api/interpreter', overpassQuery, {
        headers: {
          'Content-Type': 'text/plain',
        },
        timeout: 40000,
      });
      break;
    } catch (error) {
      const status = error?.response?.status;
      if ((status === 429 || status >= 500) && attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      // Return empty on final failure instead of crashing the whole discover request.
      return [];
    }
  }

  const uniquePlaces = new Map();

  for (const element of response.data.elements || []) {
    const name = element.tags?.name;
    if (!name || !element.lat || !element.lon) {
      continue;
    }

    const category =
      interests.find((interest) =>
        (CATEGORY_TAGS[interest] || []).some((tag) => {
          const parsed = parseTag(tag);
          const elementValue = element.tags?.[parsed.key];
          return parsed.value === '*' ? !!elementValue : elementValue === parsed.value;
        })
      ) || 'Point of Interest';

    if (foodBrandsOnly && category === 'Food Spots' && !isApprovedFoodBrand(name)) {
      continue;
    }

    const id = `overpass-${element.id}`;
    const distanceKm = haversineDistanceKm(lat, lon, element.lat, element.lon);
    const relevanceScore = Number(Boolean(element.tags?.tourism)) + Number(Boolean(element.tags?.historic));

    if (!uniquePlaces.has(id)) {
      uniquePlaces.set(id, {
        id,
        placeId: id,
        name,
        category,
        lat: element.lat,
        lon: element.lon,
        distanceKm: Number(distanceKm.toFixed(2)),
        relevanceScore,
        rating: null,
        userRatingsTotal: null,
        source: 'overpass',
      });
    }
  }

  return [...uniquePlaces.values()].sort(
    (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0) || a.distanceKm - b.distanceKm
  );
};

const fetchNearbyPlaces = async ({ locationName, lat, lon, interests, foodBrandsOnly = false }) => {
  const [landmarks, googlePlaces] = await Promise.all([
    foodBrandsOnly ? Promise.resolve([]) : getLandmarkPlaces({ locationName, lat, lon }),
    fetchGooglePlaces({ locationName, lat, lon, interests, foodBrandsOnly }),
  ]);

  let merged = dedupePlaces([
    ...landmarks,
    ...googlePlaces,
  ]);

  // Keep landmarks always visible while sorting the rest by rating.
  merged = merged.sort((a, b) => {
    if (a.source === 'landmark' && b.source !== 'landmark') {
      return -1;
    }
    if (b.source === 'landmark' && a.source !== 'landmark') {
      return 1;
    }
    return (b.rating || 0) - (a.rating || 0);
  });

  if (merged.length < 25) {
    const overpassPlaces = await fetchOverpassPlaces({ lat, lon, interests, foodBrandsOnly });
    merged = dedupePlaces([...merged, ...overpassPlaces]);
  }

  if (foodBrandsOnly) {
    merged = merged.filter((place) => isFoodCategory(place.category) && isApprovedFoodBrand(place.name));
  }

  return merged;
};

const findNearest = (current, candidates) => {
  let nearest = candidates[0];
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const distance = haversineDistanceKm(current.lat, current.lon, candidate.lat, candidate.lon);
    if (distance < nearestDistance) {
      nearest = candidate;
      nearestDistance = distance;
    }
  }

  return nearest;
};

const normalizeCategory = (value = '') => value.toLowerCase();

const isFoodPlace = (place) => {
  const category = normalizeCategory(place?.category);
  return ['food', 'restaurant', 'cafe'].some((keyword) => category.includes(keyword));
};

const createBalancedDayCounts = (totalSpots, totalDays) => {
  const safeDays = Math.max(1, Number(totalDays) || 1);
  const safeTotal = Math.max(0, Number(totalSpots) || 0);
  const basePerDay = Math.floor(safeTotal / safeDays);
  const remainder = safeTotal % safeDays;

  return Array.from({ length: safeDays }, (_, index) => basePerDay + (index < remainder ? 1 : 0));
};

const distributeSpotsByDayCounts = (spots, dayCounts) => {
  const unvisited = [...spots];

  return dayCounts.map((targetCount) => {
    if (targetCount <= 0 || unvisited.length === 0) {
      return [];
    }

    const dayGroup = [];
    let current = unvisited.shift();
    dayGroup.push(current);

    while (dayGroup.length < targetCount && unvisited.length > 0) {
      const nearest = findNearest(current, unvisited);
      dayGroup.push(nearest);
      unvisited.splice(
        unvisited.findIndex((place) => place.id === nearest.id),
        1
      );
      current = nearest;
    }

    return dayGroup;
  });
};

const orderByNearestNeighbor = (spots) => {
  if (spots.length <= 1) {
    return spots;
  }

  const unvisited = [...spots];
  const ordered = [];
  let current = unvisited.shift();
  ordered.push(current);

  while (unvisited.length > 0) {
    const nearest = findNearest(current, unvisited);
    ordered.push(nearest);
    unvisited.splice(
      unvisited.findIndex((place) => place.id === nearest.id),
      1
    );
    current = nearest;
  }

  return ordered;
};

const groupSpotsByDay = (spots, totalDays = 1) => {
  const safeDays = Math.max(1, Number(totalDays) || 1);
  const foodPlaces = spots.filter(isFoodPlace);
  const nonFoodPlaces = spots.filter((place) => !isFoodPlace(place));

  const totalDayCounts = createBalancedDayCounts(spots.length, safeDays);
  const foodDayCounts = createBalancedDayCounts(foodPlaces.length, safeDays);
  const nonFoodDayCounts = totalDayCounts.map((totalCount, index) => totalCount - foodDayCounts[index]);

  const foodByDay = distributeSpotsByDayCounts(foodPlaces, foodDayCounts);
  const nonFoodByDay = distributeSpotsByDayCounts(nonFoodPlaces, nonFoodDayCounts);

  return Array.from({ length: safeDays }, (_, index) =>
    orderByNearestNeighbor([...(foodByDay[index] || []), ...(nonFoodByDay[index] || [])])
  );
};

const generateItinerary = ({ places, days }) => {
  const safeDays = Math.max(1, Number(days) || 1);
  const safePlaces = Array.isArray(places) ? places : [];
  const grouped = groupSpotsByDay(safePlaces, safeDays);

  return Array.from({ length: safeDays }, (_, index) => ({
    day: index + 1,
    places: grouped[index] || [],
  }));
};

module.exports = {
  CATEGORY_TAGS,
  geocodeLocation,
  fetchNearbyPlaces,
  groupSpotsByDay,
  generateItinerary,
};
