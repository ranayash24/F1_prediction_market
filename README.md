# Redline Markets

**Live site: [https://redlinem.netlify.app/](https://redlinem.netlify.app/)**

F1-inspired prediction market demo with a multi-page Next.js UI, GP Coins economy, and Polymarket-style trading cards. The frontend can run standalone, or be paired with the optional Spring Boot backend for markets, trades, and chat.

## Features
- Multi-page app: landing, markets, my bets, leaderboard, wallet.
- GP Coins balance (1,000 GP on signup) with Stripe checkout integration.
- Firebase Auth (Google/Apple/Facebook + email/password).
- 2026 season market boards (3 markets per round).
- Live telemetry panel (demo feed or external API).
- Security headers + basic API rate limiting.

## Tech stack
- Next.js + React + TypeScript UI.
- Firebase Auth for identity.
- Stripe checkout for top-ups.
- Spring Boot backend with REST + WebSocket chat (optional).
- SockJS + STOMP for live chat updates.

## Project structure
- `src/` Next.js app and UI components.
- `backend/` Spring Boot API for markets, trades, wallet, and chat.
- `legacy-static/` static legacy assets (kept for reference).

## Getting started (frontend)
```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Backend (optional)
Requires Java 17.

```bash
cd backend
./gradlew bootRun
```

Server starts on `http://localhost:8081`. Backend config, endpoints, and WebSocket details are in `backend/README.md`.

## Environment variables
Copy `.env.example` to `.env.local` and fill in keys.

- `NEXT_PUBLIC_FIREBASE_*` for Firebase Auth.
- `STRIPE_SECRET_KEY` for Stripe checkout.
- `TELEMETRY_API_URL` for a real telemetry feed (optional).

## Notes
- The telemetry panel uses a simulated feed unless `TELEMETRY_API_URL` is set.
- Stripe checkout is wired, but balance settlement should be handled via webhook in production.
