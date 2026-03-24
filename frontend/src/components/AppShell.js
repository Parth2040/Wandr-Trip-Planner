import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Map, Settings } from 'lucide-react';
import { useTrip } from '../context/TripContext';

export default function AppShell() {
  const navigate = useNavigate();
  const {
    notifications,
    settings,
    setTravelStyle,
    setTripType,
  } = useTrip();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [activePanel, setActivePanel] = useState(null);
  const notificationsAnchorRef = useRef(null);
  const settingsAnchorRef = useRef(null);

  // WANDR FIX [1] — compact floating dropdown panel dimensions and elevation.
  const floatingPanelStyles = {
    maxWidth: '280px',
    maxHeight: '320px',
    overflowY: 'auto',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    borderRadius: '12px',
    zIndex: 1000,
  };

  // WANDR FIX [1] — settings options persisted in session storage.
  const travelStyleOptions = ['Solo', 'Couple', 'Family'];
  const tripTypeOptions = ['National', 'International'];

  const togglePanel = (panelName) => {
    setActivePanel((previous) => (previous === panelName ? null : panelName));
  };

  const applySettingAndClose = (applySetting) => {
    applySetting();
    setActivePanel((previous) => (previous === 'settings' ? null : previous));
  };

  // WANDR FIX [1] — close settings/notification panels on outside click.
  useEffect(() => {
    const handleOutsideClick = (event) => {
      const target = event.target;
      const clickedNotifications = notificationsAnchorRef.current?.contains(target);
      const clickedSettings = settingsAnchorRef.current?.contains(target);

      if (!clickedNotifications && !clickedSettings) {
        setActivePanel(null);
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="fixed left-0 right-0 top-0 z-[999] h-16 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
          <Link to="/location" className="text-2xl font-extrabold tracking-tight text-slate-900">
            Wandr
          </Link>

          {/* WANDR FIX [4] — keep hero flush under fixed header by standardizing header height to 64px. */}
          <nav className="hidden items-center gap-2 md:flex">
            <Link to="/location" className="wandr-pill inline-flex items-center gap-2">
              <Map size={16} /> Map View
            </Link>
            <Link to="/my-trips" className="wandr-pill inline-flex items-center gap-1">
              📌 My Trips
            </Link>
          </nav>

          <div className="flex items-center gap-2 text-sm">
            {/* WANDR FIX [1] — anchor compact notifications panel below icon without shifting layout. */}
            <div ref={notificationsAnchorRef} className="relative">
              <button type="button" className="wandr-icon" aria-label="Notifications" onClick={() => togglePanel('notifications')}>
                <Bell size={16} />
              </button>

              {activePanel === 'notifications' && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] w-[280px] border border-slate-200 bg-white p-4"
                  style={floatingPanelStyles}
                >
                  <p className="text-sm font-semibold text-slate-800">Notifications</p>
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
              )}
            </div>

            {/* WANDR FIX [1] — anchor compact settings panel below icon and remove Theme controls. */}
            <div ref={settingsAnchorRef} className="relative">
              <button type="button" className="wandr-icon" aria-label="Settings" onClick={() => togglePanel('settings')}>
                <Settings size={16} />
              </button>

              {activePanel === 'settings' && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] w-[280px] border border-slate-200 bg-white p-4"
                  style={floatingPanelStyles}
                >
                  <p className="text-sm font-semibold text-slate-800">Settings</p>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Travel Preferences</p>

                    <p className="mt-2 text-xs text-slate-500">Travel Style</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {travelStyleOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => applySettingAndClose(() => setTravelStyle(option))}
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
                          onClick={() => applySettingAndClose(() => setTripType(option))}
                          className={`wandr-btn text-sm ${settings.tripType === option ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* WANDR FIX [1] — keep exit behavior unchanged while dropdowns become floating panels. */}
            <button type="button" className="wandr-btn rounded-full bg-slate-900 text-white hover:bg-slate-700" onClick={() => navigate('/')}>
              Exit
            </button>
          </div>
        </div>
      </header>

      {/* WANDR FIX [4] — remove homepage header-to-hero gap while keeping planner pages offset below fixed header. */}
      <main className={`${isHomePage ? 'mx-0 w-full px-0 pt-0' : 'mx-auto max-w-6xl px-4 pt-24'} pb-6`}>
        <Outlet />
      </main>
    </div>
  );
}
