# Wandr Trip Planner

Wandr is a React-based trip planning app that helps users discover places, pick interests, set trip duration, and generate a day-wise itinerary.

## Features

- Destination search with map recentering (OpenStreetMap/Nominatim)
- Interest-based place discovery
- Day-wise itinerary generation
- Ratings enrichment with optional OpenTripMap API support
- Interactive map views using Leaflet
- Session-based persistence for trip input, results, settings, notifications, and saved trips

## Tech Stack

- React 18
- React Router
- Tailwind CSS
- Leaflet + React Leaflet
- Axios
- Framer Motion

## Project Structure

- `/src/pages` – planner flow screens (location, interests, duration, discover, itinerary, my trips)
- `/src/context` – shared trip/session state management
- `/src/components` – UI components
- `/src/services` – API helpers and place utilities
- `/public` – static assets

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm ci
```

### Run in development

```bash
npm run dev
```

### Create a production build

```bash
npm run build
```

### Run tests

```bash
CI=true npm test -- --watchAll=false --passWithNoTests
```

## Environment Variables

Create a `.env` file in the project root as needed:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_OPENTRIPMAP_API_KEY=your_key_here
```

Notes:
- `REACT_APP_API_URL` defaults to `http://localhost:5000` when not set.
- `REACT_APP_OPENTRIPMAP_API_KEY` is optional; when missing, fallback ratings are used.

## Available Scripts

- `npm run start` – starts the React development server
- `npm run dev` – alias for start
- `npm run build` – production build
- `npm run test` – runs tests with `react-scripts`

## License

This project currently has no license file specified.
