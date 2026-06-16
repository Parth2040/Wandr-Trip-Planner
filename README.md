# Wandr Trip Planner

Wandr is a React-based trip planning app that helps users search destinations, pick interests, discover attractions, and generate day-wise itineraries.

## Features

- Destination search with map recentering
- Interest-based spot discovery
- Multi-day itinerary generation
- "My Trips" session history (stored in browser session storage)
- Ratings-aware place display and map visualization

## Tech Stack

- React 18
- React Router
- Tailwind CSS
- Leaflet / React-Leaflet
- Axios

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- npm

### Installation

```bash
npm ci
```

### Environment Variables

Create a `.env` file in the project root (or copy from `.env.example`):

```bash
REACT_APP_API_URL=http://localhost:5000
```

`REACT_APP_API_URL` is optional for the current frontend flow, but kept for API compatibility.

## Available Scripts

```bash
npm start      # run development server
npm run build  # create production build
npm test       # run tests (no test files are currently included)
```

## Project Structure

```text
src/
  app.js                # application routes
  index.js              # React entry point
  components/           # shared UI components
  context/TripContext.js# app-wide trip/session state
  pages/                # route-level pages
  services/             # API and place helper services
  styles/               # global styles
```

## Build Output

- Production assets are generated in `build/`.

## Notes

- Trip/search/session data is intentionally kept in browser session storage.
- This repository also contains backend-oriented files (`server.js`, `src/controllers`, `src/models`, etc.) for API-related workflows.
