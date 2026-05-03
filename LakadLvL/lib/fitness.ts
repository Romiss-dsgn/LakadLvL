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
    mood: number;
    sleepHours: number;
    waterIntake: number;
  }
): Promise<{ awardedHp: boolean; latestLog: DailyLog; profile: Profile }> {
  const healthScore = calculateHealthScore(
    values.sleepHours,
    values.waterIntake,
    values.mood,
    values.activityKm
  );

  const { data: existingLog, error: existingLogError } = await supabase
    .from("daily_logs")
    .select("id")
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

  let profileData: Profile[] | null = null;

  if (!existingLog) {
    const { data, error: hpError } = await supabase.rpc("add_profile_hp", {
      user_id: userId,
      hp_to_add: DAILY_HP_REWARD,
    });

    if (hpError) {
      throw hpError;
    }

    profileData = data;
  } else {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      throw profileError;
    }

    profileData = [data];
  }

  const updatedProfile = profileData?.[0];

  if (!updatedProfile) {
    throw new Error("HP update did not return an updated profile.");
  }

  return {
    awardedHp: !existingLog,
    latestLog: logData,
    profile: updatedProfile,
  };
}
