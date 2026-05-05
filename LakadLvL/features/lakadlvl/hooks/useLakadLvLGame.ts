import { useEffect, useMemo, useState } from "react";

import { generateAiCoachAdvice } from "@/lib/aiCoach";
import {
  ensureProfile,
  fetchDashboardData,
  seedDemoHistory,
  submitDailyCheckin,
} from "@/lib/fitness";
import { supabase } from "@/lib/supabase";
import type { DailyLog, Profile } from "@/lib/types";
import { TODAY_KEY } from "../constants";
import type {
  CheckinEntry,
  StoryDay,
  StoryInsight,
  TabKey,
  UserState,
} from "../types";
import {
  getAiInsight,
  getHpColor,
  getLevel,
  getQuestProgress,
  getQuestReward,
  getXpIntoLevel,
} from "../utils/game";

const emptyUser: UserState = {
  username: "Remote Worker",
  hpBase: 100,
  totalXp: 0,
  streak: 0,
  questsDone: 0,
  totalCheckins: 0,
  kmTotal: 0,
};

function toCheckinEntry(log: DailyLog): CheckinEntry {
  return {
    dateKey: log.log_date,
    sleepHours: log.sleep_hours,
    waterIntake: log.water_intake,
    mood: log.mood,
    activity: log.activity,
    activityKm: log.activity_km,
    healthScore: log.health_score,
  };
}

function getEmailName(email?: string | null) {
  return email?.split("@")[0] ?? "Remote Worker";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unknown error";
}

function getQuestDoneCount(logs: DailyLog[]) {
  return logs.reduce((total, log) => {
    return total + getQuestReward(getQuestProgress(toCheckinEntry(log))).completedCount;
  }, 0);
}

function getKmTotal(logs: DailyLog[]) {
  return Number(
    logs.reduce((total, log) => total + log.activity_km, 0).toFixed(1)
  );
}

function getStreak(logs: DailyLog[]) {
  if (!logs.length) {
    return 0;
  }

  const uniqueDates = [...new Set(logs.map((log) => log.log_date))].sort(
    (a, b) => b.localeCompare(a)
  );
  let streak = 0;
  let expectedDate = new Date();

  for (const dateKey of uniqueDates) {
    const expectedKey = expectedDate.toISOString().slice(0, 10);

    if (dateKey !== expectedKey) {
      if (streak === 0) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (dateKey !== yesterday.toISOString().slice(0, 10)) {
          break;
        }
      } else {
        break;
      }
    }

    streak += 1;
    expectedDate.setDate(expectedDate.getDate() - 1);
  }

  return streak;
}

function getRecentStoryDays(logs: DailyLog[], currentHp: number): StoryDay[] {
  const recentLogs = [...logs]
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
    .slice(-5);

  if (!recentLogs.length) {
    return [];
  }

  return recentLogs.map((log, index) => {
    const hpEstimate =
      recentLogs.length === 1
        ? currentHp
        : Math.round(50 + ((index + 1) / recentLogs.length) * (currentHp - 50));

    return {
      dayLabel: new Date(log.log_date).toLocaleDateString("en-US", {
        weekday: "short",
      }),
      hp: Math.max(0, Math.min(100, hpEstimate)),
      mood: log.mood,
      sleepHours: log.sleep_hours,
    };
  });
}

function getStoryInsight(logs: DailyLog[], currentHp: number): StoryInsight {
  const recentLogs = [...logs]
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
    .slice(-5);

  if (!recentLogs.length) {
    return {
      title: "Your Story Starts Today",
      body: "Log a few days and LakadLvL will turn those check-ins into a visible burnout-or-recovery narrative for your demo.",
      trend: "steady",
    };
  }

  const lastThree = recentLogs.slice(-3);
  const avgSleep =
    lastThree.reduce((sum, log) => sum + log.sleep_hours, 0) / lastThree.length;
  const avgMood =
    lastThree.reduce((sum, log) => sum + log.mood, 0) / lastThree.length;
  const improving =
    lastThree.length >= 2 &&
    lastThree[lastThree.length - 1].sleep_hours >= lastThree[0].sleep_hours &&
    lastThree[lastThree.length - 1].mood >= lastThree[0].mood;

  if (avgSleep < 6 || avgMood <= 2.5) {
    return {
      title: "Burnout Arc Detected",
      body: `The last few days show a worker running low. Average sleep is ${avgSleep.toFixed(1)} hours and mood is ${avgMood.toFixed(1)}/5, which makes the current HP pressure easy to explain to judges.`,
      trend: "warning",
    };
  }

  if (improving || currentHp >= 80) {
    return {
      title: "Recovery Arc Building",
      body: "Your recent logs show recovery, not collapse. Better sleep and steadier mood are turning LakadLvL into a story of momentum instead of survival.",
      trend: "recovery",
    };
  }

  return {
    title: "Steady Workload, Fragile Base",
    body: "The pattern is stable but not yet resilient. One or two stronger recovery days would visibly shift this story upward.",
    trend: "steady",
  };
}

