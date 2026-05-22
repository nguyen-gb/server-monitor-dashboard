# Server Monitor Dashboard

A modern React dashboard for visualizing server health, global server locations, platform distribution, operating systems, architecture breakdowns, timeline trends, and recent infrastructure activity.

## Features

- Server KPI overview: total servers, online servers, offline servers, and newly created servers.
- Interactive server location view with a 2D world map and a 3D globe toggle.
- Local GeoJSON fallback data for the 2D world map when the remote map source is unavailable.
- Charts for operating systems, platforms, CPU architectures, and server creation timeline.
- Time range filtering for recent server growth.
- Activity feed for server lifecycle and status events.
- Light and dark theme support.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- react-globe.gl
- lucide-react

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be served by Vite. Open the local URL printed in the terminal.

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```text
src/
  components/
    Activity/       Recent activity feed
    Globe/          2D map and 3D globe visualizations
    Layout/         Shared layout components
    Stats/          KPI cards and chart components
    TimeFilter/     Timeline filter controls
  context/          Theme context
  data/             Demo server/activity data and local map fallback data
  lib/              Shared helpers
  styles/           Global styles
  types/            Shared TypeScript types
  utils/            Stats, dates, and grouping utilities
```

## Data Notes

The dashboard currently uses generated demo server data from `src/data/servers.ts` and activity data from `src/data/activities.ts`.

The 2D map attempts to load country boundary data from:

```text
https://geojson.xyz/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson
```

If that request fails, it falls back to the local file:

```text
src/data/ne_110m_admin_0_countries.geojson
```

## Available Scripts

- `npm run dev` starts the Vite development server.
- `npm run build` creates a production build.
- `npm run preview` serves the production build locally.

## Customization

- Update demo server generation in `src/data/servers.ts`.
- Update activity events in `src/data/activities.ts`.
- Adjust charts and KPI calculations in `src/utils/statsUtils.ts`.
- Customize global styling in `src/styles/globals.css`.

