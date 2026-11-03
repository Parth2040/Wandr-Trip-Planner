

# ✈️ Wandr — Trip Planner

**Your world. Your journey. Planned instantly.**

Wandr is a React-based trip planning app that helps users search destinations, pick interests, discover attractions, and generate day-wise itineraries.

Wandr Demo Video


[**🌐 Live Demo**](https://wandr-trip-planner.vercel.app/) · 

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)
![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-Nominatim-7EBC6F?logo=openstreetmap&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)

</div>



## 📖 About

Planning a trip usually means juggling maps, review sites, blogs and notes. Wandr puts that in one guided flow:

1. **Search** any city. The map flies to it.
2. **Choose** your interests (history, food, hidden gems, beaches and more).
3. **Pick** how many days you have (1–10).
4. **Discover** real places near you, pulled from OpenStreetMap and sorted by rating.
5. **Get** an itinerary split into days. Stops are ordered by distance and connected on the map.
6. **Save** the trip to *My Trips*.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Destination search** | Search any city or place worldwide, and the Leaflet map recenters with a marker. |
| 🎯 **12 interest categories** | Historical Places, Nature, Religious Places, Food Spots, Popular Spots, Top Rated, Hidden Gems, Adventure Sports, Parks, Beaches, Bars and Casinos. |
| 📅 **Trip duration picker** | Scroll-wheel style selector for 1–10 days. |
| 🧭 **Discover spots** | Category filter tabs, rating badges, and multi-select cards to hand-pick places. |
| ✦ **Plan for Me** | Builds the itinerary automatically from the best-rated spots. |
| 🗺️ **Route map** | Each day's stops are numbered and drawn as a route on the map, revealed stop by stop. |
| 📍 **Nearest-neighbour routing** | Stops in a day are ordered by straight-line (Haversine) distance to cut back-and-forth travel. |
| 🔗 **Google Maps links** | Open any stop in Google Maps with one click. |
| 🌆 **Popular destinations** | Curated cards (New York, Tokyo, Paris, Dubai, Mumbai and more) that start planning in one click. |
| 📌 **My Trips** | Planned and saved trips for the current session. |
| 🔔 **Notifications & ⚙️ Settings** | A trip-planned notification panel, plus travel style (Solo / Couple / Family) and trip type (National / International). |
| 📱 **Responsive UI** | Tailwind CSS layout with Framer Motion animations. |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** (Create React App) | UI library |
| **React Router v6** | Client-side routing |
| **Tailwind CSS 3** + PostCSS + Autoprefixer | Styling |
| **Framer Motion** | Page and card animations |
| **Leaflet** + **React-Leaflet** | Interactive maps and route lines |
| **Lucide React** | Icons |
| **Axios** | HTTP requests |
| **React Context API** + `sessionStorage` | App-wide trip state that persists across pages |

### Backend (API layer — in progress)
| Technology | Purpose |
|---|---|
| **Node.js** + **Express** | REST API |
| **MongoDB** + **Mongoose** | `User` and `Trip` data models |
| **JWT** (`jsonwebtoken`) | Authentication tokens (7-day expiry) |
| **bcryptjs** | Password hashing |

### External APIs & Services
| Service | Purpose |
|---|---|
| **OpenStreetMap Nominatim** | Geocoding and place search |
| **OpenStreetMap tiles** | Map tiles |
| **OpenTripMap** *(optional)* | Place popularity data for ratings |
| **Unsplash** | Hero and destination images |
| **Vercel** | Hosting and deployment |

---

## 🏗️ Architecture

```text
┌──────────────────────────── Browser (React SPA) ────────────────────────────┐
│                                                                             │
│  Home ─► Location Search ─► Interests ─► Duration ─► Discover ─► Itinerary  │
│                                                         │             │      │
│                                     TripContext (React Context + sessionStorage)
│                                                         │             │      │
└─────────────────────────────────────────────────────────┼─────────────┼──────┘
                                                          ▼             ▼
                                         OpenStreetMap Nominatim   Leaflet + OSM tiles
                                         OpenTripMap (optional)    Google Maps links

             ┌──────────── Backend API (Express + MongoDB, in progress) ───────────┐
             │  /api/auth/register  /api/auth/login                                │
             │  /api/trips/generate /api/trips/discover                            │
             │  /api/trips/save     /api/trips/saved   (JWT-protected)             │
             └─────────────────────────────────────────────────────────────────────┘
```

**How an itinerary is built**

1. The city is geocoded with Nominatim to get its centre coordinates.
2. For each selected interest, Wandr runs keyword searches such as `museum in Rome` or `restaurant in Rome`.
3. Results are de-duplicated, given a rating (OpenTripMap popularity when an API key is set, otherwise a stable score derived from the place name), and filtered by minimum rating.
4. Spots are split across the chosen number of days. Within each day, a **nearest-neighbour** algorithm orders the stops by Haversine distance.
5. The itinerary is stored in `sessionStorage` and drawn as a numbered route on the map.

