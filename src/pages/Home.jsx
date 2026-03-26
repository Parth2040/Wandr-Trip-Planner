import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import DestinationCard from '../components/DestinationCard';
import Footer from '../components/Footer';
import { useTrip } from '../context/TripContext';

const features = [
  { icon: '🗺️', title: 'AI-Powered Itineraries', desc: 'Tell us your preferences and get a complete day-by-day trip plan in seconds.' },
  { icon: '💰', title: 'Smart Budget Planning', desc: 'Stay on budget with real-time cost estimates for hotels, food, and transport.' },
  { icon: '📍', title: 'Discover Hidden Gems', desc: 'Go beyond tourist spots with curated local experiences unique to every destination.' },
];

const popularDestinations = [
  {
    name: 'New York',
    country: 'United States',
    days: 7,
    tripsDone: 1840,
    center: { lat: 40.7128, lon: -74.006 },
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=900&q=80',
    spots: [
      { id: 'ny1', name: 'Times Square', category: 'Popular Spots', lat: 40.758, lon: -73.9855, rating: 4.6 },
      { id: 'ny2', name: 'Central Park', category: 'Parks', lat: 40.7829, lon: -73.9654, rating: 4.8 },
      { id: 'ny3', name: 'Brooklyn Bridge', category: 'Historical Places', lat: 40.7061, lon: -73.9969, rating: 4.7 },
      { id: 'ny4', name: 'Statue of Liberty', category: 'Historical Places', lat: 40.6892, lon: -74.0445, rating: 4.7 },
      { id: 'ny5', name: 'High Line', category: 'Nature', lat: 40.748, lon: -74.0048, rating: 4.7 },
      { id: 'ny6', name: 'Bryant Park', category: 'Parks', lat: 40.7536, lon: -73.9832, rating: 4.7 },
    ],
  },
  {
    name: 'Tokyo',
    country: 'Japan',
    days: 10,
    tripsDone: 2094,
    center: { lat: 35.6762, lon: 139.6503 },
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=900&q=80',
    spots: [
      { id: 'tok1', name: 'Senso-ji Temple', category: 'Religious Places', lat: 35.7148, lon: 139.7967, rating: 4.7 },
      { id: 'tok2', name: 'Tokyo Tower', category: 'Popular Spots', lat: 35.6586, lon: 139.7454, rating: 4.6 },
      { id: 'tok3', name: 'Meiji Shrine', category: 'Religious Places', lat: 35.6764, lon: 139.6993, rating: 4.7 },
      { id: 'tok4', name: 'Shibuya Sky', category: 'Top Rated', lat: 35.6595, lon: 139.7005, rating: 4.8 },
      { id: 'tok5', name: 'Ueno Park', category: 'Parks', lat: 35.7156, lon: 139.773, rating: 4.6 },
      { id: 'tok6', name: 'Akihabara', category: 'Popular Spots', lat: 35.6984, lon: 139.773, rating: 4.5 },
    ],
  },
  {
    name: 'Hong Kong',
    country: 'China',
    days: 5,
    tripsDone: 1120,
    center: { lat: 22.3193, lon: 114.1694 },
    image: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=900&q=80',
    spots: [
      { id: 'hk1', name: 'Victoria Peak', category: 'Top Rated', lat: 22.2759, lon: 114.145, rating: 4.7 },
      { id: 'hk2', name: 'Tsim Sha Tsui Promenade', category: 'Popular Spots', lat: 22.2933, lon: 114.1738, rating: 4.6 },
      { id: 'hk3', name: 'Tian Tan Buddha', category: 'Religious Places', lat: 22.2539, lon: 113.9047, rating: 4.7 },
      { id: 'hk4', name: 'Nan Lian Garden', category: 'Nature', lat: 22.3398, lon: 114.2047, rating: 4.6 },
      { id: 'hk5', name: 'Temple Street', category: 'Food Spots', lat: 22.3067, lon: 114.1715, rating: 4.5 },
    ],
  },
  {
    name: 'Mumbai',
    country: 'India',
    days: 5,
    tripsDone: 1755,
    center: { lat: 19.076, lon: 72.8777 },
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=900&q=80',
    spots: [
      { id: 'mum1', name: 'Gateway of India', category: 'Historical Places', lat: 18.922, lon: 72.8347, rating: 4.6 },
      { id: 'mum2', name: 'Marine Drive', category: 'Popular Spots', lat: 18.943, lon: 72.8238, rating: 4.7 },
      { id: 'mum3', name: 'Siddhivinayak Temple', category: 'Religious Places', lat: 19.0176, lon: 72.8302, rating: 4.8 },
      { id: 'mum4', name: 'Juhu Beach', category: 'Beaches', lat: 19.099, lon: 72.8265, rating: 4.4 },
      { id: 'mum5', name: 'Sanjay Gandhi National Park', category: 'Parks', lat: 19.2132, lon: 72.9106, rating: 4.5 },
    ],
  },
  {
    name: 'Delhi',
    country: 'India',
    days: 7,
    tripsDone: 1680,
    center: { lat: 28.6139, lon: 77.209 },
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=900&q=80',
    spots: [
      { id: 'del1', name: 'Red Fort', category: 'Historical Places', lat: 28.6562, lon: 77.241, rating: 4.5 },
      { id: 'del2', name: 'India Gate', category: 'Historical Places', lat: 28.6129, lon: 77.2295, rating: 4.6 },
      { id: 'del3', name: 'Qutub Minar', category: 'Historical Places', lat: 28.5244, lon: 77.1855, rating: 4.6 },
      { id: 'del4', name: 'Lodhi Garden', category: 'Parks', lat: 28.5933, lon: 77.2197, rating: 4.6 },
      { id: 'del5', name: 'Akshardham', category: 'Religious Places', lat: 28.6127, lon: 77.2773, rating: 4.7 },
      { id: 'del6', name: 'Connaught Place', category: 'Food Spots', lat: 28.6315, lon: 77.2167, rating: 4.5 },
    ],
  },
  {
    name: 'Melbourne',
    country: 'Australia',
    days: 7,
    tripsDone: 1390,
    center: { lat: -37.8136, lon: 144.9631 },
    image: 'https://images.unsplash.com/photo-1514395462725-fb4566210144?w=900&q=80',
    spots: [
      { id: 'mel1', name: 'Federation Square', category: 'Popular Spots', lat: -37.8179, lon: 144.969, rating: 4.5 },
      { id: 'mel2', name: 'Royal Botanic Gardens', category: 'Nature', lat: -37.831, lon: 144.9796, rating: 4.8 },
      { id: 'mel3', name: 'St Kilda Beach', category: 'Beaches', lat: -37.8676, lon: 144.974, rating: 4.5 },
      { id: 'mel4', name: 'Queen Victoria Market', category: 'Food Spots', lat: -37.8076, lon: 144.9568, rating: 4.6 },
      { id: 'mel5', name: 'Hosier Lane', category: 'Hidden Gems', lat: -37.8169, lon: 144.9693, rating: 4.4 },
    ],
  },
  {
    name: 'Paris',
    country: 'France',
    days: 7,
    tripsDone: 2215,
    center: { lat: 48.8566, lon: 2.3522 },
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=900&q=80',
    spots: [
      { id: 'par1', name: 'Eiffel Tower', category: 'Historical Places', lat: 48.8584, lon: 2.2945, rating: 4.7 },
      { id: 'par2', name: 'Louvre Museum', category: 'Historical Places', lat: 48.8606, lon: 2.3376, rating: 4.8 },
      { id: 'par3', name: 'Notre-Dame', category: 'Religious Places', lat: 48.8529, lon: 2.35, rating: 4.7 },
      { id: 'par4', name: 'Montmartre', category: 'Hidden Gems', lat: 48.8867, lon: 2.3431, rating: 4.6 },
      { id: 'par5', name: 'Luxembourg Gardens', category: 'Parks', lat: 48.8462, lon: 2.3372, rating: 4.7 },
    ],
  },
  {
    name: 'Dubai',
    country: 'UAE',
    days: 5,
    tripsDone: 1590,
    center: { lat: 25.2048, lon: 55.2708 },
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=900&q=80',
    spots: [
      { id: 'dub1', name: 'Burj Khalifa', category: 'Top Rated', lat: 25.1972, lon: 55.2744, rating: 4.8 },
      { id: 'dub2', name: 'Dubai Marina', category: 'Popular Spots', lat: 25.0806, lon: 55.1404, rating: 4.7 },
      { id: 'dub3', name: 'Jumeirah Beach', category: 'Beaches', lat: 25.2106, lon: 55.2448, rating: 4.5 },
      { id: 'dub4', name: 'Al Fahidi Historical District', category: 'Historical Places', lat: 25.2637, lon: 55.2982, rating: 4.5 },
      { id: 'dub5', name: 'Dubai Miracle Garden', category: 'Nature', lat: 25.0596, lon: 55.2447, rating: 4.6 },
    ],
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { setTripInput, recordSearch } = useTrip();

  const destinations = useMemo(() => popularDestinations, []);

  const handleExploreDestination = (destination) => {
    // WANDR CHANGE [1] — keep search history in sessionStorage via trip context.
    setTripInput((previous) => ({
      ...previous,
      locationName: destination.name,
      center: destination.center,
      interests: [],
      days: destination.days,
    }));
    recordSearch({
      locationName: destination.name,
      center: destination.center,
    });

    navigate('/interests');
  };

  return (
    <div>
      <HeroSection />

      {/* Features Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center mb-16 text-navy"
          >
            Why choose <span className="text-amber">Wandr</span>?
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="rounded-2xl bg-gray-50 p-8 text-center transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="text-5xl mb-5">{f.icon}</div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">{f.title}</h3>
                <p className="leading-relaxed text-gray-500">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-4 text-slate-800"
          >
            Popular Destinations
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-gray-500 text-center mb-10 text-lg"
          >
            Explore our curated collection of the world's most exciting cities
          </motion.p>

          <div className="flex gap-5 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
            {destinations.map((d, i) => (
              <div key={d.name} className="min-w-[320px] md:min-w-0">
                <DestinationCard
                  {...d}
                  index={i}
                  onExplore={() => handleExploreDestination(d)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
