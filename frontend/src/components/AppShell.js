import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Map, Settings } from 'lucide-react';
import { useTrip } from '../context/TripContext';

export default function AppShell() {
  const navigate = useNavigate();
  const {
    notifications,
    settings,
    setTheme,
    setTravelStyle,
    setTripType,
  } = useTrip();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [activePanel, setActivePanel] = useState(null);

  // WANDR CHANGE [8] — settings options persisted in session storage.
  const travelStyleOptions = ['Solo', 'Couple', 'Family'];
  const tripTypeOptions = ['National', 'International'];

  const togglePanel = (panelName) => {
    setActivePanel((previous) => (previous === panelName ? null : panelName));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="fixed left-0 right-0 top-0 z-[999] border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/location" className="text-2xl font-extrabold tracking-tight text-slate-900">
            Wandr
          </Link>

          {/* WANDR CHANGE [1] — remove Login/Signup and keep direct planner navigation. */}
          <nav className="hidden items-center gap-2 md:flex">
            <Link to="/location" className="wandr-pill inline-flex items-center gap-2">
              <Map size={16} /> Map View
            </Link>
            <Link to="/my-trips" className="wandr-pill inline-flex items-center gap-1">
              📌 My Trips
            </Link>
          </nav>

          <div className="flex items-center gap-2 text-sm">
            <button className="wandr-icon" aria-label="Notifications" onClick={() => togglePanel('notifications')}>
              <Bell size={16} />
            </button>
            <button className="wandr-icon" aria-label="Settings" onClick={() => togglePanel('settings')}>
              <Settings size={16} />
            </button>
            {/* WANDR CHANGE [8] — Exit navigates to landing route via SPA router navigation. */}
            <button className="wandr-btn rounded-full bg-slate-900 text-white hover:bg-slate-700" onClick={() => navigate('/')}>
              Exit
            </button>
          </div>
        </div>

        {activePanel === 'notifications' && (
          <div className="mx-auto mb-3 max-w-6xl px-4">
            <div className="ml-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow">
              <p className="text-sm font-semibold text-slate-800">Notifications</p>
              {/* WANDR CHANGE [8] — show notifications only inside panel, no badges/unread indicators. */}
              {notifications.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No notifications received</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {notifications.map((item) => (
                    <li key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {item.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activePanel === 'settings' && (
          <div className="mx-auto mb-3 max-w-6xl px-4">
            <div className="ml-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow">
              <p className="text-sm font-semibold text-slate-800">Settings</p>

              {/* WANDR CHANGE [8] — theme toggle with session persistence. */}
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Theme</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`wandr-btn text-sm ${settings.theme === 'light' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`wandr-btn text-sm ${settings.theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    Dark
                  </button>
                </div>
              </div>

              {/* WANDR CHANGE [8] — travel preference tags stored for future use only. */}
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Travel Preferences</p>

                <p className="mt-2 text-xs text-slate-500">Travel Style</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {travelStyleOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTravelStyle(option)}
                      className={`wandr-btn text-sm ${settings.travelStyle === option ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <p className="mt-3 text-xs text-slate-500">Trip Type</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {tripTypeOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTripType(option)}
                      className={`wandr-btn text-sm ${settings.tripType === option ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className={`${isHomePage ? 'mx-0 w-full px-0' : 'mx-auto max-w-6xl px-4'} pb-6 pt-24`}>
        <Outlet />
      </main>
    </div>
  );
}
