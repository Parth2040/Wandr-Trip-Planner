import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { useTrip } from '../context/TripContext';
import LoadingSpinner from '../components/LoadingSpinner';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapRecenter({ center }) {
  const map = useMap();
  if (center) {
    map.flyTo([center.lat, center.lon], 12, { duration: 0.9 });
  }
  return null;
}

export default function LocationSearchPage() {
  const { tripInput, setTripInput, recordSearch } = useTrip();
  const [query, setQuery] = useState(tripInput.locationName || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const lastGeocodedRef = useRef('');
  const center = tripInput.center || { lat: 20.5937, lon: 78.9629 };

  const geocodeLocation = async (locationQuery) => {
    const trimmed = locationQuery.trim();
    if (!trimmed) {
      setError('Please enter a location.');
      return false;
    }

    if (trimmed.toLowerCase() === lastGeocodedRef.current.toLowerCase()) {
      return true;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: trimmed,
          format: 'json',
          limit: 1,
        },
        headers: {
          'User-Agent': 'Wandr-Travel-Planner/1.0',
        },
      });

      if (!response.data?.length) {
        setError('Location not found. Try another search.');
        return false;
      }

      const result = response.data[0];
      lastGeocodedRef.current = trimmed;
      setTripInput((previous) => ({
        ...previous,
        locationName: trimmed,
        center: {
          lat: Number(result.lat),
          lon: Number(result.lon),
        },
      }));

      // WANDR CHANGE [1] — persist location search history in sessionStorage.
      recordSearch({
        locationName: trimmed,
        center: {
          lat: Number(result.lat),
          lon: Number(result.lon),
        },
      });
      return true;
    } catch (err) {
      setError('Unable to search location right now.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    await geocodeLocation(query || tripInput.locationName || '');
  };

  const handleContinue = () => {
    if (!tripInput.locationName || !tripInput.center) {
      setError('Please use Search first to confirm your destination.');
      return;
    }

    navigate('/interests');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-wandr-700">Wandr Location Search</h1>
      {/* WANDR CHANGE [2] — dedicated Search action and Continue without implicit search. */}
      <p className="text-slate-600">Search your destination to recenter the map, then continue planning.</p>
      <div className="wandr-card p-4 flex flex-col sm:flex-row gap-2">
        <input
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2"
          placeholder="Enter city or place"
          value={query}
          onChange={(e) => {
            const nextValue = e.target.value;
            setQuery(nextValue);
            setTripInput((previous) => ({
              ...previous,
              locationName: nextValue,
              center:
                nextValue.trim().toLowerCase() === (lastGeocodedRef.current || '').trim().toLowerCase()
                  ? previous.center
                  : null,
            }));
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSearch();
            }
          }}
        />
        <button
          className="wandr-btn bg-indigo-600 text-white disabled:bg-slate-300"
          onClick={handleSearch}
          disabled={loading}
        >
          Search
        </button>
        <button
          className="wandr-btn bg-slate-900 text-white disabled:bg-slate-300"
          onClick={handleContinue}
          disabled={loading}
        >
          Continue
        </button>
      </div>

      {loading && <LoadingSpinner label="Finding your destination..." />}
      {error && <p className="text-red-600">{error}</p>}

      <div className="wandr-card p-2">
        <MapContainer center={[center.lat, center.lon]} zoom={5} className="h-[60vh] w-full rounded-xl">
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter center={tripInput.center} />
          {tripInput.center && <Marker position={[tripInput.center.lat, tripInput.center.lon]} />}
        </MapContainer>
      </div>
    </div>
  );
}
