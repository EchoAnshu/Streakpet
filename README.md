# StreakPet

A lightweight, offline-first habit tracker with a virtual pet, built as a Progressive Web App (PWA). One codebase runs on phones and laptops.

## Features (MVP target)

- Create, edit, and archive habits with icons, colors, notes, daily or selected-weekday schedules, and optional reminders.
- Complete habits once per local calendar day, with undo, confetti, and gentle sound effects (mutable in Settings).
- A week pulse strip and colorful habit cards with current-streak context ("ends today!").
- A habit detail screen with current and best streaks, a tappable month calendar, and a year activity heatmap.
- A pixel-art pet you adopt and name, shown on the home screen with its age and mood and a quick-feed button. Completions earn treats; feeding treats restores its fullness and grows the pet from baby to teen to adult — bigger sprites plus a bandana at the teen stage and a golden heart badge as an adult. Fullness drains every day, so the pet gets hungry between visits but never dies, and you can switch pets at any time.
- In-app reminder toasts while the app is open, plus system notifications when permission is granted.
- Light, dark, and system themes with a no-flash startup.
- JSON backup export and restore from the Settings screen.
- A history view listing completed habits by day, including archived ones.
- Local-only data storage using IndexedDB. No account, backend, or network connection required for core features.

## Live app

The latest build is deployed to GitHub Pages: **https://echoanshu.github.io/Streakpet/**

Open it in a browser (e.g. Chrome on Android) and choose "Add to Home screen" / "Install app" to get the full offline PWA experience. Every push to `main` redeploys automatically via the workflow in `.github/workflows/deploy.yml`.

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

- Data lives in a single browser profile. Clearing site data removes it, and nothing is synchronized between devices; use the JSON backup export to move data manually.
- Streak calculations use each habit's current schedule for past days, so editing a schedule can change historical streaks.
- History shows each habit's latest name and archived status, not the name it had on the completion date.
- Installation and offline loading vary by browser and only work after the app has loaded online at least once.
- Reminders only ring while the app is open; there is no push notification server, and system notifications appear only if the browser grants permission.
- The year activity heatmap shows one habit at a time from the detail screen.

## Data and privacy

Habits and completion records are stored only in the current browser profile using IndexedDB. Data is not synchronized between devices, and clearing browser site data removes it.
