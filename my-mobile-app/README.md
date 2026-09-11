# XactScore mobile (Expo)

Native companion app for [XactScore](https://xactscore.app) — Premier League score predictions with friends.

## Stack

- Expo SDK 57 + Expo Router (native tabs)
- Supabase Auth + Postgres (same project as the web app)

## Setup

1. `npm install`
2. Copy env values from the web app into `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_SITE_URL=https://xactscore.app
```

3. Start:

```bash
npx expo start
```

## Core screens

| Tab | Purpose |
| --- | --- |
| Home | Welcome + league summary |
| Leagues | Contests you belong to |
| Messages | League message list |
| Profile | Account + sign out |

Auth gate shows Sign In / Sign Up when there is no session.

## Docs

Read Expo SDK 57 docs before changing native APIs: https://docs.expo.dev/versions/v57.0.0/
