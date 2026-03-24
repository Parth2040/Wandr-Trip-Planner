import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { openGoogleSearch } from '../utils/openGoogleSearch';

const DAY_COLORS = ['#2563eb', '#eab308', '#16a34a', '#ef4444', '#7c3aed'];

function FitToPlaces({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) {
      return;
    }

    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lon]));
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [map, points]);

  return null;
}

function FocusSelectedPlace({ selectedPlace }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedPlace || typeof selectedPlace.lat !== 'number' || typeof selectedPlace.lon !== 'number') {
      return;
    }

    map.flyTo([selectedPlace.lat, selectedPlace.lon], 13, {
      duration: 0.8,
    });
  }, [map, selectedPlace]);

  return null;
}

export default function MapcartaView({
  itinerary = [],
  center,
  selectedPlace,
  cityName = '',
  activeDay = 1,
  revealedPinCount = 0,
  heightClass = 'h-[60vh]',
}) {
  const groupedByDay = useMemo(
    () =>
      itinerary.map((day, index) => ({
        day: day.day,
        color: DAY_COLORS[index % DAY_COLORS.length],
        places: (day.places || []).filter(
          (place) => typeof place.lat === 'number' && typeof place.lon === 'number'
        ),
      })),
    [itinerary]
  );

  const activeDayData = useMemo(
    () => groupedByDay.find((day) => day.day === activeDay) || groupedByDay[0] || { day: 1, color: DAY_COLORS[0], places: [] },
    [activeDay, groupedByDay]
  );

  const allPoints = useMemo(
    () => activeDayData.places.map((place) => ({ lat: place.lat, lon: place.lon })),
    [activeDayData.places]
  );

  const visiblePlaces = useMemo(
    () => activeDayData.places.slice(0, Math.max(0, revealedPinCount)),
    [activeDayData.places, revealedPinCount]
  );

  if (!allPoints.length) {
    return (
      <div className={`w-full rounded-xl border border-slate-200 bg-slate-50 ${heightClass} p-4 text-sm text-slate-600`}>
        No map coordinates are available for this itinerary.
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 ${heightClass}`}>
      <MapContainer
        center={[center?.lat || allPoints[0].lat, center?.lon || allPoints[0].lon]}
        zoom={12}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitToPlaces points={allPoints} />
        <FocusSelectedPlace selectedPlace={selectedPlace} />

        {visiblePlaces.map((place, index) => {
          const isSelected = selectedPlace?.id === place.id;
          const markerIcon = L.divIcon({
            className: 'wandr-marker-pop',
            html: `<div style="
              width: 30px;
              height: 30px;
              border-radius: 9999px;
              border: 2px solid #fff;
              background: ${activeDayData.color};
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 13px;
              transform: ${isSelected ? 'scale(1.08)' : 'scale(1)'};
            ">${index + 1}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          });

          return (
            <Marker
              key={`${activeDayData.day}-${place.id}`}
              position={[place.lat, place.lon]}
              icon={markerIcon}
            >
              <Popup>
                <button
                  type="button"
                  onClick={() => openGoogleSearch(place.name, cityName)}
                  className="cursor-pointer text-left"
                >
                  <p className="font-medium text-slate-900">{place.name}</p>
                  <p className="text-xs text-slate-500">Day {activeDayData.day} • Stop {index + 1}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600">🔍 View on Google Maps</p>
                </button>
              </Popup>
            </Marker>
          );
        })}

        {visiblePlaces.length > 1 && (
          <Polyline
            key={`active-day-${activeDayData.day}-visible-${visiblePlaces.length}`}
            positions={visiblePlaces.map((place) => [place.lat, place.lon])}
            pathOptions={{
              color: activeDayData.color,
              weight: 4,
              className: 'wandr-route-segment',
            }}
          />
        )}
      </MapContainer>

      <div className="absolute left-3 top-3 rounded-lg border border-slate-200 bg-white/90 p-2 text-xs shadow">
        <p className="font-semibold text-slate-700">Day {activeDayData.day} Route</p>
        <p className="mt-1 text-slate-600">{visiblePlaces.length} / {activeDayData.places.length} stops revealed</p>
      </div>
    </div>
  );
}