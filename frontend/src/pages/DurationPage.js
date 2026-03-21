import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import LoadingSpinner from '../components/LoadingSpinner';

const ITEM_HEIGHT = 56;

export default function DurationPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const pickerRef = useRef(null);
  const navigate = useNavigate();
  const { tripInput, setTripInput } = useTrip();
  const daysRange = useMemo(() => Array.from({ length: 10 }, (_, index) => index + 1), []);

  useEffect(() => {
    setSelectedDay(Math.min(10, Math.max(1, tripInput.days || 1)));
  }, [tripInput.days]);

  useEffect(() => {
    if (!pickerRef.current) {
      return;
    }

    pickerRef.current.scrollTo({
      top: Math.max(0, (selectedDay - 1) * ITEM_HEIGHT),
      behavior: 'smooth',
    });
  }, [selectedDay]);

  const onPickerScroll = () => {
    if (!pickerRef.current) {
      return;
    }

    const snappedIndex = Math.round(pickerRef.current.scrollTop / ITEM_HEIGHT);
    const nextDay = Math.min(10, Math.max(1, snappedIndex + 1));
    setSelectedDay(nextDay);
  };

  const confirmDays = async () => {
    if (!tripInput.locationName || !tripInput.center) {
      setError('Please choose a location first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      setTripInput({
        ...tripInput,
        days: selectedDay,
      });
      navigate('/discover');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to generate plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto wandr-card p-6 space-y-5">
      {/* WANDR CHANGE [3] — copy update for trip duration prompt. */}
      <h1 className="text-3xl font-bold text-center text-slate-900">How many days to explore?</h1>

      <div className="relative mx-auto w-52 overflow-hidden px-2">
        <div
          ref={pickerRef}
          className="wandr-drum h-56 overflow-y-auto py-[84px] text-center"
          onScroll={onPickerScroll}
        >
          {daysRange.map((day) => {
            const distance = Math.abs(day - selectedDay);
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`wandr-drum-item flex h-14 w-full items-center justify-center gap-2 transition-all ${
                  distance === 0
                    ? 'text-4xl font-extrabold text-slate-900'
                    : distance === 1
                      ? 'text-2xl font-semibold text-slate-500'
                      : 'text-xl text-slate-300'
                }`}
              >
                {/* WANDR CHANGE [3] — use left chevron pointer instead of boxed highlight. */}
                <span className={`text-lg ${distance === 0 ? 'opacity-100 text-indigo-600' : 'opacity-0'}`}>▶</span>
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Preparing your Wandr trip setup..." />
      ) : (
        <button className="w-full wandr-btn rounded-full bg-slate-900 text-white" onClick={confirmDays}>
          Confirm
        </button>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
