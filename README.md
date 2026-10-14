# Clippers &amp; Co. — Barbershop OS

A frontend-only dashboard for a barbershop: an internal tool for barbers to run their day.

## Features

- **Today** — day-at-a-glance stats + a tappable schedule timeline
- **Schedule** — full week of appointments
- **Clients** — client list with contact info, preferred style, visit count
- **Bookings** — book appointments (name / service / barber / date / time)
- **To-Do** — shop task list
- **Supplies** — inventory tracker with low-stock / out-of-stock flags

All data persists in your browser's `localStorage` — no backend, no database. It's fully functional as an internal tool (per-device).

## Tech

Plain HTML / CSS / vanilla JS. No build step, no dependencies.

## Run locally

Open `index.html` in a browser, or serve it:

```bash
npx serve .
```

## Deploy

Static site — deploys to Vercel or any static host as-is.
