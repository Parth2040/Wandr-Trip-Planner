import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTrip } from '../context/TripContext';
import {
  dedupePlaces,
  enrichPlacesWithRatings,
  formatReviewLabel,
  isApprovedFoodBrand,
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

const toRadians = (value) => (value * Math.PI) / 180;

const normalizeCategory = (value = '') => value.toLowerCase();

const mapAndPrepareSpots = async (rawSpots, source = 'discover') => {
  const mapped = (rawSpots || []).map((spot, index) => ({
    ...spot,
    id: spot.id || spot.placeId || spot.place_id || `${source}-${index}`,
    placeId: spot.placeId || spot.place_id || null,
  }));

  const unique = dedupePlaces(mapped);
  return enrichPlacesWithRatings(unique);
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

// WANDR CHANGE [6] — smart planner itinerary with max 5/day and food-per-day when available.
const buildPlanForMeItinerary = (spots, days) => {
  const safeDays = Math.max(1, Number(days) || 1);
  const maxSpots = safeDays * 5;
  const rankedSpots = sortByRatingDesc(spots).slice(0, maxSpots);
  const dayTargets = createBalancedDayCounts(rankedSpots.length, safeDays);

  const foodPool = sortByRatingDesc(rankedSpots.filter(isFoodSpot));
  const nonFoodPool = sortByRatingDesc(rankedSpots.filter((spot) => !isFoodSpot(spot)));
  const isRuralOrLimitedFood = foodPool.length < safeDays;
  const dayBuckets = Array.from({ length: safeDays }, () => []);

  if (!isRuralOrLimitedFood) {
    for (let dayIndex = 0; dayIndex < safeDays; dayIndex += 1) {
      if (dayTargets[dayIndex] <= 0 || foodPool.length === 0) {
        continue;
      }
      dayBuckets[dayIndex].push(foodPool.shift());
    }
  }

  for (let dayIndex = 0; dayIndex < safeDays; dayIndex += 1) {
    while (dayBuckets[dayIndex].length < dayTargets[dayIndex]) {
      const combinedPool = [...foodPool, ...nonFoodPool];
      if (!combinedPool.length) {
        break;
      }

      const nextSpot =
        dayBuckets[dayIndex].length === 0
          ? combinedPool[0]
          : findNearest(dayBuckets[dayIndex][dayBuckets[dayIndex].length - 1], combinedPool);

      dayBuckets[dayIndex].push(nextSpot);
      removeSpotFromPool(foodPool, nextSpot.id);
      removeSpotFromPool(nonFoodPool, nextSpot.id);
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
    return isFoodSpot(spot) && isApprovedFoodBrand(spot.name);
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
  const [brandedFoodSpots, setBrandedFoodSpots] = useState([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const filterTabs = useMemo(() => {
    const selectedInterests = (tripInput.interests || []).filter(Boolean);
    return ['All', ...new Set(selectedInterests)];
  }, [tripInput.interests]);

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
      setBrandedFoodSpots(
        dedupePlaces(ratedPresetSpots.filter((spot) => isFoodSpot(spot) && isApprovedFoodBrand(spot.name)))
      );
      setSelectedIds(new Set(ratedPresetSpots.map((spot) => spot.id)));
    };

    loadPresetSpots();

    return () => {
      cancelled = true;
    };
  }, [location.state, setTripInput]);

  useEffect(() => {
    if (!tripInput.locationName || !tripInput.center || spots.length > 0) {
      return;
    }

    let cancelled = false;

    const fetchSpots = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.post('/api/trip/discover', {
          locationName: tripInput.locationName,
          lat: tripInput.center.lat,
          lon: tripInput.center.lon,
          interests: tripInput.interests,
        });

        const discovered = await mapAndPrepareSpots(response.data?.places || [], 'discover');

        if (cancelled) {
          return;
        }

        setSpots(discovered);
        setBrandedFoodSpots(
          dedupePlaces(discovered.filter((spot) => isFoodSpot(spot) && isApprovedFoodBrand(spot.name)))
        );
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
  }, [tripInput.locationName, tripInput.center, tripInput.interests, spots.length]);

  useEffect(() => {
    if (activeTab !== FOOD_TAB || !tripInput.locationName || !tripInput.center) {
      return;
    }

    let cancelled = false;

    const fetchBrandedFoodSpots = async () => {
      setFoodLoading(true);
      setError('');

      try {
        const response = await api.post('/api/trip/discover', {
          locationName: tripInput.locationName,
          lat: tripInput.center.lat,
          lon: tripInput.center.lon,
          interests: [FOOD_TAB],
          foodBrandsOnly: true,
        });

        const branded = (await mapAndPrepareSpots(response.data?.places || [], 'food-tab')).filter(
          (spot) => isFoodSpot(spot) && isApprovedFoodBrand(spot.name)
        );

        if (cancelled) {
          return;
        }

        const uniqueBranded = dedupePlaces(branded);
        setBrandedFoodSpots(uniqueBranded);
        setSpots((previous) => dedupePlaces([...previous, ...uniqueBranded]));
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError?.response?.data?.message || 'Unable to discover branded food spots right now.');
        }
      } finally {
        if (!cancelled) {
          setFoodLoading(false);
        }
      }
    };

    fetchBrandedFoodSpots();

    return () => {
      cancelled = true;
    };
  }, [activeTab, tripInput.locationName, tripInput.center]);

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
      return dedupePlaces(brandedFoodSpots);
    }

    return dedupePlaces(spots.filter((spot) => spotMatchesPreference(spot, activeTab)));
  }, [activeTab, spots, brandedFoodSpots]);

  const allSelectableSpots = useMemo(() => dedupePlaces([...spots, ...brandedFoodSpots]), [spots, brandedFoodSpots]);

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
      visibleSections.flatMap((section) =>
        sortByRatingDesc(
          allSelectableSpots.filter((spot) => spotMatchesPreference(spot, section) && Number(spot.rating || 0) > 4.0)
        ).slice(0, 5)
      )
    );

    if (!autoSelected.length) {
      setError('No spots with rating above 4.0 are available for smart planning right now.');
      return;
    }

    setSelectedIds(new Set(autoSelected.map((spot) => spot.id)));
    const itinerary = buildPlanForMeItinerary(autoSelected, Number(tripInput.days || 1));

    planTrip({
      app: 'Wandr',
      locationName: tripInput.locationName,
      center: tripInput.center,
      interests: tripInput.interests,
      days: Number(tripInput.days || 1),
      itinerary,
      totalPlaces: autoSelected.length,
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

      {(loading || foodLoading) && (
        <LoadingSpinner
          label={activeTab === FOOD_TAB ? 'Finding branded food spots for you...' : 'Finding top rated places for you...'}
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
