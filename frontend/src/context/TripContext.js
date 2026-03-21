import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const TripContext = createContext(null);

// WANDR CHANGE [1] — keep all trip/session data in sessionStorage only.
const SESSION_KEYS = {
  INPUT: 'wandr_trip_input',
  RESULT: 'wandr_trip_result',
  TRIPS: 'wandr_session_trips',
  SETTINGS: 'wandr_settings',
  NOTIFICATIONS: 'wandr_notifications',
};

const readSessionValue = (key, fallbackValue) => {
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

const writeSessionValue = (key, value) => {
  sessionStorage.setItem(key, JSON.stringify(value));
};

const createSessionId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export function TripProvider({ children }) {
  // WANDR CHANGE [1] — restore planner/session state from sessionStorage on app load.
  const [tripInput, setTripInput] = useState(() =>
    readSessionValue(SESSION_KEYS.INPUT, {
      locationName: '',
      center: null,
      interests: [],
      days: 1,
    })
  );

  const [tripResult, setTripResult] = useState(() => readSessionValue(SESSION_KEYS.RESULT, null));
  const [sessionTrips, setSessionTrips] = useState(() => readSessionValue(SESSION_KEYS.TRIPS, []));
  const [notifications, setNotifications] = useState(() => readSessionValue(SESSION_KEYS.NOTIFICATIONS, []));
  const [settings, setSettings] = useState(() =>
    readSessionValue(SESSION_KEYS.SETTINGS, {
      theme: 'light',
      travelStyle: 'Solo',
      tripType: 'National',
    })
  );

  // WANDR CHANGE [7] — persist planned/searched trips in session storage only.
  useEffect(() => {
    writeSessionValue(SESSION_KEYS.TRIPS, sessionTrips);
  }, [sessionTrips]);

  // WANDR CHANGE [1] — persist current planner input and latest result in session storage.
  useEffect(() => {
    writeSessionValue(SESSION_KEYS.INPUT, tripInput);
  }, [tripInput]);

  useEffect(() => {
    writeSessionValue(SESSION_KEYS.RESULT, tripResult);
  }, [tripResult]);

  // WANDR CHANGE [8] — store settings + notifications in session storage.
  useEffect(() => {
    writeSessionValue(SESSION_KEYS.SETTINGS, settings);
  }, [settings]);

  useEffect(() => {
    writeSessionValue(SESSION_KEYS.NOTIFICATIONS, notifications);
  }, [notifications]);

  // WANDR CHANGE [8] — apply theme immediately across the app.
  useEffect(() => {
    document.body.setAttribute('data-theme', settings.theme || 'light');
  }, [settings.theme]);

  // WANDR CHANGE [1] — save each searched destination into session trip history.
  const recordSearch = ({ locationName, center }) => {
    const normalizedName = (locationName || '').trim();
    if (!normalizedName) {
      return;
    }

    const searchEntry = {
      sessionId: createSessionId('search'),
      type: 'search',
      locationName: normalizedName,
      center: center || null,
      createdAt: new Date().toISOString(),
    };

    setSessionTrips((previous) => [searchEntry, ...previous]);
  };

  // WANDR CHANGE [8] — keep planned-trip notifications in a panel-only list.
  const addTripNotification = (locationName) => {
    if (!locationName) {
      return;
    }

    const notification = {
      id: createSessionId('note'),
      message: `Trip planned for ${locationName} ✦`,
      createdAt: new Date().toISOString(),
    };

    setNotifications((previous) => [notification, ...previous]);
  };

  // WANDR CHANGE [6] — centralize successful trip planning flow.
  const planTrip = (plannedTrip) => {
    if (!plannedTrip) {
      return;
    }

    const sessionTrip = {
      ...plannedTrip,
      sessionId: createSessionId('trip'),
      type: 'planned',
      createdAt: new Date().toISOString(),
    };

    setTripResult(plannedTrip);
    setSessionTrips((previous) => [sessionTrip, ...previous]);
    addTripNotification(plannedTrip.locationName);
  };

  // WANDR CHANGE [7] — allow manual save to My Trips in session-only storage.
  const saveTripToSession = (plannedTrip) => {
    if (!plannedTrip) {
      return;
    }

    const sessionTrip = {
      ...plannedTrip,
      sessionId: createSessionId('trip-save'),
      type: 'planned',
      createdAt: new Date().toISOString(),
    };

    setSessionTrips((previous) => [sessionTrip, ...previous]);
  };

  // WANDR CHANGE [8] — settings panel state handlers.
  const setTheme = (theme) => {
    setSettings((previous) => ({ ...previous, theme }));
  };

  const setTravelStyle = (travelStyle) => {
    setSettings((previous) => ({ ...previous, travelStyle }));
  };

  const setTripType = (tripType) => {
    setSettings((previous) => ({ ...previous, tripType }));
  };

  const resetTrip = () => {
    setTripInput({ locationName: '', center: null, interests: [], days: 1 });
    setTripResult(null);
  };

  const value = useMemo(
    () => ({
      tripInput,
      setTripInput,
      tripResult,
      setTripResult,
      planTrip,
      saveTripToSession,
      resetTrip,
      sessionTrips,
      recordSearch,
      notifications,
      settings,
      setTheme,
      setTravelStyle,
      setTripType,
    }),
    [
      tripInput,
      tripResult,
      sessionTrips,
      notifications,
      settings,
    ]
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  return useContext(TripContext);
}
