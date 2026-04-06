<img width="1867" height="912" alt="image" src="https://github.com/user-attachments/assets/6593e20b-6507-40fa-845b-d810ca0ddd54" /># Bantay Bakir Web

A web dashboard for monitoring tagged trees, mapped areas, and ranger activity.

## Project Photo / Screenshot
- Splash Screen
<img width="1873" height="909" alt="image" src="https://github.com/user-attachments/assets/62e34b7b-6517-4c84-a3b5-71f4cfeabc24" />

- Map View
<img width="1867" height="912" alt="image" src="https://github.com/user-attachments/assets/8658aa8f-9422-4709-be60-1a84f99ec18b" />

- Tagged Trees
<img width="1873" height="906" alt="image" src="https://github.com/user-attachments/assets/1f06ce9f-5643-49a4-84c7-1bea3345153a" />

- Areas
<img width="1867" height="907" alt="image" src="https://github.com/user-attachments/assets/a7d5e975-2423-4cf4-bbc5-0f1935e5a28b" />

- Active Ranger
<img width="1873" height="911" alt="image" src="https://github.com/user-attachments/assets/d831d450-2ba4-4c8c-9d08-20074f14d645" />


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