function toUserState(
  profile: Profile,
  logs: DailyLog[],
  email?: string | null
): UserState {
  return {
    username: profile.username?.trim() || getEmailName(email),
    hpBase: profile.hp,
    totalXp: profile.xp,
    streak: getStreak(logs),
    questsDone: getQuestDoneCount(logs),
    totalCheckins: logs.length,
    kmTotal: getKmTotal(logs),
  };
}

export function useLakadLvLGame() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [user, setUser] = useState<UserState>(emptyUser);
  const [sleepHours, setSleepHours] = useState("");
  const [waterIntake, setWaterIntake] = useState("");
  const [mood, setMood] = useState(3);
  const [activity, setActivity] = useState("");
  const [activityKm, setActivityKm] = useState("0");
  const [lastEntry, setLastEntry] = useState<CheckinEntry | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<
    "gemini" | "fallback" | "saved" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [statusMessage, setStatusMessage] = useState(
    "No check-in yet today. LakadLvL will apply a -5 HP decay until you log one."
  );

  useEffect(() => {
    let isMounted = true;

    const hydrateSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (session?.user) {
        await loadDashboard(session.user.id, session.user.email);
      } else {
        setSessionUserId(null);
        setIsAuthLoading(false);
      }
    };

    void hydrateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void loadDashboard(session.user.id, session.user.email);
      } else {
        setSessionUserId(null);
        setUser(emptyUser);
        setLastEntry(null);
        setAiAdvice(null);
        setAiSource(null);
        setRecentLogs([]);
        setSleepHours("");
        setWaterIntake("");
        setMood(3);
        setActivity("");
        setActivityKm("0");
        setIsAuthLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const didCheckInToday = lastEntry?.dateKey === TODAY_KEY;
  const isAuthenticated = Boolean(sessionUserId);
  const displayedHp = didCheckInToday
    ? user.hpBase
    : Math.max(0, user.hpBase - 5);
  const quests = useMemo(() => getQuestProgress(lastEntry), [lastEntry]);
  const reward = useMemo(() => getQuestReward(quests), [quests]);
  const level = getLevel(user.totalXp);
  const xpIntoLevel = getXpIntoLevel(user.totalXp);
  const hpColor = getHpColor(displayedHp);
  const storyDays = useMemo(
    () => getRecentStoryDays(recentLogs, displayedHp),
    [displayedHp, recentLogs]
  );
  const storyInsight = useMemo(
    () => getStoryInsight(recentLogs, displayedHp),
    [displayedHp, recentLogs]
  );
  const defaultAiInsight = getAiInsight(lastEntry, displayedHp, quests);
  const aiInsight = aiAdvice
    ? {
        title:
          aiSource === "gemini"
            ? "Today's AI Guidance"
            : aiSource === "saved"
              ? "Latest AI Guidance"
              : "Offline Coach Guidance",
        body: aiAdvice,
        tag:
          aiSource === "gemini"
            ? "Live coach"
            : aiSource === "saved"
              ? "Saved"
              : "Fallback",
      }
    : defaultAiInsight;

  const loadDashboard = async (userId: string, email?: string | null) => {
    setIsAuthLoading(true);
    setIsDashboardLoading(true);
    setSessionUserId(userId);
    setAuthError(null);

    try {
      await ensureProfile(userId, getEmailName(email));
      const dashboard = await fetchDashboardData(userId);
      const todayLog =
        dashboard.logs.find((log) => log.log_date === TODAY_KEY) ?? null;
      const latestLog = todayLog ?? dashboard.logs[0] ?? null;

      setUser(toUserState(dashboard.profile, dashboard.logs, email));
      setRecentLogs(dashboard.logs);
      setLastEntry(latestLog ? toCheckinEntry(latestLog) : null);
      setAiAdvice(latestLog?.ai_advice ?? null);
      setAiSource(latestLog?.ai_advice ? "saved" : null);
      setSleepHours(todayLog ? String(todayLog.sleep_hours) : "");
      setWaterIntake(todayLog ? String(todayLog.water_intake) : "");
      setMood(todayLog?.mood ?? 3);
      setActivity(todayLog?.activity ?? "");
      setActivityKm(todayLog ? String(todayLog.activity_km) : "0");
      setStatusMessage(
        todayLog
          ? "Today's check-in loaded from Supabase."
          : "No check-in yet today. LakadLvL will apply a -5 HP decay until you log one."
      );
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setIsAuthLoading(false);
      setIsDashboardLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setAuthError(null);
    setIsAuthLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setAuthError("Enter both email and password.");
      setIsAuthLoading(false);
      return;
    }

    const signInResult = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (!signInResult.error) {
      return;
    }

    const signUpResult = await supabase.auth.signUp({
      email: normalizedEmail,
      password: normalizedPassword,
      options: {
        data: {
          username: getEmailName(normalizedEmail),
        },
      },
    });

    if (signUpResult.error) {
      setAuthError(getErrorMessage(signInResult.error));
      setIsAuthLoading(false);
      return;
    }

    if (!signUpResult.data.session) {
      setAuthError(
        "Account created. Disable email confirmation in Supabase Auth or confirm the account before logging in."
      );
      setIsAuthLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const loadDemoHistory = async () => {
    if (!sessionUserId) {
      setStatusMessage("Log in before loading demo history.");
      return;
    }

    setIsSeedingDemo(true);

    try {
      await seedDemoHistory(sessionUserId);
      await loadDashboard(sessionUserId);
      setStatusMessage(
        "Demo history loaded. Your dashboard now shows a 4-day burnout-to-recovery arc."
      );
      setActiveTab("home");
    } catch (error) {
      setStatusMessage(`Failed to load demo history: ${getErrorMessage(error)}`);
    } finally {
      setIsSeedingDemo(false);
    }
  };

  const submitCheckin = async () => {
    if (!sessionUserId) {
      setStatusMessage("Log in before saving a check-in.");
      return;
    }

    const parsedSleep = Number.parseFloat(sleepHours);
    const parsedWater = Number.parseFloat(waterIntake);
    const parsedKm = Number.parseFloat(activityKm || "0");

    if (
      Number.isNaN(parsedSleep) ||
      Number.isNaN(parsedWater) ||
      Number.isNaN(parsedKm) ||
      !activity.trim()
    ) {
      setStatusMessage(
        "Complete sleep, water, activity text, and distance before saving the daily check-in."
      );
      return;
    }

    setIsSubmitting(true);
    setIsAiLoading(true);

    try {
      const coachResult = await generateAiCoachAdvice({
        activity: activity.trim(),
        activityKm: parsedKm,
        mood,
        sleepHours: parsedSleep,
        waterIntake: parsedWater,
      });

      const result = await submitDailyCheckin(sessionUserId, {
        activity: activity.trim(),
        activityKm: parsedKm,
        aiAdvice: coachResult.advice,
        mood,
        sleepHours: parsedSleep,
        waterIntake: parsedWater,
      });

      await loadDashboard(sessionUserId);
      setAiAdvice(coachResult.advice);
      setAiSource(coachResult.source);
      setStatusMessage(
        result.awardedHp
          ? `Check-in saved to Supabase. HP restored, health score ${result.latestLog.health_score}, rewards +${result.gainedXp} XP.`
          : `Check-in updated in Supabase. Health score ${result.latestLog.health_score}, additional rewards claimed: +${result.gainedXp} XP.`
      );
      setActiveTab("home");
    } catch (error) {
      setStatusMessage(`Failed to save your check-in: ${getErrorMessage(error)}`);
    } finally {
      setIsAiLoading(false);
      setIsSubmitting(false);
    }
  };

  return {
    activeTab,
    activity,
    activityKm,
    authError,
    aiInsight,
    aiSource,
    didCheckInToday,
    displayedHp,
    hpColor,
    isAuthenticated,
    isAuthLoading,
    isAiLoading,
    isDashboardLoading,
    isSeedingDemo,
    isSubmitting,
    lastEntry,
    level,
    loadDemoHistory,
    login,
    mood,
    logout,
    quests,
    reward,
    storyDays,
    storyInsight,
    setActiveTab,
    setActivity,
    setActivityKm,
    setMood,
    setSleepHours,
    setWaterIntake,
    sleepHours,
    statusMessage,
    submitCheckin,
    user,
    waterIntake,
    xpIntoLevel,
  };
}
