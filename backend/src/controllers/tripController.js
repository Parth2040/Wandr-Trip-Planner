const Trip = require('../models/Trip');
const { geocodeLocation, fetchNearbyPlaces, generateItinerary } = require('../services/mapService');

// In-memory cache for discover results (10-minute TTL).
const discoverCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

const buildDiscoverCacheKey = (locationName, interests) => {
  const loc = String(locationName || '').trim().toLowerCase();
  const ints = [...(interests || [])].map((i) => String(i).trim().toLowerCase()).sort().join('|');
  return `${loc}::${ints}`;
};

const getCachedDiscover = (key) => {
  const entry = discoverCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    discoverCache.delete(key);
    return null;
  }
  return entry.data;
};

const generateTrip = async (req, res) => {
  try {
    const { locationName, lat, lon, interests, days } = req.body;

    if (!locationName || !Array.isArray(interests) || interests.length === 0 || !days) {
      return res.status(400).json({
        message: 'locationName, interests and days are required.',
      });
    }

    if (days < 1 || days > 10) {
      return res.status(400).json({ message: 'days must be between 1 and 10.' });
    }

    // Use provided coordinates when available, otherwise geocode by place name.
    const center = lat && lon ? { lat: Number(lat), lon: Number(lon) } : await geocodeLocation(locationName);

    const places = await fetchNearbyPlaces({
      locationName,
      lat: center.lat,
      lon: center.lon,
      interests,
    });

    // Generate day-wise itinerary after sorting nearby places.
    const itinerary = generateItinerary({ places, days: Number(days) });

    return res.json({
      app: 'Wandr',
      locationName,
      center: {
        lat: center.lat,
        lon: center.lon,
      },
      interests,
      days,
      itinerary,
      totalPlaces: places.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to generate trip.' });
  }
};

const discoverSpots = async (req, res) => {
  try {
    const { locationName, lat, lon, interests, foodBrandsOnly } = req.body;

    if (!locationName || !Array.isArray(interests) || interests.length === 0) {
      return res.status(400).json({ message: 'locationName and interests are required.' });
    }

    // Check cache first to avoid repeated external API calls.
    const cacheKey = buildDiscoverCacheKey(locationName, interests);
    const cached = getCachedDiscover(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const center = lat && lon ? { lat: Number(lat), lon: Number(lon) } : await geocodeLocation(locationName);
    const places = await fetchNearbyPlaces({
      locationName,
      lat: center.lat,
      lon: center.lon,
      interests,
      foodBrandsOnly: Boolean(foodBrandsOnly),
    });

    const result = {
      app: 'Wandr',
      locationName,
      center,
      interests,
      places,
      totalPlaces: places.length,
    };

    // Store in cache for subsequent requests.
    discoverCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to discover spots.' });
  }
};

const saveTrip = async (req, res) => {
  try {
    const { locationName, center, interests, days, itinerary } = req.body;

    if (!locationName || !center || !Array.isArray(itinerary)) {
      return res.status(400).json({ message: 'Invalid trip payload.' });
    }

    const saved = await Trip.create({
      userId: req.user.id,
      locationName,
      center,
      interests,
      days,
      itinerary,
    });

    return res.status(201).json(saved);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to save trip.' });
  }
};

const getSavedTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json(trips);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch saved trips.' });
  }
};

module.exports = {
  generateTrip,
  discoverSpots,
  saveTrip,
  getSavedTrips,
};
