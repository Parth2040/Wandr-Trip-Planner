import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import { TripProvider } from './context/TripContext';
import Home from './pages/Home';
import LocationSearchPage from './pages/LocationSearchPage';
import InterestsPage from './pages/InterestsPage';
import DurationPage from './pages/DurationPage';
import DiscoverPage from './pages/DiscoverPage';
import ItineraryPage from './pages/ItineraryPage';
import MyTripsPage from './pages/MyTripsPage';

export default function App() {
  return (
    <TripProvider>
      {/* WANDR CHANGE [1] — remove auth routes/guards and keep planner routes directly accessible. */}
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="location" element={<LocationSearchPage />} />
          <Route path="interests" element={<InterestsPage />} />
          <Route path="duration" element={<DurationPage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="itinerary" element={<ItineraryPage />} />
          <Route path="my-trips" element={<MyTripsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </TripProvider>
  );
}
