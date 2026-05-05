import { supabase } from "@/lib/supabase";
import type { Activity, DailyLog, Profile } from "@/lib/types";

const TODAY_KEY = new Date().toISOString().slice(0, 10);
const RUN_XP_PER_KM = 50;
const DAILY_HP_REWARD = 10;

export type DashboardData = {
  activities: Activity[];
  logs: DailyLog[];
  profile: Profile;
};

function getQuestXpFromLog(values: {
  activity: string;
  sleepHours: number;
  waterIntake: number;
}) {
  const completedCount = [
    values.waterIntake >= 2,
    values.sleepHours >= 7,
    values.activity.trim().length > 0,
  ].filter(Boolean).length;
  const baseXp = completedCount * 10;
  const bonusXp = completedCount === 3 ? 20 : 0;

  return {
    completedCount,
    totalXp: baseXp + bonusXp,
  };
}

const demoHistorySeed = [
  {
    activity: "Skipped movement and worked late",
    activityKm: 0,
    aiAdvice:
      "You are depleted. Strip the day down to essentials, hydrate earlier, and protect your evening so you can recover sleep tonight.",
    dayOffset: 4,
    mood: 1,
    sleepHours: 4.5,
    waterIntake: 0.8,
  },
  {
    activity: "Sat through meetings all day",
    activityKm: 0,
    aiAdvice:
      "This looks like a second low-energy day in a row. A short walk and an earlier shutdown will do more for tomorrow than pushing harder tonight.",
    dayOffset: 3,
    mood: 2,
    sleepHours: 5.2,
    waterIntake: 1.0,
  },
  {
    activity: "Took a 10-minute walk after lunch",
    activityKm: 0.7,
    aiAdvice:
      "You are starting to recover. Keep the movement light, hit your water target, and aim for at least 7 hours tonight to keep the rebound going.",
    dayOffset: 2,
    mood: 3,
    sleepHours: 6.4,
    waterIntake: 1.8,
  },
  {
    activity: "Walked before dinner and logged off on time",
    activityKm: 1.4,
    aiAdvice:
      "Recovery is visible now. Protect this rhythm by keeping your first work block focused and preserving the sleep gain tonight.",
    dayOffset: 1,
    mood: 4,
    sleepHours: 7.3,
    waterIntake: 2.2,
  },
] as const;

export const calculateHealthScore = (
  sleepHours: number,
  waterIntake: number,
  mood: number,
  activityKm: number
) => {
  const sleepScore = Math.min((sleepHours / 8) * 100, 100);
  const waterScore = Math.min((waterIntake / 2) * 100, 100);
  const moodScore = (mood / 5) * 100;
  const activityScore = activityKm > 0 ? Math.min(activityKm * 100, 100) : 60;

  return Math.round(
    sleepScore * 0.35 +
      waterScore * 0.3 +
      moodScore * 0.2 +
      activityScore * 0.15
  );
};

export async function ensureProfile(userId: string, username?: string | null) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      username: username?.trim() || null,
    },
    {
      onConflict: "id",
      ignoreDuplicates: false,
    }
  );

  if (error) {
    throw error;
  }
}

export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const [profileResult, activityResult, logResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("activities")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false }),
    supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", userId)
      .order("log_date", { ascending: false }),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (activityResult.error) {
    throw activityResult.error;
  }

  if (logResult.error) {
    throw logResult.error;
  }

  return {
    profile: profileResult.data,
    activities: activityResult.data ?? [],
    logs: logResult.data ?? [],
  };
}

export async function submitRun(
  userId: string,
  title: string,
  distanceKm: number
): Promise<Profile> {
  const xpEarned = Math.round(distanceKm * RUN_XP_PER_KM);

  const { error: activityError } = await supabase.from("activities").insert({
    user_id: userId,
    title: title.trim(),
    distance_km: distanceKm,
    xp_earned: xpEarned,
  });

  if (activityError) {
    throw activityError;
  }

  const { data, error } = await supabase.rpc("add_profile_xp", {
    user_id: userId,
    xp_to_add: xpEarned,
  });

  if (error) {
    throw error;
  }

  const updatedProfile = data?.[0];

  if (!updatedProfile) {
    throw new Error("XP update did not return an updated profile.");
  }

  return updatedProfile;
}

