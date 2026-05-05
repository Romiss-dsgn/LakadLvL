# LakadLvL MVP Plan

## Concept

LakadLvL is a gamified AI health coach for remote workers.
Users protect their HP, gain XP through daily habits, and receive coaching that reacts to their real check-in data.

The product pitch is simple:

"You cannot build from anywhere if you are running on empty."

## Core Product

### 1. HP + XP System

- HP is the health resource that reflects recovery and consistency.
- XP is earned through completing daily habits and quests.
- Level increases every 100 XP.
- The home dashboard shows:
  - HP bar
  - XP bar
  - Level
  - Daily quest progress

### 2. Daily Check-in

The user submits one check-in per day with:

- Sleep hours
- Water intake
- Mood score
- Activity log
- Optional movement distance

On submit, the app:

- Calculates a health score
- Saves the check-in to Supabase
- Updates HP and XP
- Generates AI advice

### 3. Daily Quests

Static quests keep the MVP reliable:

- Drink 2L water
- Sleep at least 7 hours
- Log 1 activity

Rewards:

- +10 XP per completed quest
- +20 XP bonus for completing all 3

### 4. AI Coach

The AI coach is the key differentiator.

It runs after check-in and returns short, practical coaching based on:

- Sleep
- Water
- Mood
- Activity

Target output:

- 2 to 3 sentences
- Specific
- Actionable
- Encouraging without sounding generic

Example:

"You slept only 5 hours and your energy is likely low. Try a 10-minute walk before noon and drink at least 1.5L today. Protect your focus hours by avoiding meetings early if possible."

## Current Implementation Status

### Implemented

- Expo React Native frontend with modular feature structure
- Supabase auth-based login flow
- Supabase-backed `profiles` and `daily_logs`
- HP / XP calculation and persistence
- AI coach client integration through Supabase Edge Functions
- Recovery story card on the home screen
- Demo history seeding for a 4-day burnout-to-recovery arc

### In Progress / Conditional

- Live Gemini only works when:
  - `ai-coach` edge function is deployed
  - `GEMINI_API_KEY` is configured in Supabase secrets

If the edge function is unavailable, the app falls back to local coaching text.

## Current Data Model

### `profiles`

- `id`
- `username`
- `hp`
- `xp`
- `created_at`
- `updated_at`

### `activities`

- `id`
- `user_id`
- `title`
- `distance_km`
- `xp_earned`
- `completed_at`

### `daily_logs`

- `id`
- `user_id`
- `log_date`
- `sleep_hours`
- `water_intake`
- `mood`
- `activity`
- `activity_km`
- `health_score`
- `ai_advice`
- `created_at`

## Demo Flow

### Launch

- App opens with LakadLvL branding
- Tagline: `Level up your health. Build from anywhere.`

### Login

- User signs in or creates an account
- Session persists through Supabase auth

### Home Dashboard

The judge immediately sees:

- HP
- XP
- Level
- Daily quests
- AI coach card
- Recovery story card

### Check-in

User logs:

- sleep
- water
- mood
- activity

### AI Moment

After submit:

- check-in is saved
- HP / XP update
- quests progress
- AI coach appears

### Narrative Layer

Optional demo enhancement:

- load demo history from the profile screen
- show a 4-day burnout-to-recovery story
- let the recovery story card support the spoken pitch

## Recommended Demo Strategy

For the strongest hackathon presentation:

1. Use the seeded demo history first so the app already has a visible arc.
2. Show the home dashboard and explain HP as the cost of neglect.
3. Submit one live check-in.
4. Show AI advice update in real time.
5. Return to the recovery story and explain the human impact.

## Tech Stack

- Frontend: Expo + React Native
- Backend: Supabase
- Auth: Supabase Auth
- Database: Supabase Postgres
- AI: Gemini via Supabase Edge Function
- State: local React state backed by Supabase reads/writes

## Repo Notes

- App code lives in `LakadLvL/`
- Supabase schema lives in `LakadLvL/supabase/mvp_schema.sql`
- Edge Function code lives in `LakadLvL/supabase/functions/ai-coach/index.ts`
