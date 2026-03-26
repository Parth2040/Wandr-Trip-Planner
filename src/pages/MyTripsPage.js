import { useNavigate } from 'react-router-dom';
import { useTrip } from '../context/TripContext';

const countPlaces = (itinerary = []) =>
  (Array.isArray(itinerary) ? itinerary : []).reduce((total, day) => total + (day.places || []).length, 0);

export default function MyTripsPage() {
  const navigate = useNavigate();
  const { sessionTrips, setTripResult } = useTrip();
  const plannedTrips = (sessionTrips || []).filter((trip) => Array.isArray(trip?.itinerary) && trip.itinerary.length > 0);

  const openTrip = (trip) => {
    setTripResult({
      app: trip.app || 'Wandr',
      locationName: trip.locationName,
      center: trip.center,
      interests: trip.interests || [],
      days: Number(trip.days || trip.itinerary?.length || 1),
      itinerary: trip.itinerary || [],
      totalPlaces: countPlaces(trip.itinerary || []),
    });

    navigate('/itinerary');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-slate-900">My Trips</h1>
      <p className="text-sm text-slate-500">Saved planned trips for this session.</p>

      {/* WANDR CHANGE [7] — required My Trips empty state for session-only persistence. */}
      {plannedTrips.length === 0 && (
        <div className="wandr-card rounded-2xl p-6 text-sm text-slate-600">
          No planned trips yet — your adventures will appear here 🌍
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {plannedTrips.map((trip) => (
          <button
            key={trip.sessionId || `${trip.locationName}-${trip.createdAt}`}
            type="button"
            onClick={() => openTrip(trip)}
            className="wandr-card rounded-2xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:shadow"
          >
            <p className="text-lg font-semibold text-slate-900">{trip.locationName}</p>
            <p className="mt-1 text-sm text-slate-500">
              {trip.days || trip.itinerary?.length || 1} day(s) • {countPlaces(trip.itinerary || [])} spots
            </p>
            <p className="mt-2 text-xs text-indigo-600">Open itinerary</p>
          </button>
        ))}
      </div>
    </div>
  );
}
