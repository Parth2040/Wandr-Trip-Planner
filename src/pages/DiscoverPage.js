import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTrip } from '../context/TripContext';
import {
  dedupePlaces,
  enrichPlacesWithRatings,
  formatReviewLabel,
} from '../services/placeUtils';

const CATEGORY_MATCHERS = {
  'Historical Places': ['historic', 'history', 'museum', 'landmark'],
  Nature: ['nature', 'waterfall', 'viewpoint', 'peak'],
  'Religious Places': ['religious', 'worship', 'temple', 'church', 'mosque', 'shrine'],
  'Food Spots': ['food', 'restaurant', 'cafe'],
  'Popular Spots': ['popular', 'attraction', 'tourist'],
  'Top Rated': ['top rated', 'top_rated', 'top-rated'],
  'Hidden Gems': ['hidden', 'gem', 'artwork', 'gallery'],
  'Adventure Sports': ['adventure', 'sport', 'outdoor'],
  Parks: ['park', 'garden'],
  Beaches: ['beach'],
  Bars: ['bar', 'pub'],
  Casinos: ['casino'],
};

const FOOD_TAB = 'Food Spots';
const FOOD_MIN_RATING = 4.2;
const OTHER_MIN_RATING = 3.5;

const DISCOVER_SEARCH_TERMS = {
  'Historical Places': ['historical landmark', 'museum'],
  Nature: ['park', 'viewpoint'],
  'Religious Places': ['temple', 'church'],
  'Food Spots': ['restaurant', 'cafe'],
  'Popular Spots': ['tourist attraction', 'landmark'],
  'Top Rated': ['must visit', 'top attraction'],
  'Hidden Gems': ['local attraction', 'gallery'],
  'Adventure Sports': ['outdoor activity', 'sports center'],
  Parks: ['park', 'garden'],
  Beaches: ['beach'],
  Bars: ['bar', 'pub'],
  Casinos: ['casino'],
};

// WANDR FIX [2] — session-backed discover cache and selected state restoration.
const DISCOVER_SESSION_KEYS = {
  INPUT: 'wandr_trip_input',
  SPOTS: 'wandr_discover_spots',
  SELECTED: 'wandr_discover_selected',
};

const DISCOVER_IN_FLIGHT_REQUESTS = new Map();

const readSessionJson = (key, fallbackValue) => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) {
      return fallbackValue;
    }

    const parsed = JSON.parse(raw);
    return parsed ?? fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
};

const writeSessionJson = (key, value) => {
  sessionStorage.setItem(key, JSON.stringify(value));
};

const createDiscoverCacheKey = (locationName = '', interests = []) => {
  const normalizedLocation = String(locationName || '').trim().toLowerCase();
  const normalizedInterests = [...(interests || [])].map((interest) => String(interest || '').trim().toLowerCase()).sort();
  return `${normalizedLocation}::${normalizedInterests.join('|')}`;
};

const createDiscoverRequestKey = ({ locationName = '', lat = 0, lon = 0, interests = [] }) => {
  const normalizedLocation = String(locationName || '').trim().toLowerCase();
  const normalizedLat = Number(lat || 0).toFixed(6);
  const normalizedLon = Number(lon || 0).toFixed(6);
  const normalizedInterests = [...(interests || [])]
    .map((interest) => String(interest || '').trim().toLowerCase())
    .sort()
    .join('|');
  return `${normalizedLocation}::${normalizedLat}::${normalizedLon}::${normalizedInterests}`;
};

