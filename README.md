# Bantay Bakir Web

A web dashboard for monitoring tagged trees, mapped areas, and ranger activity.

## Project Photo / Screenshot

Add your own photo by replacing the path below:

```md
![Bantay Bakir Dashboard](./public/your-photo.png)
```

Tip: place your image in `public/` so it works automatically in Vite.

## Features

- Interactive map dashboard with KPI cards and detail panels
- Tagged Trees directory with status, DBH, survival, locate, and delete actions
- Tagged Areas directory with progress tracking and boundary stats
- Rangers directory pulled from Firestore `users` collection (excluding admins)
- Search/filter controls in the sidebar
- Theme support (light, dark, system)

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Zustand
- Firebase Firestore
- React Router
- Leaflet / React-Leaflet

## Pages

- `/` Map View (Dashboard)
- `/trees` Tagged Trees
- `/areas` Tagged Areas
- `/rangers` Active Rangers
- `/settings` Settings

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start local development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

4. Preview production build:

```bash
npm run preview
```

## Firebase Setup

This project currently reads Firebase config from:

- `src/lib/firebase.ts`

Firestore collections used by the app:

- `trees`
- `tagAreas`
- `users`

## Notes

- Static assets such as logos or screenshots can be placed in `public/`.
- The sidebar logo currently uses `public/icon.png`.
