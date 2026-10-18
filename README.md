# StreakPet

A lightweight, offline-first habit tracker with a virtual pet, built as a Progressive Web App (PWA). One codebase runs on phones and laptops.

## Features (MVP target)

- Create, edit, and archive habits with daily or selected-weekday schedules.
- Complete habits once per local calendar day, with undo.
- Current and longest streaks.
- A history view listing completed habits by day, including archived ones.
- A virtual pet that earns XP and evolves from baby to teen to adult as you complete habits.
- Local-only data storage using IndexedDB. No account, backend, or network connection required for core features.

## Tech stack

| Technology       | Purpose                                  |
| ---------------- | ---------------------------------------- |
| Svelte 5         | UI components                            |
| TypeScript       | Type safety and application logic        |
| Vite             | Dev server and production build          |
| IndexedDB        | Local persistence                        |
| vite-plugin-pwa  | PWA manifest and offline caching         |
| CSS / SVG        | Responsive styling and pet graphics      |

## Getting started

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal. Other scripts:

```bash
npm run check    # svelte-check + TypeScript
npm run build    # production build
npm run preview  # preview the production build
```

## Project structure

```text
src/
├── components/   reusable UI components
├── views/        Today, History, and Settings screens
├── domain/       date, schedule, and habit rules
├── data/         IndexedDB setup and repositories
├── stores/       reactive application state
├── styles/       global CSS and design tokens
├── types/        shared TypeScript models
├── App.svelte
└── main.ts
```

## Development roadmap

| Phase | Focus                              |
| ----- | ---------------------------------- |
| 0     | Project foundation                 |
| 1     | UI foundation                      |
| 2     | Habit management                   |
| 3     | IndexedDB persistence              |
| 4     | Completion and undo                |
| 5     | Streak engine                      |
| 6     | Pet and XP progression             |
| 7     | History                            |
| 8     | PWA and offline verification       |
| 9     | Final testing and release          |

## Known limitations (MVP)

- Data lives in a single browser profile. Clearing site data removes it, and nothing is synchronized between devices.
- There is no data export or import yet.
- Streak calculations use each habit's current schedule for past days, so editing a schedule can change historical streaks.
- History shows each habit's latest name and archived status, not the name it had on the completion date.
- Installation and offline loading vary by browser and only work after the app has loaded online at least once.

## Data and privacy

Habits and completion records are stored only in the current browser profile using IndexedDB. Data is not synchronized between devices, and clearing browser site data removes it.
