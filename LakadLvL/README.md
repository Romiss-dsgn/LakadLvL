# LakadLvL App

This is the Expo + Supabase application for LakadLvL.

## What It Does

The current build includes:

- Supabase auth login and session persistence
- Supabase-backed `profiles` and `daily_logs`
- Daily check-ins with health score calculation
- HP and XP progression
- Static daily quests
- AI coach card fed by a Supabase Edge Function
- Recovery story card based on saved recent logs
- Demo-history seeding for a 4-day burnout-to-recovery narrative

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure env

Copy `.env.example` to `.env` and set:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Do not put the Gemini key in the Expo app env for production flow.
The AI function reads `GEMINI_API_KEY` from Supabase Edge Function secrets.

### 3. Apply Supabase schema

Open the Supabase SQL Editor and run:

- [`supabase/mvp_schema.sql`](./supabase/mvp_schema.sql)

This creates:

- `profiles`
- `activities`
- `daily_logs`
- `ai_advice` support
- HP / XP RPC functions
- RLS policies

### 4. Configure AI secret

In Supabase Edge Function Secrets, set:

```text
GEMINI_API_KEY=your-gemini-key
```

### 5. Deploy the edge function

Deploy a function named exactly:

```text
ai-coach
```

Use the code from:

- [`supabase/functions/ai-coach/index.ts`](./supabase/functions/ai-coach/index.ts)

## Run the App

```bash
npx expo start
```

## Demo Features

### Live Check-in

Saving a check-in will:

- write to `daily_logs`
- compute health score
- award HP and XP
- store AI advice
- refresh the home dashboard

### Demo History

From the profile screen, use `LOAD DEMO HISTORY` to seed 4 previous daily logs for the current signed-in user.

This is useful for:

- showing a burnout-to-recovery arc
- making the recovery story card more persuasive
- demoing more than a single-day interaction

## AI Behavior

The app tries to call the Supabase Edge Function first.

If the edge function is unavailable or fails, the app currently falls back to local coaching text.

UI badge meanings:

- `Live coach`: Gemini edge function succeeded
- `Fallback`: local fallback advice was used
- `Saved`: advice was loaded from an existing saved log

## Verification

These checks currently pass:

```bash
npm run lint
npx tsc --noEmit
```