const resolveLocationCenter = async (locationName) => {
  const params = new URLSearchParams({
    q: locationName,
    format: 'jsonv2',
    limit: '1',
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Unable to discover spots right now.');
  }

  const data = await response.json();
  const first = Array.isArray(data) ? data[0] : null;

  if (!first?.lat || !first?.lon) {
    throw new Error('Location not found. Please try a different destination.');
  }

  return {
    lat: Number(first.lat),
    lon: Number(first.lon),
  };
};

const searchPlacesForInterest = async ({ locationName, interest }) => {
  const terms = (DISCOVER_SEARCH_TERMS[interest] || [interest]).slice(0, 2);

  const requests = terms.map(async (term) => {
    const params = new URLSearchParams({
      q: `${term} in ${locationName}`,
      format: 'jsonv2',
      limit: '10',
      addressdetails: '0',
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (Array.isArray(data) ? data : []).map((item) => ({
      id: `discover-${item.place_id}`,
      placeId: `discover-${item.place_id}`,
      name: String(item.display_name || '').split(',')[0] || 'Point of Interest',
      category: interest,
      lat: Number(item.lat),
      lon: Number(item.lon),
      source: 'discover-local',
    }));
  });

  const settled = await Promise.allSettled(requests);
  return settled
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => result.value)
    .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lon));
};

const fetchDiscoverPlaces = async ({ locationName, center, interests }) => {
  const payload = {
    locationName,
    interests,
  };

  if (center && Number.isFinite(Number(center.lat)) && Number.isFinite(Number(center.lon))) {
    payload.lat = Number(center.lat);
    payload.lon = Number(center.lon);
  }

  const requestKey = createDiscoverRequestKey(payload);
  if (DISCOVER_IN_FLIGHT_REQUESTS.has(requestKey)) {
    return DISCOVER_IN_FLIGHT_REQUESTS.get(requestKey);
  }

  const requestPromise = (async () => {
    const resolvedCenter =
      center && Number.isFinite(Number(center.lat)) && Number.isFinite(Number(center.lon))
        ? {
            lat: Number(center.lat),
            lon: Number(center.lon),
          }
        : await resolveLocationCenter(locationName);

    const selectedInterests = Array.isArray(interests) && interests.length ? interests : ['Popular Spots'];
    const interestRequests = selectedInterests.slice(0, 6).map((interest) =>
      searchPlacesForInterest({
        locationName,
        interest,
      })
    );

    const settled = await Promise.allSettled(interestRequests);
    const places = dedupePlaces(
      settled
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => result.value)
    );

    return {
      data: {
        app: 'Wandr',
        locationName,
        center: resolvedCenter,
        interests: selectedInterests,
        places,
        totalPlaces: places.length,
      },
    };
  })().finally(() => {
    DISCOVER_IN_FLIGHT_REQUESTS.delete(requestKey);
  });

  DISCOVER_IN_FLIGHT_REQUESTS.set(requestKey, requestPromise);
  return requestPromise;
};

const toRadians = (value) => (value * Math.PI) / 180;

const normalizeCategory = (value = '') => value.toLowerCase();

const passesRatingThreshold = (spot) => {
  const rating = Number(spot?.rating || 0);
  if (isFoodSpot(spot)) {
    return rating > FOOD_MIN_RATING;
  }
  return rating > OTHER_MIN_RATING;
};

const mapAndPrepareSpots = async (rawSpots, source = 'discover') => {
  const mapped = (rawSpots || []).map((spot, index) => ({
    ...spot,
    id: spot.id || spot.placeId || spot.place_id || `${source}-${index}`,
    placeId: spot.placeId || spot.place_id || null,
  }));

  const unique = dedupePlaces(mapped);
  const rated = await enrichPlacesWithRatings(unique);
  return rated.filter(passesRatingThreshold);
};

const haversineDistance = (a, b) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(x));
};

const findNearest = (current, candidates) => {
  let nearest = candidates[0];
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const distance = haversineDistance(current, candidate);
    if (distance < nearestDistance) {
      nearest = candidate;
      nearestDistance = distance;
    }
  }

  return nearest;
};

const createBalancedDayCounts = (totalSpots, totalDays) => {
  const safeDays = Math.max(1, Number(totalDays) || 1);
  const safeTotal = Math.max(0, Number(totalSpots) || 0);
  const basePerDay = Math.floor(safeTotal / safeDays);
  const remainder = safeTotal % safeDays;

  return Array.from({ length: safeDays }, (_, index) => basePerDay + (index < remainder ? 1 : 0));
};

