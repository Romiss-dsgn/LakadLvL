# LakadLvL MVP Backend Integration

This Expo frontend is now wired for a simple Supabase-backed MVP:

- Supabase Auth for sign up, sign in, and session persistence
- `profiles` for user data with HP and XP
- `activities` for completed runs
- `daily_logs` for daily health check-ins
- RPC functions to update HP and XP

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor and run [supabase/mvp_schema.sql](./supabase/mvp_schema.sql).
3. Copy [.env.example](./.env.example) to `.env` and set:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Local run

```bash
npm install
npx expo start
```

## Connected app flows

- Authentication uses Supabase Auth directly from the Expo app.
- Saving a run inserts into `activities` and calls `add_profile_xp`.
- Saving a daily check-in upserts into `daily_logs` and calls `add_profile_hp`.
- The home and profile screens fetch live data from `profiles`, `activities`, and `daily_logs`.

## Verification

These checks pass in the current project:

```bash
npm run lint
npx tsc --noEmit
```
