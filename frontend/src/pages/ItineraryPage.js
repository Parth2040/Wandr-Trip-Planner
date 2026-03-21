import { useEffect, useState } from 'react';
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

        {displayItinerary.map((day) => (
          <div key={day.day} className="mt-4">
            <h3 className="font-semibold text-slate-800">Day {day.day}</h3>
            <ul className="mt-2 space-y-2">
              {day.places.map((place) => (
                <li key={place.id}>
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
                      🔍 View on Google
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}

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
          heightClass="h-[75vh]"
        />
      </section>
    </div>
  );
}
