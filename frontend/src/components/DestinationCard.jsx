import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function DestinationCard({
  name,
  country,
  days,
  tripsDone,
  image,
  index = 0,
  onExplore,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <div className="group overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
        <div className="relative h-56 overflow-hidden">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute right-3 top-3 flex gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-800 shadow">
              {days} Days Planned
            </span>
            <span className="rounded-full bg-indigo-600/90 px-3 py-1 text-[11px] font-bold text-white shadow">
              {tripsDone} Trips Done
            </span>
          </div>

          <div className="absolute bottom-4 left-4">
            <h3 className="text-xl font-bold text-white">{name}</h3>
            <p className="text-sm text-gray-200">{country}</p>
          </div>
        </div>

        <div className="p-3">
          <button
            onClick={onExplore}
            className="wandr-btn w-full items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-white hover:bg-zinc-600"
          >
            <span className="inline-flex items-center gap-2">
              Explore Now <ArrowRight size={16} />
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