export async function submitDailyCheckin(
  userId: string,
  values: {
    activity: string;
    activityKm: number;
    aiAdvice?: string | null;
    mood: number;
    sleepHours: number;
    waterIntake: number;
  }
): Promise<{
  awardedHp: boolean;
  gainedXp: number;
  latestLog: DailyLog;
  profile: Profile;
}> {
  const healthScore = calculateHealthScore(
    values.sleepHours,
    values.waterIntake,
    values.mood,
    values.activityKm
  );

  const { data: existingLog, error: existingLogError } = await supabase
    .from("daily_logs")
    .select("id, activity, sleep_hours, water_intake")
    .eq("user_id", userId)
    .eq("log_date", TODAY_KEY)
    .maybeSingle();

  if (existingLogError) {
    throw existingLogError;
  }

  const { data: logData, error: logError } = await supabase
    .from("daily_logs")
    .upsert(
      {
        user_id: userId,
        log_date: TODAY_KEY,
        sleep_hours: values.sleepHours,
        water_intake: values.waterIntake,
        mood: values.mood,
        activity: values.activity.trim(),
        activity_km: values.activityKm,
        health_score: healthScore,
        ai_advice: values.aiAdvice ?? null,
      },
      {
        onConflict: "user_id,log_date",
      }
    )
    .select()
    .single();

  if (logError) {
    throw logError;
  }

  const previousQuestXp = existingLog
    ? getQuestXpFromLog({
        activity: existingLog.activity,
        sleepHours: existingLog.sleep_hours,
        waterIntake: existingLog.water_intake,
      }).totalXp
    : 0;

  const nextQuestXp = getQuestXpFromLog({
    activity: values.activity,
    sleepHours: values.sleepHours,
    waterIntake: values.waterIntake,
  }).totalXp;

  const gainedXp = Math.max(0, nextQuestXp - previousQuestXp);

  if (!existingLog) {
    const { error: hpError } = await supabase.rpc("add_profile_hp", {
      user_id: userId,
      hp_to_add: DAILY_HP_REWARD,
    });

    if (hpError) {
      throw hpError;
    }
  }

  if (gainedXp > 0) {
    const { error: xpError } = await supabase.rpc("add_profile_xp", {
      user_id: userId,
      xp_to_add: gainedXp,
    });

    if (xpError) {
      throw xpError;
    }
  }

  const { data: updatedProfile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    throw profileError;
  }

  if (!updatedProfile) {
    throw new Error("HP update did not return an updated profile.");
  }

  return {
    awardedHp: !existingLog,
    gainedXp,
    latestLog: logData,
    profile: updatedProfile,
  };
}

export async function seedDemoHistory(userId: string): Promise<Profile> {
  const existingDates = demoHistorySeed.map((entry) => {
    const date = new Date();
    date.setDate(date.getDate() - entry.dayOffset);
    return date.toISOString().slice(0, 10);
  });

  const { data: existingLogs, error: existingLogsError } = await supabase
    .from("daily_logs")
    .select("log_date")
    .eq("user_id", userId)
    .in("log_date", existingDates);

  if (existingLogsError) {
    throw existingLogsError;
  }

  const existingDateSet = new Set((existingLogs ?? []).map((log) => log.log_date));

  const logsToInsert = demoHistorySeed
    .filter((entry) => {
      const date = new Date();
      date.setDate(date.getDate() - entry.dayOffset);
      return !existingDateSet.has(date.toISOString().slice(0, 10));
    })
    .map((entry) => {
      const logDate = new Date();
      logDate.setDate(logDate.getDate() - entry.dayOffset);

      return {
        user_id: userId,
        log_date: logDate.toISOString().slice(0, 10),
        sleep_hours: entry.sleepHours,
        water_intake: entry.waterIntake,
        mood: entry.mood,
        activity: entry.activity,
        activity_km: entry.activityKm,
        health_score: calculateHealthScore(
          entry.sleepHours,
          entry.waterIntake,
          entry.mood,
          entry.activityKm
        ),
        ai_advice: entry.aiAdvice,
      };
    });

  if (logsToInsert.length) {
    const { error: insertError } = await supabase
      .from("daily_logs")
      .insert(logsToInsert);

    if (insertError) {
      throw insertError;
    }

    const gainedXp = logsToInsert.reduce((total, log) => {
      return (
        total +
        getQuestXpFromLog({
          activity: log.activity,
          sleepHours: log.sleep_hours,
          waterIntake: log.water_intake,
        }).totalXp
      );
    }, 0);

    if (gainedXp > 0) {
      const { error: xpError } = await supabase.rpc("add_profile_xp", {
        user_id: userId,
        xp_to_add: gainedXp,
      });

      if (xpError) {
        throw xpError;
      }
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    throw profileError;
  }

  return profile;
}
