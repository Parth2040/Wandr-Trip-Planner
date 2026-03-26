import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Beef,
  Compass,
  Gem,
  Landmark,
  Leaf,
  Mountain,
  Palmtree,
  ShieldCheck,
  Trees,
  Waves,
} from 'lucide-react';
import { useTrip } from '../context/TripContext';

const options = [
  { label: 'Historical Places', icon: Landmark },
  { label: 'Nature', icon: Leaf },
  { label: 'Religious Places', icon: ShieldCheck },
  { label: 'Food Spots', icon: Beef },
  { label: 'Popular Spots', icon: Compass },
  { label: 'Top Rated', icon: Gem },
  { label: 'Hidden Gems', icon: Gem },
  { label: 'Adventure Sports', icon: Mountain },
  { label: 'Parks', icon: Trees },
  { label: 'Beaches', icon: Waves },
  { label: 'Bars', icon: Palmtree },
  { label: 'Casinos', icon: Gem },
];

// WANDR CHANGE [4] — default pre-selected preferences.
const DEFAULT_PREFERENCES = ['Popular Spots', 'Nature'];

export default function InterestsPage() {
  const navigate = useNavigate();
  const { tripInput, setTripInput } = useTrip();
  const hasAppliedDefaultsRef = useRef(false);

  useEffect(() => {
    if (hasAppliedDefaultsRef.current) {
      return;
    }

    hasAppliedDefaultsRef.current = true;

    if ((tripInput.interests || []).length > 0) {
      return;
    }

    setTripInput((previous) => ({
      ...previous,
      interests: DEFAULT_PREFERENCES,
    }));
  }, [setTripInput, tripInput.interests]);

  const toggleInterest = (value) => {
    const exists = tripInput.interests.includes(value);
    const next = exists
      ? tripInput.interests.filter((item) => item !== value)
      : [...tripInput.interests, value];

    // WANDR CHANGE [2] — allow free preference selection with no blocking/limits.
    setTripInput({ ...tripInput, interests: next });
  };

  const selectedCount = tripInput.interests.length;
  const remaining = Math.max(0, 4 - selectedCount);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold text-wandr-700 text-center">Trip Preferences</h1>
      <p className="text-slate-500 text-center">Tell us what excites you - we'll craft your journey</p>

      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 lg:grid-cols-3">
        {options.map(({ label, icon: Icon }) => {
          const selected = tripInput.interests.includes(label);
          return (
            <button
              key={label}
              onClick={() => toggleInterest(label)}
              className={`wandr-card flex items-center gap-2 rounded-full px-4 py-3 text-left transition ${
                selected ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'
              }`}
            >
              <Icon size={18} />
              <span className="font-medium text-sm sm:text-base">{label}</span>
            </button>
          );
        })}
      </div>

      {/* WANDR CHANGE [2][4] — dynamic soft hint toward minimum of four preferences. */}
      {selectedCount < 4 && (
        <p className="text-center text-sm italic text-slate-400">
          Select at least {remaining} more preference{remaining === 1 ? '' : 's'} for a focused trip ✦
        </p>
      )}

      <div className="flex justify-center">
        <button
          className="wandr-btn rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white"
          onClick={() => navigate('/duration')}
        >
          Continue Planning
        </button>
      </div>
    </div>
  );
}