const sortByRatingDesc = (spots) => [...spots].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));

const isFoodSpot = (spot) => {
  const category = normalizeCategory(spot?.category);
  return ['food', 'restaurant', 'cafe'].some((keyword) => category.includes(keyword));
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
        unvisited.findIndex((spot) => spot.id === nearest.id),
        1
      );
      current = nearest;
    }

    return dayGroup;
  });
};

const removeSpotFromPool = (pool, spotId) => {
  const index = pool.findIndex((spot) => spot.id === spotId);
  if (index >= 0) {
    pool.splice(index, 1);
  }
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
      unvisited.findIndex((spot) => spot.id === nearest.id),
      1
    );
    current = nearest;
  }

  return ordered;
};

const groupSpotsByDay = (spots, days) => {
  const safeDays = Math.max(1, Number(days) || 1);
  const foodSpots = spots.filter(isFoodSpot);
  const nonFoodSpots = spots.filter((spot) => !isFoodSpot(spot));

  const totalDayCounts = createBalancedDayCounts(spots.length, safeDays);
  const foodDayCounts = createBalancedDayCounts(foodSpots.length, safeDays);
  const nonFoodDayCounts = totalDayCounts.map((totalCount, index) => totalCount - foodDayCounts[index]);

  const foodByDay = distributeSpotsByDayCounts(foodSpots, foodDayCounts);
  const nonFoodByDay = distributeSpotsByDayCounts(nonFoodSpots, nonFoodDayCounts);

  return Array.from({ length: safeDays }, (_, index) => ({
    day: index + 1,
    places: orderByNearestNeighbor([...(foodByDay[index] || []), ...(nonFoodByDay[index] || [])]),
  }));
};

// WANDR CHANGE [6] — smart planner itinerary with unique spots and max two food spots per day.
const buildPlanForMeItinerary = (spots, days) => {
  const safeDays = Math.max(1, Number(days) || 1);
  const requiredPerDay = 5;
  const maxFoodPerDay = 2;
  const rankedSpots = sortByRatingDesc(dedupePlaces(spots));

  if (!rankedSpots.length) {
    return Array.from({ length: safeDays }, (_, index) => ({
      day: index + 1,
      places: [],
    }));
  }

  const unassigned = [...rankedSpots];
  const dayBuckets = Array.from({ length: safeDays }, () => []);

  for (let dayIndex = 0; dayIndex < safeDays; dayIndex += 1) {
    while (dayBuckets[dayIndex].length < requiredPerDay && unassigned.length > 0) {
      const currentFoodCount = dayBuckets[dayIndex].filter(isFoodSpot).length;
      const candidates =
        currentFoodCount >= maxFoodPerDay
          ? unassigned.filter((spot) => !isFoodSpot(spot))
          : unassigned;

      if (!candidates.length) {
        break;
      }

      const nextSpot =
        dayBuckets[dayIndex].length === 0
          ? candidates[0]
          : findNearest(dayBuckets[dayIndex][dayBuckets[dayIndex].length - 1], candidates);

      dayBuckets[dayIndex].push(nextSpot);
      removeSpotFromPool(unassigned, nextSpot.id);
    }
  }

  return dayBuckets.map((places, index) => ({
    day: index + 1,
    places: orderByNearestNeighbor(places),
  }));
};

const spotMatchesPreference = (spot, preference) => {
  const category = normalizeCategory(spot.category);

  if (preference === FOOD_TAB) {
    return isFoodSpot(spot) && Number(spot.rating || 0) > FOOD_MIN_RATING;
  }

  if (preference === 'Top Rated') {
    return Number(spot.rating || 0) >= 4.5 || category.includes('top');
  }

  const keywords = CATEGORY_MATCHERS[preference] || [normalizeCategory(preference)];
  return keywords.some((keyword) => category.includes(keyword));
};

