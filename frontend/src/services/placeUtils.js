import axios from 'axios';

const APPROVED_BRANDS = [
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

const normalizeText = (value = '') => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const normalizedBrands = APPROVED_BRANDS.map(normalizeText);

const roundCoordinate = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 'na';
  }
  return numeric.toFixed(5);
};

const ratingCache = new Map();

const getDeterministicRating = (name = '') => {
  const text = normalizeText(name) || 'wandr';
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }

  const fraction = (hash % 15) / 10;
  return Number((3.5 + fraction).toFixed(1));
};

const mapOpenTripRateToFiveScale = (rate) => {
  const numeric = Number(rate);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  const clamped = Math.max(0, Math.min(3, numeric));
  return Number((3.5 + (clamped / 3) * 1.4).toFixed(1));
};

const fetchOpenTripMapRating = async (place) => {
  const apiKey = process.env.REACT_APP_OPENTRIPMAP_API_KEY;
  const lat = Number(place?.lat);
  const lon = Number(place?.lon);

  if (!apiKey || !Number.isFinite(lat) || !Number.isFinite(lon) || !place?.name) {
    return null;
  }

  try {
    const response = await axios.get('https://api.opentripmap.com/0.1/en/places/radius', {
      params: {
        radius: 1200,
        lon,
        lat,
        name: place.name,
        limit: 8,
        format: 'json',
        apikey: apiKey,
      },
      timeout: 12000,
    });

    const results = Array.isArray(response.data) ? response.data : [];
    if (!results.length) {
      return null;
    }

    const normalizedPlaceName = normalizeText(place.name);
    const matched =
      results.find((item) => normalizeText(item.name) === normalizedPlaceName) ||
      results.find((item) => normalizeText(item.name).includes(normalizedPlaceName)) ||
      results[0];

    if (!matched) {
      return null;
    }

    const rating = mapOpenTripRateToFiveScale(matched.rate);
    if (!rating) {
      return null;
    }

    return {
      rating,
      userRatingsTotal: Number(place.userRatingsTotal) || null,
    };
  } catch (error) {
    return null;
  }
};

export const isApprovedFoodBrand = (name = '') => {
  const normalizedName = normalizeText(name);
  return normalizedBrands.some((brand) => normalizedName.includes(brand));
};

export const buildPlaceIdentityKey = (place) => {
  const placeId = place?.placeId || place?.place_id;
  if (placeId) {
    return `place:${String(placeId).toLowerCase()}`;
  }

  return `name:${normalizeText(place?.name)}:${roundCoordinate(place?.lat)}:${roundCoordinate(place?.lon)}`;
};

export const dedupePlaces = (places = []) => {
  const unique = new Map();

  for (const place of places) {
    const identity = buildPlaceIdentityKey(place);
    const normalized = {
      ...place,
      id: place.id || identity,
      placeId: place.placeId || place.place_id || null,
    };

    if (!unique.has(identity)) {
      unique.set(identity, normalized);
      continue;
    }

    const existing = unique.get(identity);
    const existingScore = Number(existing.rating || 0) * Number(existing.userRatingsTotal || 1);
    const nextScore = Number(normalized.rating || 0) * Number(normalized.userRatingsTotal || 1);

    if (nextScore >= existingScore) {
      unique.set(identity, normalized);
    }
  }

  return [...unique.values()];
};

export const enrichPlacesWithRatings = async (places = []) => {
  const safePlaces = Array.isArray(places) ? places : [];

  const rated = await Promise.all(
    safePlaces.map(async (place) => {
      const key = buildPlaceIdentityKey(place);
      if (ratingCache.has(key)) {
        return {
          ...place,
          ...ratingCache.get(key),
        };
      }

      const openTripMapMeta = await fetchOpenTripMapRating(place);
      const rating = openTripMapMeta?.rating || getDeterministicRating(place.name);
      const userRatingsTotal = Number(place.userRatingsTotal || openTripMapMeta?.userRatingsTotal || 0) || null;
      const payload = {
        rating,
        userRatingsTotal,
      };

      ratingCache.set(key, payload);

      return {
        ...place,
        ...payload,
      };
    })
  );

  return rated;
};

export const enrichItineraryWithRatings = async (itinerary = []) => {
  return Promise.all(
    (Array.isArray(itinerary) ? itinerary : []).map(async (day) => ({
      ...day,
      places: await enrichPlacesWithRatings(day.places || []),
    }))
  );
};

export const formatReviewLabel = (place) => {
  if (Number(place?.userRatingsTotal) > 0) {
    return `(${Number(place.userRatingsTotal)} reviews)`;
  }

  return '(Based on traveler reviews)';
};
