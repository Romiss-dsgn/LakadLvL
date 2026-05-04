# LakadLvL — MVP Plan (5-Day Hackathon)

## 🎯 Concept

A gamified health + productivity app for remote workers.
Users maintain **HP (health)** and gain **XP (progress)** through daily habits.
Enhanced with **AI coaching (Gemini)** to provide personalized insights and guidance.

---

## 🧩 Core Features (ONLY 4 — includes AI)

### 1. 🎮 HP + XP System

- HP (0–100):
  - -5/day if no check-in
  - +10 if full check-in completed

- XP:
  - +10 per completed habit
  - Level up every 100 XP

- UI:
  - HP bar (green → red)
  - XP progress bar / level indicator

---

### 2. 📝 Daily Check-in

User inputs (once per day):

- Sleep hours
- Water intake (liters)
- Mood (1–5 scale)
- Activity (text or simple km input)

Logic:

- Save entry to database
- Calculate “Health Score”
- Trigger HP/XP update

---

### 3. 🎯 Daily Quests

Static (simple, reliable):

- Drink 2L water
- Sleep ≥ 7 hours
- Log 1 activity

Logic:

- Each quest = +10 XP
- Completing all = bonus +20 XP
- Visual checkmarks on completion

---

### 4. 🤖 AI Coach (Gemini) — **WINNING FEATURE**

Turns the app from tracker → intelligent assistant.

#### Purpose

Provide **personalized, actionable health & productivity advice** based on user check-in.

#### When it runs

- AFTER user submits daily check-in (1 API call/day only)

#### Input (from app)

- Sleep hours
- Water intake
- Mood
- Activity

#### Output (shown in UI)

Short advice card:

- 2–3 sentences
- Specific + actionable
- Encouraging tone

#### Example Output

“You slept only 5 hours and logged low hydration. Try aiming for 7 hours tonight and drink at least 1.5L earlier in the day. A short walk may help improve your mood.”

---

## 🧠 Gemini Integration (Correct + Winning Usage)

### ✅ Why this works

- Context-aware (uses real user data)
- Minimal API calls (fast + reliable)
- High demo impact (“AI insight” moment)

### ❌ Avoid

- Generic chatbot
- Multiple API calls per screen
- Overly long responses

---

## 🔧 Gemini Implementation

### Backend (API / Edge Function)

- Store API key securely (DO NOT expose in frontend)
- Create endpoint: `/api/ai-coach`

### Prompt Template

```
You are a health and productivity coach for remote workers.

User data:
- Sleep: {sleep} hours
- Water: {water} liters
- Mood: {mood}/5
- Activity: {activity}

Give short, actionable advice (2-3 sentences).
Focus on improving energy, health, and productivity.
Be encouraging but practical.
```

### Flow

User submits check-in → Save to DB → Call Gemini → Return advice → Display in UI

---

## 🛠️ Tech Stack

- Frontend: React Native (Expo)
- Backend: Supabase (Auth + DB)
- AI: Gemini API (via Node API / Edge Function)
- State: Zustand or Context API

---

## 🗃️ Database (Minimal)

### users

- id
- username
- hp
- xp
- level

### checkins

- id
- user_id
- sleep_hours
- water_intake
- mood
- activity
- ai_advice (text)
- created_at

---

## 📅 5-Day Sprint Plan

### Day 1 — Setup

- Initialize Expo app
- Setup Supabase (Auth + DB)
- Create navigation (Home, Check-in, Profile)

---

### Day 2 — Check-in Feature

- Build check-in form
- Save data to DB
- Compute health score

---

### Day 3 — HP + XP System

- Implement HP/XP logic
- Display HP bar + XP progress
- Level system

---

### Day 4 — Quests + Gemini

- Implement 3 static quests
- Create `/api/ai-coach` endpoint
- Integrate Gemini API
- Show AI advice card after check-in

---

### Day 5 — Polish + Demo

- Home dashboard:
  - HP bar
  - XP ring
  - Quest list
  - 🤖 AI advice card (highlight)

- Seed demo data
- Full demo flow testing
- Prepare pitch

---

## 🎤 Demo Flow (IMPORTANT)

1. User logs in
2. Completes daily check-in
3. Quests auto-complete
4. HP increases + XP gained
5. 🤖 AI Coach appears with personalized advice ← **WOW MOMENT**
6. Level-up animation

---

## 🧠 Notes

- Prioritize **working flow over features**
- Gemini = **1 call per check-in only**
- AI advice must feel **personalized, not generic**
- Focus on **smooth demo + clear value**

---

## 🏁 Winning Edge

“LakadLvL doesn’t just track your habits — it guides you.
With AI-powered coaching, it helps remote workers stay healthy, focused, and productive anywhere.”