---

## 📂 Project Structure

```text
Wandr-Trip-Planner/
├── public/
│   └── index.html
├── src/
│   ├── index.js                  # React entry point
│   ├── app.js                    # Route definitions
│   ├── components/
│   │   ├── AppShell.js           # Navbar, notifications, settings, layout
│   │   ├── HeroSection.jsx       # Landing hero
│   │   ├── DestinationCard.jsx   # Popular destination cards
│   │   ├── MapcartaView.jsx      # Itinerary map with route reveal
│   │   ├── Footer.jsx
│   │   └── LoadingSpinner.js
│   ├── pages/
│   │   ├── Home.jsx              # Landing page + popular destinations
│   │   ├── LocationSearchPage.js # City search + map
│   │   ├── InterestsPage.js      # Interest selection
│   │   ├── DurationPage.js       # Day picker
│   │   ├── DiscoverPage.js       # Spot discovery, filters, Plan for Me
│   │   ├── ItineraryPage.js      # Day-by-day itinerary + map
│   │   └── MyTripsPage.js        # Saved trips
│   ├── context/
│   │   └── TripContext.js        # Global trip state (sessionStorage)
│   ├── services/
│   │   ├── api.js                # Axios client
│   │   ├── placeUtils.js         # Ratings, de-duplication, enrichment
│   │   ├── mapService.js         # (backend) geocoding, place search, itinerary
│   │   └── routes/               # (backend) auth + trip routes
│   ├── controllers/              # (backend) auth + trip controllers
│   ├── models/                   # (backend) User, Trip Mongoose models
│   ├── middleware/               # (backend) JWT auth middleware
│   ├── config/db.js              # (backend) MongoDB connection
│   ├── utils/openGoogleSearch.js
│   └── styles/index.css
├── server.js                     # (backend) server entry
├── tailwind.config.js
├── postcss.config.js
├── vercel.json                   # SPA rewrites for Vercel
├── .env.example
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) **18+**
- npm (bundled with Node.js)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/Parth2040/Wandr-Trip-Planner.git
cd Wandr-Trip-Planner
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `REACT_APP_API_URL` | No | Backend base URL (default `http://localhost:5000`) |
| `REACT_APP_OPENTRIPMAP_API_KEY` | No | [OpenTripMap](https://opentripmap.io/product) key for popularity-based ratings |

> The app works without any keys. Place search uses the free OpenStreetMap Nominatim API.

### 4. Run the development server
```bash
npm start
```
Open **http://localhost:3000** in your browser.

### 5. Build for production
```bash
npm run build
```
The optimised build is written to `build/`.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start the dev server at `localhost:3000` |
| `npm run build` | Create a production build in `build/` |
| `npm test` | Run tests with Jest (no tests yet) |

---

## 🔌 API Reference (backend)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Register with `name`, `email`, `password` |
| `POST` | `/api/auth/login` | — | Log in and receive a JWT |
| `POST` | `/api/trips/discover` | — | Discover spots for `locationName` + `interests` (10-minute cache) |
| `POST` | `/api/trips/generate` | — | Generate an itinerary for `locationName`, `interests`, `days` (1–10) |
| `POST` | `/api/trips/save` | 🔒 JWT | Save a trip to MongoDB |
| `GET` | `/api/trips/saved` | 🔒 JWT | List the logged-in user's saved trips |

Backend environment variables: `PORT` (default `5000`), `MONGO_URI`, `JWT_SECRET`.

> **Status:** the backend controllers, models and routes are written, but the live site runs fully in the browser and does not call the API yet. Wiring them together (an Express app entry and the server dependencies) is on the roadmap.

---

## ☁️ Deployment

The frontend is deployed on **Vercel**. `vercel.json` rewrites every route to `index.html` so React Router deep links work.

1. Push the repo to GitHub.
2. Import the project on [vercel.com](https://vercel.com/).
3. Framework preset: **Create React App**. Build command: `npm run build`. Output directory: `build`.
4. Add any environment variables, then deploy.

---

## 🗺️ Roadmap

- [ ] Connect the Express + MongoDB backend (accounts and cloud-saved trips)
- [ ] Show the distance between consecutive stops
- [ ] Keep search results inside the selected city's area
- [ ] Budget estimates for hotels, food and transport
- [ ] Drag-and-drop reordering of stops
- [ ] Export or share an itinerary (PDF / link)
- [ ] Dark mode

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 🙏 Acknowledgements

- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- [Leaflet](https://leafletjs.com/) for maps
- [Unsplash](https://unsplash.com/) for photography
- [OpenTripMap](https://opentripmap.io/) for place data

---

## 👤 Author

**Parth Patel**

- GitHub: [@Parth2040](https://github.com/Parth2040)
- LinkedIn: [Parth Patel](https://www.linkedin.com/in/path-patel/)

<div align="center">

⭐ If you like this project, give it a star on GitHub.

</div>
