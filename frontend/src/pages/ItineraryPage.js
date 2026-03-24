import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import MapcartaView from '../components/MapcartaView';
import { enrichItineraryWithRatings, formatReviewLabel } from '../services/placeUtils';
import { openGoogleSearch } from '../utils/openGoogleSearch';

export default function ItineraryPage() {
  const { tripResult, saveTripToSession } = useTrip();
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [displayItinerary, setDisplayItinerary] = useState(tripResult?.itinerary || []);
  const [activeDay, setActiveDay] = useState(1);
  const [revealedCardCount, setRevealedCardCount] = useState(0);

  useEffect(() => {
    if (!tripResult?.itinerary) {
      return;
    }

    let cancelled = false;

    const hydrateRatings = async () => {
      const ratedItinerary = await enrichItineraryWithRatings(tripResult.itinerary);
      if (!cancelled) {
        setDisplayItinerary(ratedItinerary);
      }
    };

    hydrateRatings();

    return () => {
      cancelled = true;
    };
  }, [tripResult]);

  useEffect(() => {
    if (!displayItinerary.length) {
      return;
    }

    setActiveDay(displayItinerary[0].day);
  }, [displayItinerary]);

  const activeDayData = useMemo(
    () => displayItinerary.find((day) => day.day === activeDay) || displayItinerary[0] || { day: 1, places: [] },
    [activeDay, displayItinerary]
  );

  useEffect(() => {
    const places = activeDayData?.places || [];
    setRevealedCardCount(0);

    const timers = places.map((_, index) =>
      setTimeout(() => {
        setRevealedCardCount(index + 1);
      }, (index + 1) * 350)
    );

    return () => {
      timers.forEach((timerId) => clearTimeout(timerId));
    };
  }, [activeDayData.day, activeDayData.places]);

  if (!tripResult) {
    return <Navigate to="/location" replace />;
  }

  const saveTrip = () => {
    saveTripToSession({
      app: tripResult.app || 'Wandr',
      locationName: tripResult.locationName,
      center: tripResult.center,
      interests: tripResult.interests,
      days: tripResult.days,
      itinerary: displayItinerary,
      totalPlaces: displayItinerary.reduce((sum, day) => sum + (day.places || []).length, 0),
    });
    setSaveMessage('Trip saved to My Trips for this session.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <aside className="lg:col-span-1 wandr-card p-4 h-[75vh] overflow-auto">
        <h2 className="text-xl font-bold text-wandr-700">Wandr Itinerary</h2>
        <p className="text-sm text-slate-600">{tripResult.locationName}</p>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {displayItinerary.map((day) => (
            <button
              key={day.day}
              type="button"
              onClick={() => setActiveDay(day.day)}
              className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                activeDay === day.day ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Day {day.day}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-slate-800">Day {activeDayData.day}</h3>
          <ul className="mt-2 space-y-2">
            {activeDayData.places.map((place, index) => {
              const isVisible = index < revealedCardCount;

              return (
              <li
                key={`${activeDayData.day}-${place.id}`}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                }}
                className={!isVisible ? 'pointer-events-none' : ''}
              >
                <button
                  onClick={() => {
                    setSelectedPlace(place);
                    openGoogleSearch(place.name, tripResult.locationName);
                  }}
                  className="group w-full cursor-pointer rounded-lg border border-slate-200 p-2 text-left transition hover:bg-slate-50"
                >
                  <p className="font-medium">{place.name}</p>
                  <p className="text-xs text-slate-500">{place.category} • {place.distanceKm} km</p>
                  <div className="mt-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                    ⭐ {(Number(place.rating) || 0).toFixed(1)} / 5.0
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{formatReviewLabel(place)}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                    🔍 View on Google Maps
                  </p>
                </button>
              </li>
            );})}
          </ul>
        </div>

        <button className="mt-5 w-full wandr-btn bg-wandr-600 text-white" onClick={saveTrip}>
          Save Trip
        </button>
        {saveMessage && <p className="text-sm mt-2 text-slate-600">{saveMessage}</p>}
      </aside>

      <section className="lg:col-span-2 wandr-card p-2">
        <MapcartaView
          itinerary={displayItinerary}
          center={tripResult.center}
          selectedPlace={selectedPlace}
          cityName={tripResult.locationName}
          activeDay={activeDayData.day}
          revealedPinCount={revealedCardCount}
          heightClass="h-[75vh]"
        />
      </section>
    </div>
  );
}