export default function DiscoverPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tripInput, setTripInput, planTrip } = useTrip();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [spots, setSpots] = useState([]);
  const [foodSpots, setFoodSpots] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // WANDR FIX [2] — read destination/preferences from sessionStorage fallback for back-navigation reloads.
  const discoverRequestInput = useMemo(() => {
    const sessionInput = readSessionJson(DISCOVER_SESSION_KEYS.INPUT, {});
    return {
      locationName: tripInput.locationName || sessionInput.locationName || '',
      center: tripInput.center || sessionInput.center || null,
      interests:
        (Array.isArray(tripInput.interests) && tripInput.interests.length > 0
          ? tripInput.interests
          : Array.isArray(sessionInput.interests)
            ? sessionInput.interests
            : []),
    };
  }, [tripInput.locationName, tripInput.center, tripInput.interests]);

  const discoverCacheKey = useMemo(
    () => createDiscoverCacheKey(discoverRequestInput.locationName, discoverRequestInput.interests),
    [discoverRequestInput.locationName, discoverRequestInput.interests]
  );

  const interestsSignature = useMemo(
    () => (discoverRequestInput.interests || []).join('|'),
    [discoverRequestInput.interests]
  );

  // WANDR FIX [2] — restore selected spots from sessionStorage without resetting user choices.
  const restoreSelectionFromSession = useCallback(
    (availableSpots, fallbackSelectedIds = []) => {
      if (!discoverCacheKey) {
        setSelectedIds(new Set(fallbackSelectedIds));
        return;
      }

      const selectedStore = readSessionJson(DISCOVER_SESSION_KEYS.SELECTED, {});
      const storedIds = Array.isArray(selectedStore[discoverCacheKey])
        ? selectedStore[discoverCacheKey]
        : fallbackSelectedIds;

      const availableIds = new Set((availableSpots || []).map((spot) => spot.id));
      setSelectedIds(new Set(storedIds.filter((spotId) => availableIds.has(spotId))));
    },
    [discoverCacheKey]
  );

  const filterTabs = useMemo(() => {
    const selectedInterests = (discoverRequestInput.interests || []).filter(Boolean);
    return ['All', ...new Set(selectedInterests)];
  }, [discoverRequestInput.interests]);

  // WANDR FIX [2] — hydrate discover spots immediately from session cache to avoid empty flash during reload.
  useEffect(() => {
    if (!discoverCacheKey) {
      return;
    }

    const spotsStore = readSessionJson(DISCOVER_SESSION_KEYS.SPOTS, {});
    const cachedSpots = Array.isArray(spotsStore[discoverCacheKey]) ? spotsStore[discoverCacheKey] : [];

    if (!cachedSpots.length) {
      return;
    }

    setSpots(cachedSpots);
    setFoodSpots(dedupePlaces(cachedSpots.filter((spot) => isFoodSpot(spot) && Number(spot.rating || 0) > FOOD_MIN_RATING)));
    restoreSelectionFromSession(cachedSpots);
  }, [discoverCacheKey, restoreSelectionFromSession]);

  // WANDR FIX [2] — persist selected spot ids per destination/preferences for restore on back-navigation.
  useEffect(() => {
    if (!discoverCacheKey) {
      return;
    }

    const selectedStore = readSessionJson(DISCOVER_SESSION_KEYS.SELECTED, {});
    selectedStore[discoverCacheKey] = Array.from(selectedIds);
    writeSessionJson(DISCOVER_SESSION_KEYS.SELECTED, selectedStore);
  }, [discoverCacheKey, selectedIds]);

  useEffect(() => {
    const preset = location.state?.preset;
    if (!preset) {
      return;
    }

    let cancelled = false;

    setTripInput((previous) => ({
      ...previous,
      locationName: preset.name,
      center: preset.center,
      days: preset.days,
      interests: previous.interests.length ? previous.interests : ['Popular Spots', 'Top Rated', 'Historical Places'],
    }));

    const loadPresetSpots = async () => {
      const ratedPresetSpots = await mapAndPrepareSpots(
        (preset.spots || []).map((spot) => ({
          ...spot,
          source: 'preset',
        })),
        'preset'
      );

      if (cancelled) {
        return;
      }

      setSpots(ratedPresetSpots);
      setFoodSpots(dedupePlaces(ratedPresetSpots.filter((spot) => isFoodSpot(spot) && Number(spot.rating || 0) > FOOD_MIN_RATING)));
      restoreSelectionFromSession(ratedPresetSpots, ratedPresetSpots.map((spot) => spot.id));

      if (discoverCacheKey) {
        const spotsStore = readSessionJson(DISCOVER_SESSION_KEYS.SPOTS, {});
        spotsStore[discoverCacheKey] = ratedPresetSpots;
        writeSessionJson(DISCOVER_SESSION_KEYS.SPOTS, spotsStore);
      }
    };

    loadPresetSpots();

    return () => {
      cancelled = true;
    };
  }, [discoverCacheKey, location.state, restoreSelectionFromSession, setTripInput]);

  useEffect(() => {
    if (!discoverRequestInput.locationName) {
      return;
    }

    let cancelled = false;

    // WANDR FIX [2] — re-fetch spots on route key changes (including browser back/forward navigation).
    const fetchSpots = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetchDiscoverPlaces({
          locationName: discoverRequestInput.locationName,
          center: discoverRequestInput.center,
          interests: discoverRequestInput.interests,
        });

        const responseCenter = response?.data?.center;
        if (!discoverRequestInput.center && responseCenter?.lat && responseCenter?.lon) {
          setTripInput((previous) => ({
            ...previous,
            center: {
              lat: Number(responseCenter.lat),
              lon: Number(responseCenter.lon),
            },
          }));
        }

        const discovered = await mapAndPrepareSpots(response.data?.places || [], 'discover');

        if (cancelled) {
          return;
        }

        setSpots(discovered);
        setFoodSpots(dedupePlaces(discovered.filter((spot) => isFoodSpot(spot) && Number(spot.rating || 0) > FOOD_MIN_RATING)));

        if (discoverCacheKey) {
          const spotsStore = readSessionJson(DISCOVER_SESSION_KEYS.SPOTS, {});
          spotsStore[discoverCacheKey] = discovered;
          writeSessionJson(DISCOVER_SESSION_KEYS.SPOTS, spotsStore);
        }

        restoreSelectionFromSession(discovered);
      } catch (requestError) {
        setError(requestError?.response?.data?.message || 'Unable to discover spots right now.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSpots();

    return () => {
      cancelled = true;
    };
  }, [discoverCacheKey, discoverRequestInput.locationName, discoverRequestInput.center, interestsSignature, restoreSelectionFromSession]);

  useEffect(() => {
    setFoodSpots(dedupePlaces(spots.filter((spot) => isFoodSpot(spot) && Number(spot.rating || 0) > FOOD_MIN_RATING)));
  }, [spots]);

  useEffect(() => {
    if (!filterTabs.includes(activeTab)) {
      setActiveTab('All');
    }
  }, [activeTab, filterTabs]);

  const filteredSpots = useMemo(() => {
    if (activeTab === 'All') {
      return dedupePlaces(spots);
    }

    if (activeTab === FOOD_TAB) {
      return dedupePlaces(foodSpots);
    }

    return dedupePlaces(spots.filter((spot) => spotMatchesPreference(spot, activeTab)));
  }, [activeTab, spots, foodSpots]);

  const showLoadingSkeleton = loading && filteredSpots.length === 0;

  const allSelectableSpots = useMemo(() => dedupePlaces([...spots, ...foodSpots]), [spots, foodSpots]);

  const visibleSections = useMemo(() => filterTabs.filter((tab) => tab !== 'All'), [filterTabs]);

  const selectedCount = useMemo(
    () => allSelectableSpots.filter((spot) => selectedIds.has(spot.id)).length,
    [allSelectableSpots, selectedIds]
  );

  const toggleSpot = (spotId) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(spotId)) {
        next.delete(spotId);
      } else {
        next.add(spotId);
      }
      return next;
    });
  };

  const addToItinerary = () => {
    const selectedSpots = allSelectableSpots.filter((spot) => selectedIds.has(spot.id));
    if (!selectedSpots.length) {
      return;
    }

    const itinerary = groupSpotsByDay(selectedSpots, Number(tripInput.days || 1));
    // WANDR CHANGE [8] — notification is added through shared planTrip flow only after successful planning.
    planTrip({
      app: 'Wandr',
      locationName: tripInput.locationName,
      center: tripInput.center,
      interests: tripInput.interests,
      days: Number(tripInput.days || 1),
      itinerary,
      totalPlaces: selectedSpots.length,
    });

    navigate('/itinerary');
  };

  // WANDR CHANGE [6] — smart auto-selection and planning from visible sections.
  const handlePlanForMe = () => {
    const autoSelected = dedupePlaces(
      visibleSections.flatMap((section) => allSelectableSpots.filter((spot) => spotMatchesPreference(spot, section)))
    );

    const effectiveSelection = autoSelected.length ? autoSelected : dedupePlaces(allSelectableSpots);

    if (!effectiveSelection.length) {
      setError('No spots matching your selected preferences are available right now.');
      return;
    }

    const itinerary = buildPlanForMeItinerary(effectiveSelection, Number(tripInput.days || 1));
    const plannedIds = itinerary.flatMap((day) => day.places || []).map((spot) => spot.id);
    setSelectedIds(new Set(plannedIds));

    planTrip({
      app: 'Wandr',
      locationName: tripInput.locationName,
      center: tripInput.center,
      interests: tripInput.interests,
      days: Number(tripInput.days || 1),
      itinerary,
      totalPlaces: itinerary.reduce((sum, day) => sum + (day.places || []).length, 0),
    });

    navigate('/itinerary');
  };

  return (
    <div className="space-y-4 pb-24">
      <h1 className="text-3xl font-bold text-slate-900">Discover Spots</h1>
      <p className="text-slate-500">{tripInput.locationName || 'Choose a location first'}</p>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
              activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* WANDR FIX [2] — show loading skeleton during back-navigation reload with no empty state flash. */}
      {showLoadingSkeleton && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`discover-skeleton-${index}`} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
              <div className="h-5 w-2/3 rounded bg-slate-200" />
              <div className="mt-3 h-3 w-1/3 rounded bg-slate-200" />
              <div className="mt-4 h-6 w-24 rounded-full bg-amber-100" />
              <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      )}
      {!showLoadingSkeleton && loading && (
        <LoadingSpinner
          label={activeTab === FOOD_TAB ? 'Finding top rated food spots for you...' : 'Finding top rated places for you...'}
        />
      )}
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filteredSpots.map((spot) => {
          const selected = selectedIds.has(spot.id);
          return (
            <button
              key={spot.id}
              type="button"
              onClick={() => toggleSpot(spot.id)}
              className="relative rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              {/* WANDR CHANGE [5] — card click only toggles selection on Discover page. */}
              <span
                className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                ✓
              </span>
              <p className="pr-8 text-base font-semibold text-slate-900">{spot.name}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{spot.category || 'Point of Interest'}</p>
              <div className="mt-3 inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                ⭐ {(Number(spot.rating) || 0).toFixed(1)} / 5.0
              </div>
              <p className="mt-1 text-xs text-slate-500">{formatReviewLabel(spot)}</p>
            </button>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-2">
          <button
            onClick={handlePlanForMe}
            className="wandr-btn wandr-smart-btn rounded-full px-6 text-white"
          >
            Plan for Me ✦
          </button>
          <button
            onClick={addToItinerary}
            disabled={selectedCount === 0}
            className="wandr-btn rounded-full bg-slate-900 px-6 text-white disabled:bg-slate-300"
          >
            Add {selectedCount} Spots
          </button>
        </div>
      </div>
    </div>
  );
}
