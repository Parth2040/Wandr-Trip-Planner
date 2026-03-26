import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HeroSection() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // WANDR CHANGE [1] — direct planner access after removing auth flow.
    navigate('/location');
  };

  return (
    <section className="relative mx-0 min-h-screen w-full items-center justify-center overflow-hidden px-0 flex">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80')`,
        }}
      />
      {/* Dark overlay for legibility */}
      <div className="absolute inset-0 bg-black/50" />
      {/* Extra gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy/40 via-transparent to-navy/60" />

      {/* Animated travel elements on top of image */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Dotted flight path */}
          <motion.path
            d="M100,500 Q400,200 700,350 Q1000,500 1350,200"
            stroke="rgba(245,158,11,0.4)"
            strokeWidth="2"
            strokeDasharray="8 8"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          {/* Plane on path */}
          <motion.g
            initial={{ x: 100, y: 500 }}
            animate={{ x: [100, 400, 700, 1050, 1350], y: [500, 280, 350, 430, 200] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <text fontSize="28" fill="white" opacity="0.7">✈️</text>
          </motion.g>

          {/* Location pins */}
          {[
            [220, 420], [550, 300], [880, 380], [1150, 260], [350, 520], [750, 450], [1050, 350]
          ].map(([cx, cy], i) => (
            <motion.g key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.15, 0.45, 0.15], y: [0, -4, 0] }}
              transition={{ duration: 3.5, delay: i * 0.5, repeat: Infinity }}
            >
              <circle cx={cx} cy={cy} r="5" fill="#F59E0B" opacity="0.7" />
              <circle cx={cx} cy={cy} r="12" fill="none" stroke="#F59E0B" strokeWidth="1.5" opacity="0.3" />
            </motion.g>
          ))}
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-5xl drop-shadow-lg">✈️</span>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white font-[var(--font-display)] tracking-tight drop-shadow-2xl">
              W<span className="text-amber">andr</span>
            </h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xl sm:text-2xl text-gray-200 mb-10 font-light leading-relaxed drop-shadow-lg"
          >
            Your world. Your journey.{' '}
            <span className="text-amber font-medium">Planned instantly.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <button
              type="button"
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-300 transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <Sparkles size={18} />
              Get Started
              <ArrowRight size={20} />
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade to white */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
