import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-violet-50 text-slate-800">
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-extrabold text-emerald-700">Wandr</h1>
          <nav className="flex items-center gap-2 flex-wrap justify-end">
            {/* WANDR CHANGE [1] — remove Login/Sign Up actions from navbar. */}
            <button className="wandr-icon" aria-label="Settings">
              ⚙️
            </button>
            <button className="wandr-icon" aria-label="Notifications">
              🔔
            </button>
            <button className="wandr-pill" onClick={() => navigate('/location')}>
              MapView
            </button>
            <button className="wandr-pill" onClick={() => navigate('/my-trips')}>
              MyTrips
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <section className="wandr-glass p-8 md:p-12">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-600 font-semibold">Travel Planner</p>
          <h2 className="mt-2 text-5xl md:text-6xl font-black text-slate-900">Wandr</h2>

          <div className="mt-6 flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-200 to-violet-200 grid place-items-center text-3xl">
              🧭
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">Wandr Logo</p>
              <p className="text-slate-500">AI-assisted smart journey builder</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/location')}
            className="mt-8 wandr-btn bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Get Started
          </button>

          <p className="mt-4 text-lg text-slate-600 max-w-2xl">
            Plan multi-day adventures with beautiful route maps, place suggestions, and day-wise itineraries made for your interests.
          </p>
        </section>
      </main>

      <footer className="border-t border-emerald-100 bg-white/80">
        <div className="mx-auto max-w-6xl px-4 py-4 text-sm text-slate-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Wandr</span>
          <span>Plan smarter journeys.</span>
        </div>
      </footer>
    </div>
  );
}
