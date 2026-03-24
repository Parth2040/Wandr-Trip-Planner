import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="mb-4 inline-flex items-center gap-2">
              <span className="text-2xl">✈️</span>
              <span className="text-2xl font-extrabold text-white font-[var(--font-display)]">
                W<span className="text-amber">andr</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400">Your world. Your journey. Planned instantly.</p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Explore</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/" className="transition-colors hover:text-amber">Home</Link></li>
              <li><Link to="/" className="transition-colors hover:text-amber">Popular Destinations</Link></li>
              <li><Link to="/location" className="transition-colors hover:text-amber">Map View</Link></li>
              <li><Link to="/my-trips" className="transition-colors hover:text-amber">My Trips</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Contact</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="transition-colors hover:text-amber">support@wandr.app</a></li>
              <li><a href="#" className="transition-colors hover:text-amber">Mumbai, India</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Social</h4>
            <div className="flex gap-4 text-xl">
              <a href="#" className="transition-colors hover:text-amber" aria-label="Instagram">📷</a>
              <a href="#" className="transition-colors hover:text-amber" aria-label="X">🐦</a>
              <a href="#" className="transition-colors hover:text-amber" aria-label="Facebook">📘</a>
            </div>
            <a
              href="https://www.linkedin.com/in/path-patel/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm text-slate-300 transition-colors hover:text-amber"
            >
              Linked In : Parth Patel
            </a>
            <p className="mt-3 text-sm text-slate-400">Follow us for travel updates and curated inspiration.</p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-slate-500">
          © {year} Wandr. All rights reserved.
        </div>
        <p className="mt-2 text-center text-sm text-slate-300">Developed by Parth</p>
      </div>
    </footer>
  );
}
